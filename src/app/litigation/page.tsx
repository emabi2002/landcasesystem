'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Scale, Plus, Search, AlertCircle, Upload, AlertTriangle, FolderOpen, FileText, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog } from '@/components/forms/AlertDialog';
import { format } from 'date-fns';
import { CaseSelector } from '@/components/forms/CaseSelector';
import { DocumentUpload } from '@/components/forms/DocumentUpload';

export default function LitigationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assignedCases, setAssignedCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [showFilingForm, setShowFilingForm] = useState(false);
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [currentFilingId, setCurrentFilingId] = useState<string | null>(null);
  const [filingData, setFilingData] = useState({
    case_id: '',
    filing_type: 'instruction_letter',
    title: '',
    description: '',
    prepared_date: new Date().toISOString().split('T')[0],
  });
  const [statusData, setStatusData] = useState({
    case_id: '',
    status_update: '',
    work_done: '',
    next_steps: '',
  });

  useEffect(() => {
    checkAuth();
    loadAssignedCases();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
  };

  const loadAssignedCases = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get cases assigned to current user
      const { data, error } = await supabase
        .from('case_assignments')
        .select(`
          *,
          cases!inner(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignedCases(data || []);
    } catch (error) {
      console.error('Error loading assigned cases:', error);
      toast.error('Failed to load assigned cases');
    } finally {
      setLoading(false);
    }
  };

  const handleFilingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: filing, error } = await (supabase as any)
        .from('filings')
        .insert([{
          case_id: filingData.case_id,
          filing_type: filingData.filing_type,
          title: filingData.title,
          description: filingData.description,
          prepared_by: user.id,
          prepared_date: filingData.prepared_date,
          status: 'draft',
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Filing recorded successfully! You can now upload documents.');
      setCurrentFilingId((filing as any)?.id || null);
      setFilingData({
        case_id: '',
        filing_type: 'instruction_letter',
        title: '',
        description: '',
        prepared_date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Error recording filing:', error);
      toast.error('Failed to record filing');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('officer_actions')
        .insert([{
          case_id: statusData.case_id,
          action_type: 'status_update',
          action_details: statusData.status_update,
          performed_by: user.id,
          action_date: new Date().toISOString(),
          attachments: {
            work_done: statusData.work_done,
            next_steps: statusData.next_steps,
          },
        }]);

      if (error) throw error;

      toast.success('Status updated successfully!');
      setShowStatusForm(false);
      setStatusData({
        case_id: '',
        status_update: '',
        work_done: '',
        next_steps: '',
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardNav />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
              <FolderOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Step 4: Registration & Assignment</h1>
              <p className="text-slate-600 mt-1">Litigation Officer Workspace - All Filings Happen Here</p>
            </div>
          </div>

          {(filingData.case_id || statusData.case_id) && (
            <AlertDialog
              caseId={filingData.case_id || statusData.case_id}
              currentStep="Step 4: Litigation Workspace"
            />
          )}
        </div>

        {/* Info Card */}
        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-2">How This Module Works</h3>
                <ul className="text-sm text-orange-800 space-y-1.5">
                  <li>• <strong>Central Workspace:</strong> ALL filing happens here - there is NO separate external filings module</li>
                  <li>• <strong>New & Ongoing:</strong> Record work on newly registered cases AND existing ongoing cases</li>
                  <li>• <strong>Document Management:</strong> Upload, date-stamp, categorize, and link ALL documents to case</li>
                  <li>• <strong>Status Updates:</strong> Record case progress, work completed, and next steps</li>
                  <li>• <strong>Comprehensive Tracking:</strong> Everything must reference the original Case ID from Step 1</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Workspace */}
        <Card>
          <CardHeader>
            <CardTitle>Litigation Officer Workspace</CardTitle>
            <CardDescription>
              Record all work, filings, and updates for assigned cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="filings">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="filings">
                  <FileText className="h-4 w-4 mr-2" />
                  All Filings
                </TabsTrigger>
                <TabsTrigger value="status">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Status Updates
                </TabsTrigger>
                <TabsTrigger value="cases">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  My Assigned Cases
                </TabsTrigger>
              </TabsList>

              {/* Filings Tab */}
              <TabsContent value="filings" className="space-y-6 mt-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Record New Filing</h3>
                  <Button
                    onClick={() => setShowFilingForm(!showFilingForm)}
                    className="gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Plus className="h-4 w-4" />
                    {showFilingForm ? 'Cancel' : 'New Filing'}
                  </Button>
                </div>

                {showFilingForm && (
                  <Card className="border-2 border-orange-200">
                    <CardContent className="pt-6">
                      <form onSubmit={handleFilingSubmit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <CaseSelector
                              value={filingData.case_id}
                              onValueChange={(value) => setFilingData({ ...filingData, case_id: value })}
                              label="Case ID"
                              placeholder="Search and select case..."
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="filing_type">Filing Type *</Label>
                            <Select
                              value={filingData.filing_type}
                              onValueChange={(value) => setFilingData({ ...filingData, filing_type: value })}
                            >
                              <SelectTrigger id="filing_type">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="instruction_letter">Instruction Letter</SelectItem>
                                <SelectItem value="affidavit">Affidavit</SelectItem>
                                <SelectItem value="motion">Motion</SelectItem>
                                <SelectItem value="response">Response</SelectItem>
                                <SelectItem value="brief">Brief</SelectItem>
                                <SelectItem value="notice">Notice</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="title">Document Title *</Label>
                          <Input
                            id="title"
                            placeholder="Brief descriptive title..."
                            value={filingData.title}
                            onChange={(e) => setFilingData({ ...filingData, title: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description_filing">Description *</Label>
                          <Textarea
                            id="description_filing"
                            placeholder="Detailed description of the filing..."
                            value={filingData.description}
                            onChange={(e) => setFilingData({ ...filingData, description: e.target.value })}
                            required
                            rows={4}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="prepared_date">Prepared Date *</Label>
                          <Input
                            id="prepared_date"
                            type="date"
                            value={filingData.prepared_date}
                            onChange={(e) => setFilingData({ ...filingData, prepared_date: e.target.value })}
                            required
                          />
                        </div>

                        {!currentFilingId && (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Upload className="h-5 w-5 text-amber-600 mt-0.5" />
                              <div>
                                <h4 className="font-semibold text-amber-900 mb-1">Document Upload</h4>
                                <p className="text-sm text-amber-800">
                                  After recording this filing, you'll be able to upload the actual document file.
                                  All documents are date-stamped, categorized, and linked to the case.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {currentFilingId && filingData.case_id && (
                          <DocumentUpload
                            caseId={filingData.case_id}
                            filingId={currentFilingId}
                            onUploadComplete={() => {
                              toast.success('Document linked to filing successfully!');
                            }}
                          />
                        )}

                        <div className="flex gap-3">
                          <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            Record Filing
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowFilingForm(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                <div className="text-center py-8 text-slate-500">
                  Recent filings will appear here
                </div>
              </TabsContent>

              {/* Status Updates Tab */}
              <TabsContent value="status" className="space-y-6 mt-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Update Case Status</h3>
                  <Button
                    onClick={() => setShowStatusForm(!showStatusForm)}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4" />
                    {showStatusForm ? 'Cancel' : 'New Status Update'}
                  </Button>
                </div>

                {showStatusForm && (
                  <Card className="border-2 border-blue-200">
                    <CardContent className="pt-6">
                      <form onSubmit={handleStatusSubmit} className="space-y-4">
                        <div>
                          <CaseSelector
                            value={statusData.case_id}
                            onValueChange={(value) => setStatusData({ ...statusData, case_id: value })}
                            label="Case ID"
                            placeholder="Search and select case..."
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="status_update">Status Update *</Label>
                          <Textarea
                            id="status_update"
                            placeholder="What is the current status of this case?"
                            value={statusData.status_update}
                            onChange={(e) => setStatusData({ ...statusData, status_update: e.target.value })}
                            required
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="work_done">Work Done *</Label>
                          <Textarea
                            id="work_done"
                            placeholder="What work has been completed?"
                            value={statusData.work_done}
                            onChange={(e) => setStatusData({ ...statusData, work_done: e.target.value })}
                            required
                            rows={4}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="next_steps">Next Steps *</Label>
                          <Textarea
                            id="next_steps"
                            placeholder="What are the next steps?"
                            value={statusData.next_steps}
                            onChange={(e) => setStatusData({ ...statusData, next_steps: e.target.value })}
                            required
                            rows={3}
                          />
                        </div>

                        <div className="flex gap-3">
                          <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Update Status
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowStatusForm(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                <div className="text-center py-8 text-slate-500">
                  Recent status updates will appear here
                </div>
              </TabsContent>

              {/* My Assigned Cases Tab */}
              <TabsContent value="cases" className="space-y-4 mt-6">
                {loading ? (
                  <div className="text-center py-8 text-slate-500">Loading assigned cases...</div>
                ) : assignedCases.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No cases assigned</h3>
                    <p className="text-slate-600">You don't have any cases assigned yet</p>
                  </div>
                ) : (
                  assignedCases.map((assignment) => (
                    <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">
                              {assignment.cases?.case_number} - {assignment.cases?.title}
                            </h3>
                            <div className="text-sm text-slate-600 space-y-1">
                              <p>Assignment Reason: {assignment.assignment_reason}</p>
                              {assignment.instructions && (
                                <p>Instructions: {assignment.instructions}</p>
                              )}
                              <p className="text-xs">
                                Assigned: {format(new Date(assignment.assignment_date), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 border">
                            {assignment.priority}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
