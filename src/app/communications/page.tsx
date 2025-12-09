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
import { Plus, Search, MessageSquare, ArrowUp, ArrowDown, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AddCommunicationDialog } from '@/components/forms/AddCommunicationDialog';
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

interface Communication {
  id: string;
  communication_type: string;
  direction: string;
  party_type: string;
  party_name: string | null;
  subject: string;
  communication_date: string;
  response_required: boolean;
  response_status: string;
}

export default function CommunicationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    incoming: 0,
    outgoing: 0,
    responseRequired: 0
  });

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('communications')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast.success('Communication deleted successfully');
      setDeleteId(null);
      void loadCommunications();
    } catch (error) {
      console.error('Error deleting communication:', error);
      toast.error('Failed to delete communication');
    }
  };

  const markAsResponded = async (id: string) => {
    try {
      const { error } = await supabase
        .from('communications')
        .update({ response_status: 'responded' } as never)
        .eq('id', id);

      if (error) throw error;

      toast.success('Marked as responded');
      void loadCommunications();
    } catch (error) {
      console.error('Error updating communication:', error);
      toast.error('Failed to update');
    }
  };

  useEffect(() => {
    void checkAuth();
    void loadCommunications();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/login');
  };

  const loadCommunications = async () => {
    try {
      const { data, error } = await supabase
        .from('communications')
        .select('*')
        .order('communication_date', { ascending: false });

      if (error) throw error;
      setCommunications(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading communications:', error);
      toast.error('Failed to load communications');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Communication[]) => {
    setStats({
      total: data.length,
      incoming: data.filter(c => c.direction === 'incoming').length,
      outgoing: data.filter(c => c.direction === 'outgoing').length,
      responseRequired: data.filter(c => c.response_required && c.response_status === 'pending').length
    });
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'incoming' ? <ArrowDown className="h-4 w-4 text-green-600" /> : <ArrowUp className="h-4 w-4 text-blue-600" />;
  };

  const getPartyTypeBadge = (type: string) => {
    const styles = {
      plaintiff: 'bg-blue-100 text-blue-800',
      defendant: 'bg-purple-100 text-purple-800',
      solicitor_general: 'bg-indigo-100 text-indigo-800',
      private_lawyer: 'bg-pink-100 text-pink-800',
      witness: 'bg-green-100 text-green-800',
      court: 'bg-red-100 text-red-800',
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
            <h1 className="text-3xl font-bold text-slate-900">Communications</h1>
            <p className="text-slate-600 mt-1">Track all communications with parties and lawyers</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2" style={{ background: '#EF5A5A' }}>
            <Plus className="h-4 w-4" />
            Log Communication
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Communications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-blue-500" />
                <div className="text-3xl font-bold">{stats.total}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Incoming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <ArrowDown className="h-8 w-8 text-green-500" />
                <div className="text-3xl font-bold">{stats.incoming}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Outgoing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <ArrowUp className="h-8 w-8 text-blue-500" />
                <div className="text-3xl font-bold">{stats.outgoing}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Response Required</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-orange-500" />
                <div className="text-3xl font-bold">{stats.responseRequired}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Communication Log</CardTitle>
                <CardDescription>All correspondence with parties and legal representatives</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search communications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {communications.map((comm) => (
                <div key={comm.id} className="p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getDirectionIcon(comm.direction)}
                        <span className="font-semibold text-slate-900">{comm.subject}</span>
                        <Badge className={getPartyTypeBadge(comm.party_type)}>
                          {comm.party_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-800">
                          {comm.communication_type.toUpperCase()}
                        </Badge>
                        {comm.response_required && comm.response_status === 'pending' && (
                          <Badge className="bg-orange-100 text-orange-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Response Required
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        {comm.party_name && <span>Party: {comm.party_name}</span>}
                        <span>Date: {format(new Date(comm.communication_date), 'PPP')}</span>
                        <span className="capitalize">{comm.direction}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {comm.response_required && comm.response_status === 'pending' && (
                        <Button size="sm" onClick={() => markAsResponded(comm.id)} style={{ background: '#EF5A5A' }}>
                          Mark Responded
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setDeleteId(comm.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {communications.length === 0 && (
                <div className="text-center py-12 text-slate-600">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <p>No communications logged</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {showAddDialog && (
        <AddCommunicationDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={() => {
            setShowAddDialog(false);
            void loadCommunications();
          }}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Communication</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this communication log? This action cannot be undone.
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
