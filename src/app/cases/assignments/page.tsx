'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  UserCheck,
  Clock,
  AlertCircle,
  Search,
  Filter,
  User,
  Calendar,
  FileText,
  ArrowRight,
} from 'lucide-react';

interface PendingCase {
  id: string;
  case_number: string;
  title: string;
  case_type: string;
  priority: string;
  status: string;
  region: string | null;
  created_at: string;
  description: string | null;
  assigned_officer_id: string | null;
}

interface Officer {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  department: string | null;
}

export default function CaseAssignmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pendingCases, setPendingCases] = useState<PendingCase[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<PendingCase | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load unassigned cases (no assigned_officer_id)
      const { data: cases, error: casesError } = await supabase
        .from('cases')
        .select('*')
        .is('assigned_officer_id', null)
        .order('created_at', { ascending: false });

      if (casesError) throw casesError;
      setPendingCases(cases as PendingCase[] || []);

      // Load action officers from profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .in('role', ['action_officer_litigation_lawyer', 'senior_legal_officer_litigation', 'admin']);

      if (!profilesError && profiles) {
        setOfficers(profiles as Officer[]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCase = async () => {
    if (!selectedCase || !selectedOfficer) {
      toast.error('Please select an officer to assign');
      return;
    }

    setIsAssigning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update the case with assigned officer
      const { error: updateError } = await (supabase as any)
        .from('cases')
        .update({
          assigned_officer_id: selectedOfficer,
          status: 'assigned',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedCase.id);

      if (updateError) throw updateError;

      // Create assignment record if table exists
      try {
        await (supabase as any)
          .from('case_assignments')
          .insert({
            case_id: selectedCase.id,
            assigned_to: selectedOfficer,
            assigned_by: user.id,
            instructions: assignmentNotes || null,
            status: 'active',
          });
      } catch (e) {
        // Table might not exist, continue anyway
        console.log('Assignment table not available, continuing...');
      }

      // Add to case history
      try {
        await (supabase as any)
          .from('case_history')
          .insert({
            case_id: selectedCase.id,
            action: 'Case Assigned',
            description: `Case assigned to officer. ${assignmentNotes ? `Notes: ${assignmentNotes}` : ''}`,
            created_by: user.id,
          });
      } catch (e) {
        console.log('History table not available, continuing...');
      }

      toast.success('Case assigned successfully!');
      setDialogOpen(false);
      setSelectedCase(null);
      setSelectedOfficer('');
      setAssignmentNotes('');
      loadData();
    } catch (error) {
      console.error('Error assigning case:', error);
      toast.error('Failed to assign case');
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredCases = pendingCases.filter(c => {
    const matchesSearch =
      c.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.case_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200',
    };
    return variants[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto" />
            <p className="mt-4 text-slate-600">Loading assignments...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-emerald-600" />
              Case Assignments
            </h1>
            <p className="text-slate-600 mt-1">
              Assign pending cases to action officers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {pendingCases.length} Pending
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{pendingCases.length}</div>
                  <div className="text-sm text-slate-600">Awaiting Assignment</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {pendingCases.filter(c => c.priority === 'urgent' || c.priority === 'high').length}
                  </div>
                  <div className="text-sm text-slate-600">High Priority</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <User className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{officers.length}</div>
                  <div className="text-sm text-slate-600">Available Officers</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {pendingCases.filter(c => {
                      const daysSinceCreated = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
                      return daysSinceCreated > 3;
                    }).length}
                  </div>
                  <div className="text-sm text-slate-600">Older than 3 days</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by case number, title, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Cases List */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Cases</CardTitle>
            <CardDescription>
              Cases awaiting assignment to action officers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCases.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No pending cases to assign</p>
                <p className="text-sm text-slate-500 mt-2">
                  All cases have been assigned or no cases match your filters
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCases.map((caseItem) => (
                  <div
                    key={caseItem.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm text-slate-600">
                          {caseItem.case_number}
                        </span>
                        <Badge className={getPriorityBadge(caseItem.priority)}>
                          {caseItem.priority}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {caseItem.case_type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-slate-900 mb-1">
                        {caseItem.title || 'Untitled Case'}
                      </h4>
                      {caseItem.description && (
                        <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                          {caseItem.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Registered: {format(new Date(caseItem.created_at), 'MMM dd, yyyy')}
                        </span>
                        {caseItem.region && (
                          <span>Region: {caseItem.region}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/cases/${caseItem.id}`)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Dialog open={dialogOpen && selectedCase?.id === caseItem.id} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) {
                          setSelectedCase(null);
                          setSelectedOfficer('');
                          setAssignmentNotes('');
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => {
                              setSelectedCase(caseItem);
                              setDialogOpen(true);
                            }}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Assign
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Case</DialogTitle>
                            <DialogDescription>
                              Assign case {caseItem.case_number} to an action officer
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="p-4 bg-slate-50 rounded-lg">
                              <div className="font-medium">{caseItem.title}</div>
                              <div className="text-sm text-slate-600 mt-1">
                                {caseItem.case_number} • {caseItem.case_type}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="officer">Assign To *</Label>
                              <Select value={selectedOfficer} onValueChange={setSelectedOfficer}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an officer" />
                                </SelectTrigger>
                                <SelectContent>
                                  {officers.map((officer) => (
                                    <SelectItem key={officer.id} value={officer.id}>
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span>{officer.full_name || officer.email}</span>
                                        <span className="text-xs text-slate-500">
                                          ({officer.role.replace(/_/g, ' ')})
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="notes">Assignment Notes</Label>
                              <Textarea
                                id="notes"
                                placeholder="Add any instructions or notes for the assigned officer..."
                                value={assignmentNotes}
                                onChange={(e) => setAssignmentNotes(e.target.value)}
                                rows={3}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button
                              onClick={handleAssignCase}
                              disabled={!selectedOfficer || isAssigning}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              {isAssigning ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                  Assigning...
                                </>
                              ) : (
                                <>
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  Assign Case
                                </>
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
