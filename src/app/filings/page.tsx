/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Send, FileText, Clock, CheckCircle, Trash2, Download, Eye, Edit, RefreshCw, Loader2, ExternalLink, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AddFilingDialog } from '@/components/forms/AddFilingDialog';

interface Filing {
  id: string;
  case_id: string;
  filing_type: string;
  title: string;
  description: string | null;
  prepared_by: string | null;
  prepared_date: string | null;
  submitted_to: string | null;
  submission_date: string | null;
  filing_number: string | null;
  court_filing_date: string | null;
  status: string;
  status_notes: string | null;
  file_url: string | null;
  notes: string | null;
  created_at: string;
  cases?: { case_number: string; title: string };
  external_lawyers?: { name: string; organization: string };
}

export default function FilingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewFiling, setViewFiling] = useState<Filing | null>(null);
  const [editFiling, setEditFiling] = useState<Filing | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    filing_type: '',
    filing_number: '',
    status: '',
    status_notes: '',
    notes: '',
  });
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    submitted: 0,
    filed: 0
  });

  useEffect(() => {
    void checkAuth();
    void loadFilings();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/login');
  };

  const loadFilings = async () => {
    try {
      // Try with the foreign key joins first
      let { data, error } = await (supabase as any)
        .from('filings')
        .select('*, cases(case_number, title), external_lawyers(name, organization)')
        .order('created_at', { ascending: false });

      // If a FK relationship doesn't exist, fall back to manual merge
      if (error && (error.code === 'PGRST200' || error.message?.includes('relationship'))) {
        console.warn('FK relationship missing, fetching related data separately');

        const { data: filingsData, error: filingsError } = await (supabase as any)
          .from('filings')
          .select('*')
          .order('created_at', { ascending: false });

        if (filingsError) throw filingsError;

        // Fetch cases and lawyers to merge
        const [casesRes, lawyersRes] = await Promise.all([
          (supabase as any).from('cases').select('id, case_number, title'),
          (supabase as any).from('external_lawyers').select('id, name, organization'),
        ]);

        const caseMap = new Map(
          (casesRes.data || []).map((c: any) => [c.id, { case_number: c.case_number, title: c.title }])
        );
        const lawyerMap = new Map(
          (lawyersRes.data || []).map((l: any) => [l.id, { name: l.name, organization: l.organization }])
        );

        data = (filingsData || []).map((f: any) => ({
          ...f,
          cases: f.case_id ? caseMap.get(f.case_id) || null : null,
          external_lawyers: f.submitted_to ? lawyerMap.get(f.submitted_to) || null : null,
        }));
        error = null;
      }

      if (error) throw error;
      setFilings(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading filings:', error);
      toast.error('Failed to load filings');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Filing[]) => {
    setStats({
      total: data.length,
      draft: data.filter(f => f.status === 'draft').length,
      submitted: data.filter(f => f.status === 'submitted').length,
      filed: data.filter(f => f.status === 'filed').length
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      prepared: 'bg-blue-100 text-blue-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      filed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return styles[status] || styles.draft;
  };

  const getFilingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      instruction_letter: 'Instruction Letter',
      affidavit: 'Affidavit',
      motion: 'Motion',
      response: 'Response',
      brief: 'Brief',
      notice: 'Notice',
      other: 'Other',
    };
    return labels[type] || type.replace('_', ' ');
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('filings')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast.success('Filing deleted successfully');
      setDeleteId(null);
      void loadFilings();
    } catch (error) {
      console.error('Error deleting filing:', error);
      toast.error('Failed to delete filing');
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const updateData: Record<string, any> = {
        status: newStatus,
        status_update_date: new Date().toISOString()
      };

      if (newStatus === 'submitted') {
        updateData.submission_date = new Date().toISOString();
      } else if (newStatus === 'filed') {
        updateData.court_filing_date = new Date().toISOString();
      }

      const { error } = await (supabase as any)
        .from('filings')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Status updated successfully');
      void loadFilings();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const openEditDialog = (filing: Filing) => {
    setEditFiling(filing);
    setEditFormData({
      title: filing.title || '',
      description: filing.description || '',
      filing_type: filing.filing_type || '',
      filing_number: filing.filing_number || '',
      status: filing.status || 'draft',
      status_notes: filing.status_notes || '',
      notes: filing.notes || '',
    });
  };

  const handleEditSubmit = async () => {
    if (!editFiling) return;
    setSaving(true);

    try {
      const updateData: Record<string, any> = {
        title: editFormData.title,
        description: editFormData.description || null,
        filing_type: editFormData.filing_type,
        filing_number: editFormData.filing_number || null,
        status: editFormData.status,
        status_notes: editFormData.status_notes || null,
        notes: editFormData.notes || null,
      };

      // Update dates based on status changes
      if (editFormData.status !== editFiling.status) {
        updateData.status_update_date = new Date().toISOString();
        if (editFormData.status === 'submitted' && !editFiling.submission_date) {
          updateData.submission_date = new Date().toISOString();
        }
        if (editFormData.status === 'filed' && !editFiling.court_filing_date) {
          updateData.court_filing_date = new Date().toISOString();
        }
      }

      const { error } = await (supabase as any)
        .from('filings')
        .update(updateData)
        .eq('id', editFiling.id);

      if (error) throw error;

      toast.success('Filing updated successfully');
      setEditFiling(null);
      void loadFilings();
    } catch (error) {
      console.error('Error updating filing:', error);
      toast.error('Failed to update filing');
    } finally {
      setSaving(false);
    }
  };

  // Filter filings based on search query and status
  const filteredFilings = filings.filter((filing) => {
    const matchesSearch = !searchQuery ||
      filing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (filing.filing_number && filing.filing_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (filing.cases?.case_number && filing.cases.case_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      filing.filing_type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || filing.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Filings</h1>
            <p className="text-slate-600 mt-1">Track instruction letters, affidavits, and court filings</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => loadFilings()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2" style={{ background: '#EF5A5A' }}>
              <Plus className="h-4 w-4" />
              Create Filing
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => setStatusFilter('all')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Filings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Send className="h-8 w-8 text-blue-500" />
                <div className="text-3xl font-bold">{stats.total}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-gray-300 transition-colors" onClick={() => setStatusFilter('draft')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-gray-500" />
                <div className="text-3xl font-bold">{stats.draft}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-yellow-300 transition-colors" onClick={() => setStatusFilter('submitted')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div className="text-3xl font-bold">{stats.submitted}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-green-300 transition-colors" onClick={() => setStatusFilter('filed')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Filed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="text-3xl font-bold">{stats.filed}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Filing Register</CardTitle>
                <CardDescription>
                  {filteredFilings.length} of {filings.length} filings
                  {statusFilter !== 'all' && ` (filtered by ${statusFilter})`}
                </CardDescription>
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="prepared">Prepared</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="filed">Filed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search filings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredFilings.map((filing) => (
                <div key={filing.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-semibold text-slate-900">{filing.title}</span>
                        <Badge className="bg-purple-100 text-purple-800">
                          {getFilingTypeLabel(filing.filing_type)}
                        </Badge>
                        <Badge className={getStatusBadge(filing.status)}>
                          {filing.status.toUpperCase()}
                        </Badge>
                      </div>

                      {/* Case Information */}
                      {filing.cases && (
                        <div className="flex items-center gap-2 text-sm text-slate-700 mb-2">
                          <Briefcase className="h-4 w-4 text-slate-400" />
                          <span>{filing.cases.case_number} - {filing.cases.title}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                        {filing.prepared_date && (
                          <span>Prepared: {format(new Date(filing.prepared_date), 'MMM d, yyyy')}</span>
                        )}
                        {filing.submission_date && (
                          <span>Submitted: {format(new Date(filing.submission_date), 'MMM d, yyyy')}</span>
                        )}
                        {filing.court_filing_date && (
                          <span>Filed: {format(new Date(filing.court_filing_date), 'MMM d, yyyy')}</span>
                        )}
                        {filing.filing_number && (
                          <span className="font-medium">Filing #: {filing.filing_number}</span>
                        )}
                        {filing.external_lawyers && (
                          <span>To: {filing.external_lawyers.name}</span>
                        )}
                      </div>

                      {filing.description && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-1">{filing.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0 ml-4">
                      {/* View Button */}
                      <Button variant="outline" size="sm" onClick={() => setViewFiling(filing)} title="View Details">
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Edit Button */}
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(filing)} title="Edit">
                        <Edit className="h-4 w-4" />
                      </Button>

                      {/* Status Update Buttons */}
                      {filing.status === 'draft' && (
                        <Button size="sm" onClick={() => updateStatus(filing.id, 'prepared')} style={{ background: '#EF5A5A' }}>
                          Mark Prepared
                        </Button>
                      )}
                      {filing.status === 'prepared' && (
                        <Button size="sm" onClick={() => updateStatus(filing.id, 'submitted')} style={{ background: '#EF5A5A' }}>
                          Submit
                        </Button>
                      )}
                      {filing.status === 'submitted' && (
                        <Button size="sm" onClick={() => updateStatus(filing.id, 'filed')} style={{ background: '#10B981' }}>
                          Mark Filed
                        </Button>
                      )}

                      {/* Download Button */}
                      {filing.file_url && (
                        <Button variant="outline" size="sm" asChild title="Download Document">
                          <a href={filing.file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}

                      {/* Delete Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteId(filing.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredFilings.length === 0 && (
                <div className="text-center py-12 text-slate-600">
                  <Send className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <p>{filings.length === 0 ? 'No filings found' : 'No filings match your search'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Filing Dialog */}
      {showAddDialog && (
        <AddFilingDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={() => {
            setShowAddDialog(false);
            void loadFilings();
          }}
        />
      )}

      {/* View Filing Dialog */}
      <Dialog open={!!viewFiling} onOpenChange={() => setViewFiling(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filing Details</DialogTitle>
            <DialogDescription>
              Complete information about this filing
            </DialogDescription>
          </DialogHeader>
          {viewFiling && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-purple-100 text-purple-800 text-sm">
                  {getFilingTypeLabel(viewFiling.filing_type)}
                </Badge>
                <Badge className={`${getStatusBadge(viewFiling.status)} text-sm`}>
                  {viewFiling.status.toUpperCase()}
                </Badge>
                {viewFiling.filing_number && (
                  <Badge variant="outline">#{viewFiling.filing_number}</Badge>
                )}
              </div>

              {/* Title */}
              <div>
                <Label className="text-xs text-muted-foreground">Title</Label>
                <p className="font-semibold text-lg">{viewFiling.title}</p>
              </div>

              {/* Case Information */}
              {viewFiling.cases && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <Label className="text-xs text-muted-foreground">Related Case</Label>
                  <p className="font-medium">{viewFiling.cases.case_number}</p>
                  <p className="text-sm text-slate-600">{viewFiling.cases.title}</p>
                </div>
              )}

              {/* Description */}
              {viewFiling.description && (
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <p className="text-sm whitespace-pre-wrap">{viewFiling.description}</p>
                </div>
              )}

              {/* Dates Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {viewFiling.prepared_date && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Prepared Date</Label>
                    <p className="font-medium">{format(new Date(viewFiling.prepared_date), 'PPP')}</p>
                  </div>
                )}
                {viewFiling.submission_date && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Submission Date</Label>
                    <p className="font-medium">{format(new Date(viewFiling.submission_date), 'PPP')}</p>
                  </div>
                )}
                {viewFiling.court_filing_date && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Court Filing Date</Label>
                    <p className="font-medium">{format(new Date(viewFiling.court_filing_date), 'PPP')}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <p className="font-medium">{format(new Date(viewFiling.created_at), 'PPP')}</p>
                </div>
              </div>

              {/* Submitted To */}
              {viewFiling.external_lawyers && (
                <div>
                  <Label className="text-xs text-muted-foreground">Submitted To</Label>
                  <p className="font-medium">{viewFiling.external_lawyers.name}</p>
                  <p className="text-sm text-slate-600">{viewFiling.external_lawyers.organization}</p>
                </div>
              )}

              {/* Status Notes */}
              {viewFiling.status_notes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Status Notes</Label>
                  <p className="text-sm whitespace-pre-wrap">{viewFiling.status_notes}</p>
                </div>
              )}

              {/* Notes */}
              {viewFiling.notes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Additional Notes</Label>
                  <p className="text-sm whitespace-pre-wrap">{viewFiling.notes}</p>
                </div>
              )}

              {/* Document Link */}
              {viewFiling.file_url && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Label className="text-xs text-muted-foreground">Attached Document</Label>
                  <a
                    href={viewFiling.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mt-1"
                  >
                    <FileText className="h-4 w-4" />
                    View Document
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewFiling(null)}>Close</Button>
            <Button
              onClick={() => {
                if (viewFiling) {
                  openEditDialog(viewFiling);
                  setViewFiling(null);
                }
              }}
              style={{ background: '#EF5A5A' }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Filing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Filing Dialog */}
      <Dialog open={!!editFiling} onOpenChange={() => setEditFiling(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Filing</DialogTitle>
            <DialogDescription>
              Update the filing information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="Filing title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-filing-type">Filing Type</Label>
                <Select
                  value={editFormData.filing_type}
                  onValueChange={(value) => setEditFormData({ ...editFormData, filing_type: value })}
                >
                  <SelectTrigger id="edit-filing-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instruction_letter">Instruction Letter</SelectItem>
                    <SelectItem value="affidavit">Affidavit</SelectItem>
                    <SelectItem value="motion">Motion</SelectItem>
                    <SelectItem value="response">Response</SelectItem>
                    <SelectItem value="brief">Brief</SelectItem>
                    <SelectItem value="notice">Notice</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="prepared">Prepared</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="filed">Filed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-filing-number">Filing Number</Label>
              <Input
                id="edit-filing-number"
                value={editFormData.filing_number}
                onChange={(e) => setEditFormData({ ...editFormData, filing_number: e.target.value })}
                placeholder="e.g., FL-2026-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Filing description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status-notes">Status Notes</Label>
              <Textarea
                id="edit-status-notes"
                value={editFormData.status_notes}
                onChange={(e) => setEditFormData({ ...editFormData, status_notes: e.target.value })}
                placeholder="Notes about the current status"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Additional Notes</Label>
              <Textarea
                id="edit-notes"
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                placeholder="Additional notes"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFiling(null)}>Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={saving} style={{ background: '#EF5A5A' }}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Filing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this filing? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} style={{ background: '#EF5A5A' }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
