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
  DialogTitle
} from '@/components/ui/dialog';
import { Plus, Search, Folder, Clock, CheckCircle, FileText, Trash2, Eye, Edit, RefreshCw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AddFileRequestDialog } from '@/components/forms/AddFileRequestDialog';
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

interface FileRequest {
  id: string;
  case_id: string;
  file_type: string;
  file_number: string | null;
  requested_by: string | null;
  requested_date: string;
  status: string;
  received_date: string | null;
  current_location: string | null;
  custodian: string | null;
  notes: string | null;
  cases?: { case_number: string; title: string };
}

export default function FileRequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fileRequests, setFileRequests] = useState<FileRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewRequest, setViewRequest] = useState<FileRequest | null>(null);
  const [editRequest, setEditRequest] = useState<FileRequest | null>(null);
  const [editFormData, setEditFormData] = useState({
    file_type: '',
    file_number: '',
    status: '',
    current_location: '',
    custodian: '',
    notes: '',
    received_date: '',
  });
  const [stats, setStats] = useState({
    total: 0,
    requested: 0,
    received: 0,
    inUse: 0
  });

  useEffect(() => {
    void checkAuth();
    void loadFileRequests();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/login');
  };

  const loadFileRequests = async () => {
    try {
      // Try with the foreign key join first
      let { data, error } = await (supabase as any)
        .from('file_requests')
        .select('*, cases(case_number, title)')
        .order('requested_date', { ascending: false });

      // If the FK relationship doesn't exist, fall back to manual merge
      if (error && (error.code === 'PGRST200' || error.message?.includes('relationship'))) {
        console.warn('FK relationship missing, fetching cases separately');

        const { data: requests, error: reqError } = await (supabase as any)
          .from('file_requests')
          .select('*')
          .order('requested_date', { ascending: false });

        if (reqError) throw reqError;

        // Fetch all cases to merge
        const { data: casesData } = await (supabase as any)
          .from('cases')
          .select('id, case_number, title');

        const caseMap = new Map(
          (casesData || []).map((c: any) => [c.id, { case_number: c.case_number, title: c.title }])
        );

        data = (requests || []).map((req: any) => ({
          ...req,
          cases: req.case_id ? caseMap.get(req.case_id) || null : null,
        }));
        error = null;
      }

      if (error) throw error;
      setFileRequests(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading file requests:', error);
      toast.error('Failed to load file requests');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: FileRequest[]) => {
    setStats({
      total: data.length,
      requested: data.filter(f => f.status === 'requested').length,
      received: data.filter(f => f.status === 'received').length,
      inUse: data.filter(f => f.status === 'in_use').length
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      requested: 'bg-yellow-100 text-yellow-800',
      received: 'bg-blue-100 text-blue-800',
      in_use: 'bg-green-100 text-green-800',
      returned: 'bg-gray-100 text-gray-800'
    };
    return styles[status] || styles.requested;
  };

  const getFileTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      court_file: 'COURT FILE',
      land_file: 'LAND FILE',
      title_file: 'TITLE FILE',
    };
    return labels[type] || type.replace('_', ' ').toUpperCase();
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('file_requests')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast.success('File request deleted successfully');
      setDeleteId(null);
      void loadFileRequests();
    } catch (error) {
      console.error('Error deleting file request:', error);
      toast.error('Failed to delete file request');
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'received') {
        updateData.received_date = new Date().toISOString();
      }

      const { error } = await (supabase as any)
        .from('file_requests')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Status updated successfully');
      void loadFileRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const openEditDialog = (request: FileRequest) => {
    setEditRequest(request);
    setEditFormData({
      file_type: request.file_type,
      file_number: request.file_number || '',
      status: request.status,
      current_location: request.current_location || '',
      custodian: request.custodian || '',
      notes: request.notes || '',
      received_date: request.received_date ? request.received_date.split('T')[0] : '',
    });
  };

  const handleEditSubmit = async () => {
    if (!editRequest) return;
    setSaving(true);

    try {
      const updateData: any = {
        file_type: editFormData.file_type,
        file_number: editFormData.file_number || null,
        status: editFormData.status,
        current_location: editFormData.current_location || null,
        custodian: editFormData.custodian || null,
        notes: editFormData.notes || null,
        received_date: editFormData.received_date || null,
      };

      const { error } = await (supabase as any)
        .from('file_requests')
        .update(updateData)
        .eq('id', editRequest.id);

      if (error) throw error;

      toast.success('File request updated successfully');
      setEditRequest(null);
      void loadFileRequests();
    } catch (error) {
      console.error('Error updating file request:', error);
      toast.error('Failed to update file request');
    } finally {
      setSaving(false);
    }
  };

  // Filter file requests based on search query
  const filteredRequests = fileRequests.filter((request) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      request.file_type.toLowerCase().includes(query) ||
      (request.file_number && request.file_number.toLowerCase().includes(query)) ||
      (request.current_location && request.current_location.toLowerCase().includes(query)) ||
      (request.cases?.case_number && request.cases.case_number.toLowerCase().includes(query)) ||
      request.status.toLowerCase().includes(query)
    );
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
            <h1 className="text-3xl font-bold text-slate-900">File Requests</h1>
            <p className="text-slate-600 mt-1">Track court files, land files, and title file requests</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => loadFileRequests()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2" style={{ background: '#EF5A5A' }}>
              <Plus className="h-4 w-4" />
              Request File
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Folder className="h-8 w-8 text-blue-500" />
                <div className="text-3xl font-bold">{stats.total}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Requested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div className="text-3xl font-bold">{stats.requested}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-blue-500" />
                <div className="text-3xl font-bold">{stats.received}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">In Use</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-green-500" />
                <div className="text-3xl font-bold">{stats.inUse}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>File Request Register</CardTitle>
                <CardDescription>
                  {filteredRequests.length} of {fileRequests.length} file requests
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <div key={request.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-slate-900">
                          {getFileTypeLabel(request.file_type)}
                        </span>
                        {request.file_number && (
                          <span className="text-slate-600">- {request.file_number}</span>
                        )}
                        <Badge className={getStatusBadge(request.status)}>
                          {request.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      {request.cases && (
                        <div className="text-sm text-slate-700 mb-1">
                          Case: {request.cases.case_number} - {request.cases.title}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span>Requested: {format(new Date(request.requested_date), 'PPP')}</span>
                        {request.received_date && (
                          <span>Received: {format(new Date(request.received_date), 'PPP')}</span>
                        )}
                        {request.current_location && (
                          <span>Location: {request.current_location}</span>
                        )}
                        {request.custodian && (
                          <span>Custodian: {request.custodian}</span>
                        )}
                      </div>
                      {request.notes && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{request.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setViewRequest(request)} title="View">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(request)} title="Edit">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {request.status === 'requested' && (
                        <Button size="sm" onClick={() => updateStatus(request.id, 'received')} style={{ background: '#EF5A5A' }}>
                          Mark Received
                        </Button>
                      )}
                      {request.status === 'received' && (
                        <Button size="sm" onClick={() => updateStatus(request.id, 'in_use')} style={{ background: '#EF5A5A' }}>
                          Mark In Use
                        </Button>
                      )}
                      {request.status === 'in_use' && (
                        <Button size="sm" onClick={() => updateStatus(request.id, 'returned')} style={{ background: '#10B981' }}>
                          Mark Returned
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setDeleteId(request.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredRequests.length === 0 && (
                <div className="text-center py-12 text-slate-600">
                  <Folder className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <p>{fileRequests.length === 0 ? 'No file requests found' : 'No results match your search'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Dialog */}
      {showAddDialog && (
        <AddFileRequestDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={() => {
            setShowAddDialog(false);
            void loadFileRequests();
          }}
        />
      )}

      {/* View Dialog */}
      <Dialog open={!!viewRequest} onOpenChange={() => setViewRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>File Request Details</DialogTitle>
            <DialogDescription>
              Full details of the file request
            </DialogDescription>
          </DialogHeader>
          {viewRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">File Type</Label>
                  <p className="font-medium">{getFileTypeLabel(viewRequest.file_type)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">File Number</Label>
                  <p className="font-medium">{viewRequest.file_number || '-'}</p>
                </div>
              </div>

              {viewRequest.cases && (
                <div>
                  <Label className="text-xs text-muted-foreground">Case</Label>
                  <p className="font-medium">{viewRequest.cases.case_number} - {viewRequest.cases.title}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge className={getStatusBadge(viewRequest.status)}>
                    {viewRequest.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Requested Date</Label>
                  <p className="font-medium">{format(new Date(viewRequest.requested_date), 'PPP')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Received Date</Label>
                  <p className="font-medium">
                    {viewRequest.received_date
                      ? format(new Date(viewRequest.received_date), 'PPP')
                      : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Current Location</Label>
                  <p className="font-medium">{viewRequest.current_location || '-'}</p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Custodian</Label>
                <p className="font-medium">{viewRequest.custodian || '-'}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <p className="font-medium whitespace-pre-wrap">{viewRequest.notes || '-'}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRequest(null)}>Close</Button>
            <Button onClick={() => { openEditDialog(viewRequest!); setViewRequest(null); }} style={{ background: '#EF5A5A' }}>
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editRequest} onOpenChange={() => setEditRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit File Request</DialogTitle>
            <DialogDescription>
              Update the file request details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-file-type">File Type</Label>
                <Select
                  value={editFormData.file_type}
                  onValueChange={(value) => setEditFormData({ ...editFormData, file_type: value })}
                >
                  <SelectTrigger id="edit-file-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="court_file">Court File</SelectItem>
                    <SelectItem value="land_file">Land File</SelectItem>
                    <SelectItem value="title_file">Title File</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-file-number">File Number</Label>
                <Input
                  id="edit-file-number"
                  value={editFormData.file_number}
                  onChange={(e) => setEditFormData({ ...editFormData, file_number: e.target.value })}
                  placeholder="e.g., LF-2026-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="requested">Requested</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="in_use">In Use</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-received-date">Received Date</Label>
                <Input
                  id="edit-received-date"
                  type="date"
                  value={editFormData.received_date}
                  onChange={(e) => setEditFormData({ ...editFormData, received_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-location">Current Location</Label>
                <Input
                  id="edit-location"
                  value={editFormData.current_location}
                  onChange={(e) => setEditFormData({ ...editFormData, current_location: e.target.value })}
                  placeholder="e.g., Registry Office"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-custodian">Custodian</Label>
                <Input
                  id="edit-custodian"
                  value={editFormData.custodian}
                  onChange={(e) => setEditFormData({ ...editFormData, custodian: e.target.value })}
                  placeholder="Person responsible"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRequest(null)}>Cancel</Button>
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file request? This action cannot be undone.
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
