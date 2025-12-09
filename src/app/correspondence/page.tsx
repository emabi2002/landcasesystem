/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Mail, CheckCircle, Clock, FileText, Trash2, Send, Download, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AddCorrespondenceDialog } from '@/components/forms/AddCorrespondenceDialog';
import { exportCorrespondence } from '@/lib/export-workflow';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface Correspondence {
  id: string;
  reference_number: string;
  document_type: string;
  source: string;
  received_date: string;
  subject: string;
  acknowledgement_sent: boolean;
  status: string;
  case_id: string | null;
}

export default function CorrespondencePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [correspondence, setCorrespondence] = useState<Correspondence[]>([]);
  const [filteredCorrespondence, setFilteredCorrespondence] = useState<Correspondence[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    acknowledged: 0,
    processed: 0
  });

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('incoming_correspondence')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast.success('Correspondence deleted successfully');
      setDeleteId(null);
      void loadCorrespondence();
    } catch (error) {
      console.error('Error deleting correspondence:', error);
      toast.error('Failed to delete correspondence');
    }
  };

  const sendAcknowledgement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('incoming_correspondence')
        .update({
          acknowledgement_sent: true,
          acknowledgement_date: new Date().toISOString(),
          acknowledgement_number: `ACK-${Date.now()}`,
          status: 'acknowledged'
        } as never)
        .eq('id', id);

      if (error) throw error;

      toast.success('Acknowledgement sent successfully');
      void loadCorrespondence();
    } catch (error) {
      console.error('Error sending acknowledgement:', error);
      toast.error('Failed to send acknowledgement');
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('incoming_correspondence')
        .update({ status: newStatus } as never)
        .eq('id', id);

      if (error) throw error;

      toast.success('Status updated successfully');
      void loadCorrespondence();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  useEffect(() => {
    void checkAuth();
    void loadCorrespondence();
  }, []);

  useEffect(() => {
    filterCorrespondence();
  }, [searchQuery, correspondence]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/login');
  };

  const loadCorrespondence = async () => {
    try {
      const { data, error } = await supabase
        .from('incoming_correspondence')
        .select('*')
        .order('received_date', { ascending: false });

      if (error) throw error;
      setCorrespondence(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading correspondence:', error);
      toast.error('Failed to load correspondence');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Correspondence[]) => {
    setStats({
      total: data.length,
      pending: data.filter(c => c.status === 'received').length,
      acknowledged: data.filter(c => c.acknowledgement_sent).length,
      processed: data.filter(c => c.status === 'processed').length
    });
  };

  const filterCorrespondence = () => {
    let filtered = correspondence;
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.reference_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.source.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredCorrespondence(filtered);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      received: 'bg-blue-100 text-blue-800',
      acknowledged: 'bg-yellow-100 text-yellow-800',
      processed: 'bg-green-100 text-green-800',
      filed: 'bg-purple-100 text-purple-800'
    };
    return styles[status as keyof typeof styles] || styles.received;
  };

  const getDocumentTypeBadge = (type: string) => {
    const styles = {
      section_5_notice: 'bg-red-100 text-red-800',
      search_warrant: 'bg-orange-100 text-orange-800',
      court_order: 'bg-purple-100 text-purple-800',
      summons_ombudsman: 'bg-indigo-100 text-indigo-800',
      writ: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return styles[type as keyof typeof styles] || styles.other;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />
        <div className="p-6 lg:p-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />

      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Incoming Correspondence</h1>
            <p className="text-slate-600 mt-1">Track documents received from courts, parties, and agencies</p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  exportCorrespondence(filteredCorrespondence, `Correspondence-${format(new Date(), 'yyyy-MM-dd')}`);
                  toast.success('Exported to Excel successfully');
                }}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.print()}>
                  <FileText className="h-4 w-4 mr-2" />
                  Print
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2" style={{ background: '#EF5A5A' }}>
              <Plus className="h-4 w-4" />
              Register Correspondence
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Mail className="h-8 w-8 text-blue-500" />
                <div className="text-3xl font-bold">{stats.total}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-blue-500" />
                <div className="text-3xl font-bold">{stats.pending}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Acknowledged</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-yellow-500" />
                <div className="text-3xl font-bold">{stats.acknowledged}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Processed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-green-500" />
                <div className="text-3xl font-bold">{stats.processed}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Correspondence Register</CardTitle>
                <CardDescription>All incoming documents and court papers</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search correspondence..."
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
              {filteredCorrespondence.map((item) => (
                <div key={item.id} className="p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-slate-900">{item.reference_number}</span>
                        <Badge className={getDocumentTypeBadge(item.document_type)}>
                          {item.document_type.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                        <Badge className={getStatusBadge(item.status)}>
                          {item.status.toUpperCase()}
                        </Badge>
                        {item.acknowledgement_sent && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Acknowledged
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-slate-900 font-medium mb-1">{item.subject}</div>
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span>From: {item.source.replace(/_/g, ' ')}</span>
                        <span>Received: {format(new Date(item.received_date), 'PPP')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!item.acknowledgement_sent && (
                        <Button size="sm" onClick={() => sendAcknowledgement(item.id)} style={{ background: '#EF5A5A' }}>
                          <Send className="h-4 w-4 mr-1" />
                          Send Acknowledgement
                        </Button>
                      )}
                      {item.status === 'acknowledged' && (
                        <Button size="sm" onClick={() => updateStatus(item.id, 'processed')} style={{ background: '#EF5A5A' }}>
                          Mark Processed
                        </Button>
                      )}
                      {item.status === 'processed' && (
                        <Button size="sm" onClick={() => updateStatus(item.id, 'filed')} style={{ background: '#EF5A5A' }}>
                          Mark Filed
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setDeleteId(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredCorrespondence.length === 0 && (
                <div className="text-center py-12 text-slate-600">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <p>No correspondence found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {showAddDialog && (
        <AddCorrespondenceDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={() => {
            setShowAddDialog(false);
            void loadCorrespondence();
          }}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Correspondence</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this correspondence? This action cannot be undone.
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
    </div>
  );
}
