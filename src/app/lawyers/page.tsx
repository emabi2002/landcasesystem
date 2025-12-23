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
import { Plus, Search, Scale, Phone, Mail as MailIcon, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { AddLawyerDialog } from '@/components/forms/AddLawyerDialog';
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

interface ExternalLawyer {
  id: string;
  name: string;
  organization: string;
  lawyer_type: string;
  contact_email: string | null;
  contact_phone: string | null;
  active: boolean;
}

export default function LawyersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lawyers, setLawyers] = useState<ExternalLawyer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    solicitorGeneral: 0,
    privateLawyers: 0,
    active: 0
  });

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('external_lawyers')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast.success('Lawyer deleted successfully');
      setDeleteId(null);
      void loadLawyers();
    } catch (error) {
      console.error('Error deleting lawyer:', error);
      toast.error('Failed to delete lawyer');
    }
  };

  const toggleActive = async (id: string, currentlyActive: boolean) => {
    try {
      const { error } = await supabase
        .from('external_lawyers')
        .update({ active: !currentlyActive } as never)
        .eq('id', id);

      if (error) throw error;

      toast.success(`Lawyer ${!currentlyActive ? 'activated' : 'deactivated'} successfully`);
      void loadLawyers();
    } catch (error) {
      console.error('Error toggling lawyer status:', error);
      toast.error('Failed to update lawyer status');
    }
  };

  useEffect(() => {
    void checkAuth();
    void loadLawyers();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/login');
  };

  const loadLawyers = async () => {
    try {
      const { data, error } = await supabase
        .from('external_lawyers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setLawyers(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading lawyers:', error);
      toast.error('Failed to load lawyers');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: ExternalLawyer[]) => {
    setStats({
      total: data.length,
      solicitorGeneral: data.filter(l => l.lawyer_type === 'solicitor_general').length,
      privateLawyers: data.filter(l => l.lawyer_type === 'private_lawyer').length,
      active: data.filter(l => l.active).length
    });
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
            <h1 className="text-3xl font-bold text-slate-900">External Lawyers</h1>
            <p className="text-slate-600 mt-1">Manage Solicitor General and private lawyers</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2" style={{ background: '#EF5A5A' }}>
            <Plus className="h-4 w-4" />
            Add Lawyer
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Lawyers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Scale className="h-8 w-8 text-blue-500" />
                <div className="text-3xl font-bold">{stats.total}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Solicitor General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.solicitorGeneral}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Private Lawyers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.privateLawyers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lawyer Directory</CardTitle>
                <CardDescription>All external legal representatives</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search lawyers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lawyers.map((lawyer) => (
                <div key={lawyer.id} className="p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-slate-900">{lawyer.name}</span>
                        <Badge className={lawyer.lawyer_type === 'solicitor_general' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                          {lawyer.lawyer_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {lawyer.active && (
                          <Badge className="bg-green-100 text-green-800">ACTIVE</Badge>
                        )}
                      </div>
                      <div className="text-sm text-slate-700 mb-2">{lawyer.organization}</div>
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        {lawyer.contact_email && (
                          <span className="flex items-center gap-1">
                            <MailIcon className="h-3 w-3" />
                            {lawyer.contact_email}
                          </span>
                        )}
                        {lawyer.contact_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lawyer.contact_phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={lawyer.active ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleActive(lawyer.id, lawyer.active)}
                      >
                        {lawyer.active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteId(lawyer.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {lawyers.length === 0 && (
                <div className="text-center py-12 text-slate-600">
                  <Scale className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <p>No lawyers found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {showAddDialog && (
        <AddLawyerDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={() => {
            setShowAddDialog(false);
            void loadLawyers();
          }}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lawyer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lawyer? This action cannot be undone.
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
