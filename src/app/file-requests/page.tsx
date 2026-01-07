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
import { Plus, Search, Folder, Clock, CheckCircle, FileText, Trash2, Eye, Download } from 'lucide-react';
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
  file_type: string;
  file_number: string | null;
  requested_date: string;
  status: string;
  received_date: string | null;
  current_location: string | null;
}

export default function FileRequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fileRequests, setFileRequests] = useState<FileRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
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
      const { data, error } = await supabase
        .from('file_requests')
        .select('*')
        .order('requested_date', { ascending: false });

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
    const styles = {
      requested: 'bg-yellow-100 text-yellow-800',
      received: 'bg-blue-100 text-blue-800',
      in_use: 'bg-green-100 text-green-800',
      returned: 'bg-gray-100 text-gray-800'
    };
    return styles[status as keyof typeof styles] || styles.requested;
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
      const { error } = await supabase
        .from('file_requests')
        .update({ status: newStatus, received_date: newStatus === 'received' ? new Date().toISOString() : null } as never)
        .eq('id', id);

      if (error) throw error;

      toast.success('Status updated successfully');
      void loadFileRequests();
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
            <h1 className="text-3xl font-bold text-slate-900">File Requests</h1>
            <p className="text-slate-600 mt-1">Track court files, land files, and title file requests</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2" style={{ background: '#EF5A5A' }}>
            <Plus className="h-4 w-4" />
            Request File
          </Button>
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
                <CardDescription>All file requests for cases</CardDescription>
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
              {fileRequests.map((request) => (
                <div key={request.id} className="p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-slate-900">
                          {request.file_type.replace('_', ' ').toUpperCase()}
                        </span>
                        {request.file_number && (
                          <span className="text-slate-600">- {request.file_number}</span>
                        )}
                        <Badge className={getStatusBadge(request.status)}>
                          {request.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span>Requested: {format(new Date(request.requested_date), 'PPP')}</span>
                        {request.received_date && (
                          <span>Received: {format(new Date(request.received_date), 'PPP')}</span>
                        )}
                        {request.current_location && (
                          <span>Location: {request.current_location}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
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
                        <Button size="sm" onClick={() => updateStatus(request.id, 'returned')} style={{ background: '#EF5A5A' }}>
                          Mark Returned
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setDeleteId(request.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {fileRequests.length === 0 && (
                <div className="text-center py-12 text-slate-600">
                  <Folder className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <p>No file requests found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}
