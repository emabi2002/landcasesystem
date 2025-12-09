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
import { Plus, Search, ClipboardList, AlertCircle, CheckCircle2, Clock, Trash2, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AddDirectionDialog } from '@/components/forms/AddDirectionDialog';
import { exportDirections } from '@/lib/export-workflow';
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

interface Direction {
  id: string;
  direction_number: string;
  source: string;
  issued_date: string;
  subject: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  status: string;
}

export default function DirectionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [filteredDirections, setFilteredDirections] = useState<Direction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  });

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('directions')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast.success('Direction deleted successfully');
      setDeleteId(null);
      void loadDirections();
    } catch (error) {
      console.error('Error deleting direction:', error);
      toast.error('Failed to delete direction');
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const updateData: { status: string; completed_date?: string } = { status: newStatus };

      if (newStatus === 'completed') {
        updateData.completed_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('directions')
        .update(updateData as never)
        .eq('id', id);

      if (error) throw error;

      toast.success('Status updated successfully');
      void loadDirections();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  useEffect(() => {
    void checkAuth();
    void loadDirections();
  }, []);

  useEffect(() => {
    filterDirections();
  }, [searchQuery, directions]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/login');
  };

  const loadDirections = async () => {
    try {
      const { data, error } = await supabase
        .from('directions')
        .select('*')
        .order('issued_date', { ascending: false });

      if (error) throw error;
      setDirections(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading directions:', error);
      toast.error('Failed to load directions');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Direction[]) => {
    setStats({
      total: data.length,
      pending: data.filter(d => d.status === 'pending').length,
      inProgress: data.filter(d => d.status === 'in_progress').length,
      completed: data.filter(d => d.status === 'completed').length
    });
  };

  const filterDirections = () => {
    let filtered = directions;
    if (searchQuery) {
      filtered = filtered.filter(d =>
        d.direction_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.source.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredDirections(filtered);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return styles[priority as keyof typeof styles] || styles.medium;
  };

  const getSourceLabel = (source: string) => {
    const labels = {
      secretary_lands: 'Secretary Lands',
      director_legal_services: 'Director Legal Services',
      manager_legal_services: 'Manager Legal Services'
    };
    return labels[source as keyof typeof labels] || source;
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
            <h1 className="text-3xl font-bold text-slate-900">Directions</h1>
            <p className="text-slate-600 mt-1">Track directives from management and leadership</p>
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
                  exportDirections(filteredDirections, `Directions-${format(new Date(), 'yyyy-MM-dd')}`);
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
              Add Direction
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Directions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <ClipboardList className="h-8 w-8 text-blue-500" />
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
                <AlertCircle className="h-8 w-8 text-blue-500" />
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
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div className="text-3xl font-bold">{stats.completed}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Direction Register</CardTitle>
                <CardDescription>All directives from Secretary, Director, and Manager</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search directions..."
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
              {filteredDirections.map((direction) => (
                <div key={direction.id} className="p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-slate-900">{direction.direction_number}</span>
                        <Badge className={getPriorityBadge(direction.priority)}>
                          {direction.priority.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusBadge(direction.status)}>
                          {direction.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-900 font-medium mb-2">{direction.subject}</div>
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span>From: {getSourceLabel(direction.source)}</span>
                        <span>Issued: {format(new Date(direction.issued_date), 'PPP')}</span>
                        {direction.due_date && (
                          <span className="text-orange-600">Due: {format(new Date(direction.due_date), 'PPP')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {direction.status === 'pending' && (
                        <Button size="sm" onClick={() => updateStatus(direction.id, 'in_progress')} style={{ background: '#EF5A5A' }}>
                          Start Working
                        </Button>
                      )}
                      {direction.status === 'in_progress' && (
                        <Button size="sm" onClick={() => updateStatus(direction.id, 'completed')} style={{ background: '#EF5A5A' }}>
                          Mark Completed
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setDeleteId(direction.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredDirections.length === 0 && (
                <div className="text-center py-12 text-slate-600">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <p>No directions found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {showAddDialog && (
        <AddDirectionDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={() => {
            setShowAddDialog(false);
            void loadDirections();
          }}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Direction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this direction? This action cannot be undone.
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
