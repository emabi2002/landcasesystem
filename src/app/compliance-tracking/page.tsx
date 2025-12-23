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
import { Plus, Search, Shield, Clock, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AddComplianceTrackingDialog } from '@/components/forms/AddComplianceTrackingDialog';
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

interface ComplianceTracking {
  id: string;
  court_order_reference: string | null;
  court_order_date: string | null;
  court_order_description: string;
  compliance_deadline: string | null;
  responsible_division: string;
  memo_sent_date: string | null;
  compliance_status: string;
  completion_date: string | null;
}

export default function ComplianceTrackingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [complianceItems, setComplianceItems] = useState<ComplianceTracking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('compliance_tracking')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast.success('Compliance order deleted successfully');
      setDeleteId(null);
      void loadComplianceItems();
    } catch (error) {
      console.error('Error deleting compliance order:', error);
      toast.error('Failed to delete compliance order');
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const updateData: { compliance_status: string; completion_date?: string; memo_sent_date?: string } = { compliance_status: newStatus };

      if (newStatus === 'completed') {
        updateData.completion_date = new Date().toISOString();
      } else if (newStatus === 'memo_sent') {
        updateData.memo_sent_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('compliance_tracking')
        .update(updateData as never)
        .eq('id', id);

      if (error) throw error;

      toast.success('Status updated successfully');
      void loadComplianceItems();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  useEffect(() => {
    void checkAuth();
    void loadComplianceItems();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/login');
  };

  const loadComplianceItems = async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_tracking')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplianceItems(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading compliance tracking:', error);
      toast.error('Failed to load compliance tracking');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: ComplianceTracking[]) => {
    setStats({
      total: data.length,
      pending: data.filter(c => c.compliance_status === 'pending').length,
      inProgress: data.filter(c => c.compliance_status === 'in_progress').length,
      completed: data.filter(c => c.compliance_status === 'completed').length,
      overdue: data.filter(c => c.compliance_status === 'overdue').length
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      memo_sent: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      partially_complied: 'bg-orange-100 text-orange-800'
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getDivisionLabel = (division: string) => {
    const labels = {
      survey_division: 'Survey Division',
      registrar_for_titles: 'Registrar for Titles',
      alienated_lands_division: 'Alienated Lands Division',
      valuation_division: 'Valuation Division',
      physical_planning_division: 'Physical Planning Division',
      ilg_division: 'ILG Division',
      customary_leases_division: 'Customary Leases Division'
    };
    return labels[division as keyof typeof labels] || division;
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
            <h1 className="text-3xl font-bold text-slate-900">Court Order Compliance</h1>
            <p className="text-slate-600 mt-1">Track compliance with court orders across divisions</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2" style={{ background: '#EF5A5A' }}>
            <Plus className="h-4 w-4" />
            Add Compliance Order
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-500" />
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
                <Clock className="h-8 w-8 text-yellow-500" />
                <div className="text-3xl font-bold">{stats.pending}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-purple-500" />
                <div className="text-3xl font-bold">{stats.inProgress}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="text-3xl font-bold">{stats.completed}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <div className="text-3xl font-bold">{stats.overdue}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Compliance Orders</CardTitle>
                <CardDescription>Court orders requiring division compliance</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search compliance orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complianceItems.map((item) => (
                <div key={item.id} className="p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {item.court_order_reference && (
                          <span className="font-semibold text-slate-900">{item.court_order_reference}</span>
                        )}
                        <Badge className={getStatusBadge(item.compliance_status)}>
                          {item.compliance_status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge className="bg-indigo-100 text-indigo-800">
                          {getDivisionLabel(item.responsible_division)}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-900 mb-2">{item.court_order_description}</div>
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        {item.court_order_date && (
                          <span>Order Date: {format(new Date(item.court_order_date), 'PPP')}</span>
                        )}
                        {item.compliance_deadline && (
                          <span className="text-orange-600">
                            Deadline: {format(new Date(item.compliance_deadline), 'PPP')}
                          </span>
                        )}
                        {item.memo_sent_date && (
                          <span>Memo Sent: {format(new Date(item.memo_sent_date), 'PPP')}</span>
                        )}
                        {item.completion_date && (
                          <span className="text-green-600">
                            Completed: {format(new Date(item.completion_date), 'PPP')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {item.compliance_status === 'pending' && (
                        <Button size="sm" onClick={() => updateStatus(item.id, 'memo_sent')} style={{ background: '#EF5A5A' }}>
                          Send Memo
                        </Button>
                      )}
                      {item.compliance_status === 'memo_sent' && (
                        <Button size="sm" onClick={() => updateStatus(item.id, 'in_progress')} style={{ background: '#EF5A5A' }}>
                          Mark In Progress
                        </Button>
                      )}
                      {item.compliance_status === 'in_progress' && (
                        <Button size="sm" onClick={() => updateStatus(item.id, 'completed')} style={{ background: '#EF5A5A' }}>
                          Mark Completed
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setDeleteId(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {complianceItems.length === 0 && (
                <div className="text-center py-12 text-slate-600">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <p>No compliance orders found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {showAddDialog && (
        <AddComplianceTrackingDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={() => {
            setShowAddDialog(false);
            void loadComplianceItems();
          }}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Compliance Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this compliance order? This action cannot be undone.
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
