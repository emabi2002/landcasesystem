'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/permissions';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  UserCheck,
  Search,
  Filter,
  Calendar,
  FileText,
  ArrowRight,
  RefreshCw,
  Plus,
  Pencil,
  Check,
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
  assigned_action_officer_id?: string | null;
}

interface Officer {
  id: string;
  name: string;
  title: string | null;
  department: string | null;
  division?: string | null;
  email?: string | null;
  phone?: string | null;
  employee_id?: string | null;
  office_location?: string | null;
  employment_status?: string | null;
  is_active: boolean;
  notes?: string | null;
  profile_id?: string | null;
}

const emptyOfficerForm = {
  id: '',
  name: '',
  title: '',
  department: '',
  email: '',
  phone: '',
  employee_id: '',
  office_location: '',
  employment_status: 'active',
  notes: '',
  profile_id: '',
};

export default function CaseAssignmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingCases, setPendingCases] = useState<PendingCase[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<PendingCase | null>(null);
  const [selectedOfficerIds, setSelectedOfficerIds] = useState<string[]>([]);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [officerPickerOpen, setOfficerPickerOpen] = useState(false);
  const [officerSearch, setOfficerSearch] = useState('');
  const [officerDialogOpen, setOfficerDialogOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null);
  const [officerForm, setOfficerForm] = useState(emptyOfficerForm);
  const [savingOfficer, setSavingOfficer] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: cases, error: casesError } = await supabase
        .from('cases')
        .select('*')
        .or('assigned_officer_id.is.null,assigned_action_officer_id.is.null')
        .order('created_at', { ascending: false });

      if (casesError) throw casesError;
      setPendingCases(((cases as PendingCase[]) || []).filter((caseItem) => !caseItem.assigned_officer_id && !caseItem.assigned_action_officer_id));

      const { data: actionOfficers, error: officersError } = await (supabase as any)
        .from('action_officers')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (officersError) throw officersError;
      setOfficers((actionOfficers as Officer[]) || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    toast.success('Data refreshed');
  };

  const selectedOfficerRecords = selectedOfficerIds
    .map((id) => officers.find((officer) => officer.id === id))
    .filter((officer): officer is Officer => Boolean(officer));
  const primarySelectedOfficer = selectedOfficerRecords[0] || null;

  const filteredOfficers = officers.filter((officer) => {
    const q = officerSearch.trim().toLowerCase();
    if (!q) return true;
    return [officer.name, officer.title, officer.department, officer.division, officer.email, officer.employee_id]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q);
  });

  const openOfficerForm = (officer?: Officer | null) => {
    setEditingOfficer(officer || null);
    setOfficerForm(
      officer
        ? {
            id: officer.id,
            name: officer.name || '',
            title: officer.title || '',
            department: officer.department || officer.division || '',
            email: officer.email || '',
            phone: officer.phone || '',
            employee_id: officer.employee_id || '',
            office_location: officer.office_location || '',
            employment_status: officer.employment_status || (officer.is_active ? 'active' : 'inactive'),
            notes: officer.notes || '',
            profile_id: officer.profile_id || '',
          }
        : emptyOfficerForm
    );
    setOfficerDialogOpen(true);
  };

  const saveOfficer = async () => {
    if (!officerForm.name.trim() || !officerForm.title.trim() || !officerForm.department.trim()) {
      toast.error('Full name, position/title, and division/section are required');
      return;
    }

    setSavingOfficer(true);
    try {
      const response = await fetch('/api/internal-officers/upsert', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(officerForm),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save officer');

      const savedOfficer = result.officer as Officer;
      setOfficers((previous) => {
        const withoutSaved = previous.filter((officer) => officer.id !== savedOfficer.id);
        return [...withoutSaved, savedOfficer].sort((a, b) => a.name.localeCompare(b.name));
      });
      setSelectedOfficerIds((previous) => [...new Set([...previous, savedOfficer.id])]);
      setOfficerDialogOpen(false);
      setEditingOfficer(null);
      setOfficerForm(emptyOfficerForm);
      toast.success(editingOfficer ? 'Internal officer updated' : 'Internal officer added and selected');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save officer');
    } finally {
      setSavingOfficer(false);
    }
  };

  const selectOfficer = (officer: Officer) => {
    setSelectedOfficerIds((previous) =>
      previous.includes(officer.id) ? previous.filter((id) => id !== officer.id) : [...previous, officer.id]
    );
    setOfficerSearch('');
  };

  const removeSelectedOfficer = (officerId: string) => {
    setSelectedOfficerIds((previous) => previous.filter((id) => id !== officerId));
  };

  const handleAssignCase = async () => {
    if (!selectedCase || selectedOfficerIds.length === 0) {
      toast.error('Please select at least one officer to assign');
      return;
    }

    if (assignmentNotes.trim().length < 5) {
      toast.error('Please provide a reason or instruction for this assignment.');
      return;
    }

    setIsAssigning(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const selectedOfficers = selectedOfficerIds
        .map((id) => officers.find((officer) => officer.id === id))
        .filter((officer): officer is Officer => Boolean(officer));
      if (selectedOfficers.length === 0) throw new Error('Selected officers could not be found');
      const primaryOfficer = selectedOfficers[0];

      const { error: updateError } = await (supabase as any)
        .from('cases')
        .update({
          assigned_officer_id: primaryOfficer.profile_id || null,
          assigned_action_officer_id: primaryOfficer.id,
          status: 'assigned',
          updated_at: new Date().toISOString(),
          updated_by: user.id,
          last_change_reason: assignmentNotes.trim(),
        })
        .eq('id', selectedCase.id);

      if (updateError) throw updateError;

      try {
        const assignmentRows = selectedOfficers.map((officer) => ({
          case_id: selectedCase.id,
          assigned_officer_id: officer.profile_id || null,
          action_officer_id: officer.id,
          assigned_by_user_id: user.id,
          previous_officer_id: selectedCase.assigned_officer_id,
          assignment_type: selectedCase.assigned_action_officer_id ? 'additional_assignment' : 'initial_assignment',
          assignment_reason: assignmentNotes.trim(),
          is_current: true,
          remarks: assignmentNotes.trim(),
          created_by: user.id,
          updated_by: user.id,
        }));

        await (supabase as any).from('case_assignments').insert(assignmentRows);
      } catch (e) {
        console.log('Assignment table not available, continuing...');
      }

      try {
        await (supabase as any).from('case_history').insert({
          case_id: selectedCase.id,
          action: selectedCase.assigned_action_officer_id ? 'Case Officers Added' : 'Case Assigned',
          description: selectedCase.assigned_action_officer_id
            ? `Additional case officers assigned. Reason: ${assignmentNotes.trim()}`
            : `Case assigned to ${selectedOfficers.length} officer(s). Instructions: ${assignmentNotes.trim()}`,
          performed_by: user.id,
          activity_type: selectedCase.assigned_action_officer_id ? 'officers_added' : 'officers_assigned',
          entity_type: 'case_assignments',
          old_value: selectedCase.assigned_action_officer_id ? { action_officer_id: selectedCase.assigned_action_officer_id } : null,
          new_value: {
            action_officer_ids: selectedOfficers.map((officer) => officer.id),
            officer_names: selectedOfficers.map((officer) => officer.name),
          },
          reason: assignmentNotes.trim(),
          source_module: 'case_assignments',
          changed_fields: ['assigned_action_officer_id', 'case_assignments'],
        });
      } catch (e) {
        console.log('History table not available, continuing...');
      }

      await logAudit('update', 'cases', selectedCase.id, 'case_assignments', {
        action: selectedCase.assigned_action_officer_id ? 'additional_assignment' : 'assignment',
        previous_action_officer_id: selectedCase.assigned_action_officer_id,
        new_action_officer_ids: selectedOfficers.map((officer) => officer.id),
        new_officer_names: selectedOfficers.map((officer) => officer.name),
        reason: assignmentNotes.trim(),
      });

      toast.success('Case assigned successfully!');
      setDialogOpen(false);
      setSelectedCase(null);
      setSelectedOfficerIds([]);
      setAssignmentNotes('');
      loadData();
    } catch (error) {
      console.error('Error assigning case:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign case');
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredCases = pendingCases.filter((c) => {
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

  const highPriorityCount = pendingCases.filter((c) => c.priority === 'urgent' || c.priority === 'high').length;
  const olderThan3Days = pendingCases.filter((c) => {
    const daysSinceCreated = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceCreated > 3;
  }).length;

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
      <div className="min-h-screen bg-slate-50">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <UserCheck className="h-5 w-5 text-slate-600" />
              <div className="h-6 w-px bg-slate-300" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Case Assignments</h1>
                <p className="text-xs text-slate-500">{pendingCases.length} pending assignments</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm">
                <span className="text-slate-600">
                  <span className="font-semibold text-yellow-600">{pendingCases.length}</span> Awaiting
                </span>
                <span className="text-slate-600">
                  <span className="font-semibold text-red-600">{highPriorityCount}</span> High Priority
                </span>
                <span className="text-slate-600">
                  <span className="font-semibold text-emerald-600">{officers.length}</span> Officers
                </span>
                <span className="text-slate-600">
                  <span className="font-semibold text-blue-600">{olderThan3Days}</span> Older than 3 days
                </span>
              </div>
            </div>

            <div className="p-6 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Search & Filters</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-600">Search</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Case number, title, or type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 h-9"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Priority</Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="mt-1 h-9">
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
              </div>
            </div>

            <div className="p-6">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Pending Cases</h2>

              {filteredCases.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No pending cases to assign</p>
                  <p className="text-sm text-slate-500 mt-2">
                    All cases have been assigned or no cases match your filters
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCases.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-xs text-slate-600">{caseItem.case_number}</span>
                          <Badge className={getPriorityBadge(caseItem.priority)}>{caseItem.priority}</Badge>
                          <Badge variant="outline" className="capitalize text-xs">
                            {caseItem.case_type.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-slate-900 mb-1">{caseItem.title || 'Untitled Case'}</h4>
                        {caseItem.description && (
                          <p className="text-sm text-slate-600 line-clamp-2 mb-2">{caseItem.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Registered: {format(new Date(caseItem.created_at), 'MMM dd, yyyy')}
                          </span>
                          {caseItem.region && <span>Region: {caseItem.region}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => router.push(`/cases/${caseItem.id}`)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Dialog
                          open={dialogOpen && selectedCase?.id === caseItem.id}
                          onOpenChange={(open) => {
                            setDialogOpen(open);
                            if (!open) {
                              setSelectedCase(null);
                              setSelectedOfficerIds([]);
                              setAssignmentNotes('');
                              setOfficerPickerOpen(false);
                              setOfficerSearch('');
                              setOfficerDialogOpen(false);
                              setEditingOfficer(null);
                              setOfficerForm(emptyOfficerForm);
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="h-8 bg-emerald-600 hover:bg-emerald-700"
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
                              <DialogDescription>Assign case {caseItem.case_number} to one or more action officers</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="p-4 bg-slate-50 rounded-lg">
                                <div className="font-medium">{caseItem.title}</div>
                                <div className="text-sm text-slate-600 mt-1">
                                  {caseItem.case_number} • {caseItem.case_type}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-slate-600">Assign To *</Label>
                                <div className="flex gap-2">
                                  <Popover open={officerPickerOpen} onOpenChange={setOfficerPickerOpen}>
                                    <PopoverTrigger asChild>
                                      <Button variant="outline" role="combobox" className="h-9 flex-1 justify-between font-normal">
                                        {selectedOfficerRecords.length > 0 ? (
                                          <span className="truncate text-left">
                                            {selectedOfficerRecords.length === 1
                                              ? `${selectedOfficerRecords[0].name} – ${selectedOfficerRecords[0].title || 'Internal Officer'}`
                                              : `${selectedOfficerRecords.length} officers selected`}
                                          </span>
                                        ) : (
                                          <span className="text-slate-500">Search or select officers</span>
                                        )}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="w-[420px] p-0">
                                      <div className="border-b p-3">
                                        <div className="relative">
                                          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                          <Input
                                            value={officerSearch}
                                            onChange={(event) => setOfficerSearch(event.target.value)}
                                            placeholder="Search name, title, division, email..."
                                            className="h-9 pl-8"
                                            autoFocus
                                          />
                                        </div>
                                      </div>
                                      <div className="max-h-[320px] overflow-y-auto p-1">
                                        {filteredOfficers.length === 0 ? (
                                          <div className="px-3 py-6 text-center text-sm text-slate-500">
                                            No active internal officer found.
                                          </div>
                                        ) : (
                                          filteredOfficers.map((officer) => (
                                            <button
                                              key={officer.id}
                                              type="button"
                                              onClick={() => selectOfficer(officer)}
                                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
                                            >
                                              <Check className={`h-4 w-4 ${selectedOfficerIds.includes(officer.id) ? 'opacity-100' : 'opacity-0'}`} />
                                              <div className="min-w-0 flex-1">
                                                <div className="truncate font-medium text-slate-900">{officer.name}</div>
                                                <div className="truncate text-xs text-slate-500">
                                                  {officer.title || 'Internal Officer'} · {officer.department || officer.division || 'No division'}
                                                </div>
                                              </div>
                                            </button>
                                          ))
                                        )}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                  {selectedOfficerRecords.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {selectedOfficerRecords.map((officer) => (
                                        <Badge key={officer.id} variant="secondary" className="gap-1 px-2 py-1">
                                          {officer.name}
                                          <button
                                            type="button"
                                            className="ml-1 text-slate-500 hover:text-slate-900"
                                            onClick={() => removeSelectedOfficer(officer.id)}
                                          >
                                            ×
                                          </button>
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                  {primarySelectedOfficer && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-9 w-9"
                                      onClick={() => openOfficerForm(primarySelectedOfficer)}
                                      title="Edit first selected officer"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9"
                                    onClick={() => openOfficerForm()}
                                    title="Add new internal lawyer"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-slate-600">
                                  {caseItem.assigned_action_officer_id ? 'Reassignment Reason *' : 'Assignment Reason / Instructions *'}
                                </Label>
                                <Textarea
                                  placeholder="Add a reason for reassignment or instructions for the assigned officer..."
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
                                disabled={selectedOfficerIds.length === 0 || isAssigning}
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
                                    Assign {selectedOfficerIds.length > 1 ? `${selectedOfficerIds.length} Officers` : 'Case'}
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
            </div>

            {filteredCases.length > 0 && (
              <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
                <span>
                  Showing {filteredCases.length} of {pendingCases.length} pending cases
                </span>
                <span>Click Assign to allocate to officers</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={officerDialogOpen} onOpenChange={setOfficerDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingOfficer ? 'Edit Internal Lawyer / Officer' : 'Add Internal Lawyer / Officer'}</DialogTitle>
            <DialogDescription>
              Save an internal lawyer or action officer. The saved record is used by reference for case assignment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Full name *</Label>
              <Input
                value={officerForm.name}
                onChange={(event) => setOfficerForm({ ...officerForm, name: event.target.value })}
                placeholder="e.g. John Kila"
              />
            </div>
            <div className="space-y-2">
              <Label>Position / title *</Label>
              <Input
                value={officerForm.title}
                onChange={(event) => setOfficerForm({ ...officerForm, title: event.target.value })}
                placeholder="Senior Legal Officer"
              />
            </div>
            <div className="space-y-2">
              <Label>Division / section *</Label>
              <Input
                value={officerForm.department}
                onChange={(event) => setOfficerForm({ ...officerForm, department: event.target.value })}
                placeholder="Legal Services Division"
              />
            </div>
            <div className="space-y-2">
              <Label>Email address</Label>
              <Input
                type="email"
                value={officerForm.email}
                onChange={(event) => setOfficerForm({ ...officerForm, email: event.target.value })}
                placeholder="name@example.gov.pg"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone number</Label>
              <Input
                value={officerForm.phone}
                onChange={(event) => setOfficerForm({ ...officerForm, phone: event.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label>Employee ID</Label>
              <Input
                value={officerForm.employee_id}
                onChange={(event) => setOfficerForm({ ...officerForm, employee_id: event.target.value })}
                placeholder="Employee/account number"
              />
            </div>
            <div className="space-y-2">
              <Label>Employment / account status</Label>
              <Select
                value={officerForm.employment_status}
                onValueChange={(value) => setOfficerForm({ ...officerForm, employment_status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="leave">On Leave</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={officerForm.notes}
                onChange={(event) => setOfficerForm({ ...officerForm, notes: event.target.value })}
                rows={3}
                placeholder="Optional remarks"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOfficerDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveOfficer} disabled={savingOfficer} className="bg-emerald-600 hover:bg-emerald-700">
              {savingOfficer ? 'Saving...' : editingOfficer ? 'Save Changes' : 'Add and Select'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
