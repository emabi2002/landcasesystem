'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileText, Plus, Send, Upload, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

type FilingStatus = 'draft' | 'prepared' | 'under_review' | 'changes_requested' | 'approved' | 'filed';

interface Filing {
  id: string;
  filing_type: string;
  filing_title: string | null;
  filing_subtype: string | null;
  title: string | null;
  description: string | null;
  draft_file_url: string | null;
  file_url: string | null;
  status: string;
  court_filing_date: string | null;
  created_at: string;
}

interface CaseInfo {
  id: string;
  case_number: string;
  title: string | null;
  workflow_state: string;
  assigned_officer_id: string | null;
}

export default function FilingsManagementPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.caseId as string;

  const [loading, setLoading] = useState(true);
  const [caseInfo, setCaseInfo] = useState<CaseInfo | null>(null);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [filedDialogOpen, setFiledDialogOpen] = useState(false);
  const [selectedFiling, setSelectedFiling] = useState<Filing | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'return'>('approve');
  const [reviewComment, setReviewComment] = useState('');
  const [filedForm, setFiledForm] = useState({
    court_filing_date: '',
    court_reference: '',
    file_url: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Form state for creating filing
  const [filingForm, setFilingForm] = useState({
    filing_type: '',
    filing_title: '',
    filing_subtype: '',
    description: '',
    draft_file_url: ''
  });

  useEffect(() => {
    loadData();
  }, [caseId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('id, case_number, title, workflow_state, assigned_officer_id')
        .eq('id', caseId)
        .single();

      if (caseError) throw caseError;

      const { data: filingsData, error: filingsError } = await supabase
        .from('filings')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (filingsError) throw filingsError;

      setCaseInfo(caseData);
      setFilings(filingsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load filings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFiling = async () => {
    if (!filingForm.filing_type || !filingForm.filing_title) {
      toast.error('Please fill in required fields');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/filings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          ...filingForm
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create filing');
      }

      toast.success('Filing created successfully');
      setCreateDialogOpen(false);
      setFilingForm({
        filing_type: '',
        filing_title: '',
        filing_subtype: '',
        description: '',
        draft_file_url: ''
      });
      loadData();
    } catch (error) {
      console.error('Error creating filing:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create filing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    const draftFilings = filings.filter(f => ['draft', 'prepared', 'changes_requested'].includes(f.status));

    if (draftFilings.length === 0) {
      toast.error('No draft filings to submit');
      return;
    }

    if (!confirm(`Submit ${draftFilings.length} filing(s) for manager review?`)) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/filings/submit-for-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseId })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit for review');
      }

      toast.success(`${result.filing_count} filing(s) submitted for review`);
      loadData();
    } catch (error) {
      console.error('Error submitting for review:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit for review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewFiling = async () => {
    if (!selectedFiling) return;
    if (reviewAction === 'return' && !reviewComment.trim()) {
      toast.error('A return comment is required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/filings/${selectedFiling.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: reviewAction, comment: reviewComment }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || 'Review action failed');
      toast.success(reviewAction === 'approve' ? 'Filing approved for filing' : 'Filing returned for correction');
      setReviewDialogOpen(false);
      setSelectedFiling(null);
      setReviewComment('');
      await loadData();
    } catch (error) {
      console.error('Error reviewing filing:', error);
      toast.error(error instanceof Error ? error.message : 'Review action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordFiled = async () => {
    if (!selectedFiling) return;
    if (!filedForm.court_filing_date) {
      toast.error('Court filing date is required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/filings/${selectedFiling.id}/filed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filedForm),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed to record filing');
      toast.success('Filing recorded as filed');
      setFiledDialogOpen(false);
      setSelectedFiling(null);
      setFiledForm({ court_filing_date: '', court_reference: '', file_url: '' });
      await loadData();
    } catch (error) {
      console.error('Error recording filed filing:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to record filing');
    } finally {
      setSubmitting(false);
    }
  };

  const openReviewDialog = (filing: Filing, action: 'approve' | 'return') => {
    setSelectedFiling(filing);
    setReviewAction(action);
    setReviewComment('');
    setReviewDialogOpen(true);
  };

  const openFiledDialog = (filing: Filing) => {
    setSelectedFiling(filing);
    setFiledForm({
      court_filing_date: new Date().toISOString().split('T')[0],
      court_reference: '',
      file_url: filing.file_url || '',
    });
    setFiledDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<FilingStatus, { className: string; icon: any }> = {
      draft: { className: 'bg-gray-100 text-gray-800', icon: FileText },
      prepared: { className: 'bg-blue-100 text-blue-800', icon: FileText },
      under_review: { className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      changes_requested: { className: 'bg-orange-100 text-orange-800', icon: AlertCircle },
      approved: { className: 'bg-green-100 text-green-800', icon: CheckCircle },
      filed: { className: 'bg-purple-100 text-purple-800', icon: CheckCircle }
    };

    const variant = variants[status as FilingStatus] || variants.draft;
    const Icon = variant.icon;

    return (
      <Badge className={variant.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace(/_/g, ' ').toUpperCase()}
      </Badge>
    );
  };

  const normaliseStatus = (status: string) => status.toUpperCase();

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6"><div className="text-center">Loading...</div></div>
      </AppLayout>
    );
  }

  if (!caseInfo) {
    return (
      <AppLayout>
        <div className="p-6"><div className="text-center">Case not found</div></div>
      </AppLayout>
    );
  }

  const canEdit = ['ASSIGNED', 'REGISTRATION_COMPLETED', 'DRAFTING', 'APPROVED_FOR_FILING'].includes(caseInfo.workflow_state);
  const canSubmitForReview = caseInfo.workflow_state === 'DRAFTING' && filings.some(f => ['draft', 'prepared'].includes(f.status));

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold">Filings Management</h1>
              </div>
              <div className="text-muted-foreground">
                <div className="font-semibold">{caseInfo.case_number}</div>
                <div className="text-sm">{caseInfo.title}</div>
              </div>
            </div>
            <div className="flex gap-2">
              {canSubmitForReview && (
                <Button
                  onClick={handleSubmitForReview}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit All for Review
                </Button>
              )}
              {canEdit && (
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Filing
                </Button>
              )}
            </div>
          </div>

          <Badge variant="secondary">
            Workflow State: {caseInfo.workflow_state}
          </Badge>
        </div>

        {/* Filings List */}
        {filings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Filings Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create draft filings for this case
              </p>
              {canEdit && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Filing
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filings.map((filing) => (
              <Card key={filing.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{filing.filing_title}</CardTitle>
                        {getStatusBadge(filing.status)}
                      </div>
                      <CardDescription>
                        {filing.filing_type.replace(/_/g, ' ').toUpperCase()}
                        {filing.filing_subtype && ` - ${filing.filing_subtype}`}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filing.description && (
                    <p className="text-sm text-muted-foreground mb-4">{filing.description}</p>
                  )}

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1">Draft Document</div>
                      {filing.draft_file_url ? (
                        <a href={filing.draft_file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View Draft
                        </a>
                      ) : (
                        <div className="text-muted-foreground">Not uploaded</div>
                      )}
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Sealed Document</div>
                      {filing.file_url ? (
                        <a href={filing.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View Sealed
                        </a>
                      ) : (
                        <div className="text-muted-foreground">Not uploaded</div>
                      )}
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Created</div>
                      <div>{format(new Date(filing.created_at), 'dd MMM yyyy')}</div>
                    </div>
                  </div>

                  {normaliseStatus(filing.status) === 'UNDER_REVIEW' && (
                    <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => openReviewDialog(filing, 'approve')}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve for Filing
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openReviewDialog(filing, 'return')}>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Return for Correction
                      </Button>
                    </div>
                  )}

                  {normaliseStatus(filing.status) === 'APPROVED_FOR_FILING' && (
                    <div className="mt-4 pt-4 border-t">
                      <Button size="sm" variant="outline" onClick={() => openFiledDialog(filing)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Record as Filed
                      </Button>
                    </div>
                  )}

                  {filing.status === 'approved' && !filing.file_url && (
                    <div className="mt-4 pt-4 border-t">
                      <Button size="sm" variant="outline" onClick={() => openFiledDialog(filing)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Sealed Document
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Filing Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Filing</DialogTitle>
              <DialogDescription>
                Create a draft court filing for this case
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="filing_type">Filing Type *</Label>
                <Select
                  value={filingForm.filing_type}
                  onValueChange={(value) => setFilingForm(prev => ({ ...prev, filing_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select filing type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="defence">Defence</SelectItem>
                    <SelectItem value="statement_disputed_facts">Statement of Disputed Facts</SelectItem>
                    <SelectItem value="statement_agreed_facts">Statement of Agreed Facts</SelectItem>
                    <SelectItem value="affidavit">Affidavit</SelectItem>
                    <SelectItem value="instruction_letter">Instruction Letter</SelectItem>
                    <SelectItem value="brief_out_request">Brief-out Request</SelectItem>
                    <SelectItem value="notice_of_motion">Notice of Motion</SelectItem>
                    <SelectItem value="written_submissions">Written Submissions</SelectItem>
                    <SelectItem value="skeletal_arguments">Skeletal Arguments</SelectItem>
                    <SelectItem value="reply">Reply</SelectItem>
                    <SelectItem value="rejoinder">Rejoinder</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filing_title">Filing Title *</Label>
                <Input
                  id="filing_title"
                  placeholder="e.g., Defence to Writ of Summons"
                  value={filingForm.filing_title}
                  onChange={(e) => setFilingForm(prev => ({ ...prev, filing_title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filing_subtype">Filing Subtype (Optional)</Label>
                <Input
                  id="filing_subtype"
                  placeholder="Additional classification"
                  value={filingForm.filing_subtype}
                  onChange={(e) => setFilingForm(prev => ({ ...prev, filing_subtype: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this filing..."
                  value={filingForm.description}
                  onChange={(e) => setFilingForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="draft_file_url">Draft Document URL (Optional)</Label>
                <Input
                  id="draft_file_url"
                  placeholder="https://..."
                  value={filingForm.draft_file_url}
                  onChange={(e) => setFilingForm(prev => ({ ...prev, draft_file_url: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  You can upload the draft document later
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleCreateFiling} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Filing'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{reviewAction === 'approve' ? 'Approve Filing' : 'Return Filing for Correction'}</DialogTitle>
              <DialogDescription>
                {reviewAction === 'approve'
                  ? 'Approve this filing so it can be recorded as filed with the court.'
                  : 'Return this filing to drafting with a correction comment.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Label htmlFor="review_comment">Review Comment {reviewAction === 'return' ? '*' : '(Optional)'}</Label>
              <Textarea
                id="review_comment"
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                rows={4}
                placeholder="Add review notes..."
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleReviewFiling} disabled={submitting}>
                {submitting ? 'Saving...' : reviewAction === 'approve' ? 'Approve' : 'Return'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={filedDialogOpen} onOpenChange={setFiledDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Court Filing</DialogTitle>
              <DialogDescription>Record the court filing date and reference for this approved filing.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="court_filing_date">Court Filing Date *</Label>
                <Input
                  id="court_filing_date"
                  type="date"
                  value={filedForm.court_filing_date}
                  onChange={(event) => setFiledForm((prev) => ({ ...prev, court_filing_date: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="court_reference">Court Reference</Label>
                <Input
                  id="court_reference"
                  value={filedForm.court_reference}
                  onChange={(event) => setFiledForm((prev) => ({ ...prev, court_reference: event.target.value }))}
                  placeholder="Court filing reference"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file_url">Filed Document URL / Storage Path</Label>
                <Input
                  id="file_url"
                  value={filedForm.file_url}
                  onChange={(event) => setFiledForm((prev) => ({ ...prev, file_url: event.target.value }))}
                  placeholder="Optional filed document URL or storage path"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFiledDialogOpen(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleRecordFiled} disabled={submitting}>{submitting ? 'Saving...' : 'Record Filed'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
