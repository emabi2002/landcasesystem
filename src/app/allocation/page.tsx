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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  UserCheck,
  Clock,
  AlertCircle,
  Search,
  User,
  Calendar,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Users,
  Briefcase,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface CaseSearchResult {
  id: string;
  case_reference: string;
  case_title: string;
  case_type: string;
  status: string;
  priority: string;
  plaintiff_name: string;
  defendant_name: string;
  created_at: string;
  is_assigned: boolean;
  assignment: any;
}

interface Officer {
  id: string;
  email: string;
  full_name: string;
  department: string;
  active_cases: number;
  status: string;
}

interface Assignment {
  id: string;
  officer_user_id: string;
  officer_email: string;
  officer_name: string;
  assigned_by_email: string;
  assigned_at: string;
  briefing_note: string;
}

export default function CaseAssignmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CaseSearchResult[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseSearchResult | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [briefingNote, setBriefingNote] = useState('');
  const [includeAssigned, setIncludeAssigned] = useState(false);
  const [includeClosed, setIncludeClosed] = useState(false);
  const [allowReassignment, setAllowReassignment] = useState(false);
  const [reassignmentReason, setReassignmentReason] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [viewCaseOpen, setViewCaseOpen] = useState(false);
  const [assignmentStatus, setAssignmentStatus] = useState<Assignment | null>(null);
  const [searching, setSearching] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    awaiting: 0,
    highPriority: 0,
    availableOfficers: 0,
    olderThan3Days: 0,
  });

  useEffect(() => {
    checkAuth();
    loadOfficers();
    loadStats();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/login');
    setLoading(false);
  };

  const loadOfficers = async () => {
    try {
      const response = await fetch('/api/officers/available');
      const data = await response.json();

      if (response.ok) {
        setOfficers(data.officers || []);
        setStats(prev => ({ ...prev, availableOfficers: data.officers?.length || 0 }));
      } else {
        console.error('Error loading officers:', data.error);
      }
    } catch (error) {
      console.error('Error loading officers:', error);
      toast.error('Failed to load officers');
    }
  };

  const loadStats = async () => {
    try {
      // Get unassigned cases count
      const searchParams = new URLSearchParams({
        includeAssigned: 'false',
        includeClosed: 'false',
      });

      const response = await fetch(`/api/cases/search?${searchParams}`);
      const data = await response.json();

      if (response.ok) {
        const cases = data.cases || [];
        const highPriority = cases.filter((c: any) => c.priority === 'high').length;
        const oldCases = cases.filter((c: any) => {
          const daysDiff = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff > 3;
        }).length;

        setStats(prev => ({
          ...prev,
          awaiting: cases.length,
          highPriority,
          olderThan3Days: oldCases,
        }));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && !includeAssigned && !includeClosed) {
      return;
    }

    setSearching(true);
    try {
      const searchParams = new URLSearchParams({
        q: searchQuery,
        includeAssigned: includeAssigned.toString(),
        includeClosed: includeClosed.toString(),
      });

      const response = await fetch(`/api/cases/search?${searchParams}`);
      const data = await response.json();

      if (response.ok) {
        setSearchResults(data.cases || []);
      } else {
        toast.error(data.error || 'Failed to search cases');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search cases');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCase = async (caseItem: CaseSearchResult) => {
    setSelectedCase(caseItem);
    setSelectedOfficer('');
    setBriefingNote('');
    setReassignmentReason('');
    setAllowReassignment(false);

    // Check assignment status
    try {
      const response = await fetch(`/api/cases/assignment-status?caseId=${caseItem.id}`);
      const data = await response.json();

      if (response.ok) {
        if (data.is_assigned) {
          setAssignmentStatus(data.assignment);
        } else {
          setAssignmentStatus(null);
        }
      }
    } catch (error) {
      console.error('Error checking assignment:', error);
    }
  };

  const handleViewCase = () => {
    setViewCaseOpen(true);
  };

  const handleAssignCase = async () => {
    if (!selectedCase) {
      toast.error('Please select a case');
      return;
    }

    if (!selectedOfficer) {
      toast.error('Please select an officer');
      return;
    }

    if (assignmentStatus && !allowReassignment) {
      toast.error('This case is already assigned. Enable reassignment to proceed.');
      return;
    }

    if (assignmentStatus && allowReassignment && !reassignmentReason.trim()) {
      toast.error('Reassignment reason is required');
      return;
    }

    setIsAssigning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const response = await fetch('/api/cases/assign-officer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId: selectedCase.id,
          officerId: selectedOfficer,
          briefingNote,
          assignedBy: user?.id,
          allowReassignment,
          reassignmentReason: allowReassignment ? reassignmentReason : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Case assigned successfully!');

        // Reset form
        setSelectedCase(null);
        setSelectedOfficer('');
        setBriefingNote('');
        setReassignmentReason('');
        setAllowReassignment(false);
        setAssignmentStatus(null);

        // Refresh data
        await loadStats();
        if (searchQuery) {
          await handleSearch();
        }
      } else {
        if (response.status === 409) {
          toast.error(`${data.error}. Assigned to: ${data.assigned_to}`);
          setAssignmentStatus(data.assignment || null);
        } else {
          toast.error(data.error || 'Failed to assign case');
        }
      }
    } catch (error) {
      console.error('Assignment error:', error);
      toast.error('Failed to assign case');
    } finally {
      setIsAssigning(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <UserCheck className="h-8 w-8 text-emerald-600" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Case Assignments</h1>
              <p className="text-slate-600 mt-1">Assign pending cases to action officers</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Awaiting Assignment</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.awaiting}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">High Priority</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.highPriority}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Available Officers</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.availableOfficers}</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <User className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Older than 3 days</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.olderThan3Days}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Search and Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Cases
                </CardTitle>
                <CardDescription>
                  Search by case ID, title, plaintiff, or defendant name
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Search by case number, title, or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={searching}>
                    {searching ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeAssigned"
                      checked={includeAssigned}
                      onCheckedChange={(checked) => setIncludeAssigned(checked as boolean)}
                    />
                    <Label htmlFor="includeAssigned" className="text-sm cursor-pointer">
                      Include assigned cases
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeClosed"
                      checked={includeClosed}
                      onCheckedChange={(checked) => setIncludeClosed(checked as boolean)}
                    />
                    <Label htmlFor="includeClosed" className="text-sm cursor-pointer">
                      Include closed cases
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Search Results ({searchResults.length})</CardTitle>
                  <CardDescription>Click on a case to view details and assign</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {searchResults.map((caseItem) => (
                      <div
                        key={caseItem.id}
                        onClick={() => handleSelectCase(caseItem)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedCase?.id === caseItem.id
                            ? 'bg-emerald-50 border-emerald-600'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-slate-900">{caseItem.case_reference}</h3>
                              {caseItem.is_assigned && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  Assigned
                                </Badge>
                              )}
                              <Badge variant="outline" className={
                                caseItem.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                                caseItem.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                'bg-slate-50 text-slate-700 border-slate-200'
                              }>
                                {caseItem.priority}
                              </Badge>
                              <Badge variant="outline" className="bg-slate-50">
                                {caseItem.case_type}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-900 mb-1">{caseItem.case_title}</p>
                            <div className="text-xs text-slate-600">
                              <span>Plaintiff: {caseItem.plaintiff_name}</span>
                              <span className="mx-2">•</span>
                              <span>Defendant: {caseItem.defendant_name}</span>
                              <span className="mx-2">•</span>
                              <span>Filed: {format(new Date(caseItem.created_at), 'MMM dd, yyyy')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {searchResults.length === 0 && searchQuery && !searching && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No cases found</h3>
                  <p className="text-slate-600">
                    Try adjusting your search criteria or filters
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Assignment Panel */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Assignment Panel
                </CardTitle>
                <CardDescription>
                  {selectedCase ? 'Review case and assign to officer' : 'Select a case to assign'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedCase ? (
                  <>
                    {/* Selected Case Info */}
                    <div className="p-3 bg-slate-50 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-xs text-slate-600 mb-1">Selected Case</p>
                          <p className="font-semibold text-slate-900">{selectedCase.case_reference}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleViewCase}
                          className="gap-2"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                      </div>
                      <p className="text-sm text-slate-700 line-clamp-2">{selectedCase.case_title}</p>
                    </div>

                    {/* Assignment Status */}
                    {assignmentStatus ? (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold text-yellow-900 mb-1">Already Assigned</p>
                            <div className="text-sm text-yellow-800 space-y-1">
                              <p><strong>Officer:</strong> {assignmentStatus.officer_name}</p>
                              <p><strong>Email:</strong> {assignmentStatus.officer_email}</p>
                              <p><strong>Assigned:</strong> {format(new Date(assignmentStatus.assigned_at), 'MMM dd, yyyy HH:mm')}</p>
                              {assignmentStatus.assigned_by_email && (
                                <p><strong>By:</strong> {assignmentStatus.assigned_by_email}</p>
                              )}
                            </div>

                            <div className="mt-3 flex items-center space-x-2">
                              <Checkbox
                                id="allowReassign"
                                checked={allowReassignment}
                                onCheckedChange={(checked) => setAllowReassignment(checked as boolean)}
                              />
                              <Label htmlFor="allowReassign" className="text-sm font-medium cursor-pointer">
                                Allow Reassignment
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                          <p className="font-semibold text-emerald-900">Unassigned - Ready to Assign</p>
                        </div>
                      </div>
                    )}

                    {/* Reassignment Reason (if needed) */}
                    {assignmentStatus && allowReassignment && (
                      <div className="space-y-2">
                        <Label htmlFor="reassignReason">
                          Reassignment Reason <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="reassignReason"
                          placeholder="Explain why this case is being reassigned..."
                          value={reassignmentReason}
                          onChange={(e) => setReassignmentReason(e.target.value)}
                          rows={3}
                          className="resize-none"
                        />
                      </div>
                    )}

                    {/* Officer Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="officer">
                        Select Officer <span className="text-red-500">*</span>
                      </Label>
                      <Select value={selectedOfficer} onValueChange={setSelectedOfficer}>
                        <SelectTrigger id="officer">
                          <SelectValue placeholder="Choose an officer..." />
                        </SelectTrigger>
                        <SelectContent>
                          {officers.map((officer) => (
                            <SelectItem key={officer.id} value={officer.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{officer.full_name || officer.email}</span>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {officer.active_cases} active
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedOfficer && (
                        <p className="text-xs text-slate-600">
                          <Info className="h-3 w-3 inline mr-1" />
                          Officer workload helps balance case distribution
                        </p>
                      )}
                    </div>

                    {/* Briefing Note */}
                    <div className="space-y-2">
                      <Label htmlFor="briefing">Case Briefing Note</Label>
                      <Textarea
                        id="briefing"
                        placeholder="Provide case briefing for the officer (e.g., priority, deadlines, key issues)..."
                        value={briefingNote}
                        onChange={(e) => setBriefingNote(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                      <p className="text-xs text-slate-500">
                        This note will be visible to the assigned officer
                      </p>
                    </div>

                    {/* Assign Button */}
                    <Button
                      onClick={handleAssignCase}
                      disabled={isAssigning || !selectedOfficer || (!!assignmentStatus && !allowReassignment)}
                      className="w-full"
                      size="lg"
                    >
                      {isAssigning ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Assigning...
                        </>
                      ) : assignmentStatus && allowReassignment ? (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Reassign Case
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Assign Case
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-600">
                      Search and select a case to begin assignment
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* View Case Dialog */}
      <Dialog open={viewCaseOpen} onOpenChange={setViewCaseOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Case Details</DialogTitle>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-600">Case Reference</Label>
                  <p className="font-semibold">{selectedCase.case_reference}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Case Type</Label>
                  <p className="font-semibold">{selectedCase.case_type}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Priority</Label>
                  <Badge className={
                    selectedCase.priority === 'high' ? 'bg-red-100 text-red-700' :
                    selectedCase.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-slate-100 text-slate-700'
                  }>
                    {selectedCase.priority}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Status</Label>
                  <Badge variant="outline">{selectedCase.status}</Badge>
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-600">Case Title</Label>
                <p className="font-semibold">{selectedCase.case_title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-600">Plaintiff</Label>
                  <p>{selectedCase.plaintiff_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Defendant</Label>
                  <p>{selectedCase.defendant_name}</p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-600">Filed Date</Label>
                <p>{format(new Date(selectedCase.created_at), 'MMMM dd, yyyy')}</p>
              </div>

              {assignmentStatus && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-semibold text-blue-900 mb-2">Assignment Information</p>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Assigned to:</strong> {assignmentStatus.officer_name}</p>
                    <p><strong>Date:</strong> {format(new Date(assignmentStatus.assigned_at), 'MMM dd, yyyy HH:mm')}</p>
                    {assignmentStatus.briefing_note && (
                      <div className="mt-2">
                        <strong>Briefing:</strong>
                        <p className="mt-1 whitespace-pre-wrap">{assignmentStatus.briefing_note}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
