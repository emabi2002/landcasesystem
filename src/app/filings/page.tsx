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
import { Plus, Search, Send, FileText, Clock, CheckCircle, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AddFilingDialog } from '@/components/forms/AddFilingDialog';
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

interface Filing {
  id: string;
  filing_type: string;
  title: string;
  prepared_date: string | null;
  submission_date: string | null;
  filing_number: string | null;
  status: string;
  file_url: string | null;
}

export default function FilingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
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
      const { data, error } = await supabase
        .from('filings')
        .select('*')
        .order('created_at', { ascending: false });

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
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      prepared: 'bg-blue-100 text-blue-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      filed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || styles.draft;
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
      const updateData: { status: string; submission_date?: string; court_filing_date?: string } = { status: newStatus };

      if (newStatus === 'submitted') {
        updateData.submission_date = new Date().toISOString();
      } else if (newStatus === 'filed') {
        updateData.court_filing_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('filings')
        .update(updateData as never)
        .eq('id', id);

      if (error) throw error;

      toast.success('Status updated successfully');
      void loadFilings();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
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
            <h1 className="text-3xl font-bold text-slate-900">Filings</h1>
            <p className="text-slate-600 mt-1">Track instruction letters, affidavits, and court filings</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2" style={{ background: '#EF5A5A' }}>
            <Plus className="h-4 w-4" />
            Create Filing
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
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

          <Card>
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

          <Card>
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

          <Card>
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Filing Register</CardTitle>
                <CardDescription>All legal documents and filings</CardDescription>
              </div>
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
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filings.map((filing) => (
                <div key={filing.id} className="p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-slate-900">{filing.title}</span>
                        <Badge className="bg-purple-100 text-purple-800">
                          {filing.filing_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge className={getStatusBadge(filing.status)}>
                          {filing.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        {filing.prepared_date && (
                          <span>Prepared: {format(new Date(filing.prepared_date), 'PPP')}</span>
                        )}
                        {filing.submission_date && (
                          <span>Submitted: {format(new Date(filing.submission_date), 'PPP')}</span>
                        )}
                        {filing.filing_number && (
                          <span>Filing #: {filing.filing_number}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {filing.status === 'draft' && (
                        <Button size="sm" onClick={() => updateStatus(filing.id, 'prepared')} style={{ background: '#EF5A5A' }}>
                          Mark Prepared
                        </Button>
                      )}
                      {filing.status === 'prepared' && (
                        <Button size="sm" onClick={() => updateStatus(filing.id, 'submitted')} style={{ background: '#EF5A5A' }}>
                          Mark Submitted
                        </Button>
                      )}
                      {filing.status === 'submitted' && (
                        <Button size="sm" onClick={() => updateStatus(filing.id, 'filed')} style={{ background: '#EF5A5A' }}>
                          Mark Filed
                        </Button>
                      )}
                      {filing.file_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={filing.file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setDeleteId(filing.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {filings.length === 0 && (
                <div className="text-center py-12 text-slate-600">
                  <Send className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <p>No filings found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}
