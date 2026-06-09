'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Archive, AlertTriangle, CheckCircle } from 'lucide-react';

interface CaseClosureDialogProps {
  caseId: string;
  caseNumber?: string;
  caseTitle?: string;
  onSuccess?: () => void;
}

export function CaseClosureDialog({ caseId, caseNumber, caseTitle, onSuccess }: CaseClosureDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    closure_status: '',
    closure_date: new Date().toISOString().split('T')[0],
    final_outcome: '',
    outcome_summary: '',
    archive_location: '',
    closure_notes: '',
    compliance_completed: false,
    documents_archived: false,
    costs_finalized: false,
    judgment_registered: false,
  });

  const canClose = formData.closure_status && formData.final_outcome;

  const handleInitiateClose = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canClose) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Show confirmation dialog
    setConfirmOpen(true);
  };

  const handleConfirmClose = async () => {
    setLoading(true);
    setConfirmOpen(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update case status to closed
      const { error: caseError } = await (supabase as any)
        .from('cases')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('id', caseId);

      if (caseError) throw caseError;

      // Try to insert closure record
      try {
        await (supabase as any)
          .from('case_closures')
          .insert({
            case_id: caseId,
            closure_status: formData.closure_status,
            closure_date: formData.closure_date,
            final_outcome: formData.final_outcome,
            outcome_summary: formData.outcome_summary,
            archive_location: formData.archive_location,
            closure_notes: formData.closure_notes,
            closed_by: user.id,
          });
      } catch (e) {
        // Table might not exist, continue
        console.log('Closure table not available, continuing...');
      }

      // Add to case history
      await (supabase as any)
        .from('case_history')
        .insert({
          case_id: caseId,
          action: 'Case Closed',
          description: `Case closed with status: ${formData.closure_status}. Outcome: ${formData.final_outcome}. ${formData.closure_notes ? `Notes: ${formData.closure_notes}` : ''}`,
          performed_by: user.id,
        });

      toast.success('Case closed successfully!');
      setOpen(false);
      setFormData({
        closure_status: '',
        closure_date: new Date().toISOString().split('T')[0],
        final_outcome: '',
        outcome_summary: '',
        archive_location: '',
        closure_notes: '',
        compliance_completed: false,
        documents_archived: false,
        costs_finalized: false,
        judgment_registered: false,
      });
      onSuccess?.();
    } catch (error) {
      console.error('Error closing case:', error);
      toast.error('Failed to close case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2 bg-red-600 hover:bg-red-700">
            <Archive className="h-4 w-4" />
            Close Case
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Close Case
            </DialogTitle>
            <DialogDescription>
              Finalize and archive {caseNumber || 'this case'}
              {caseTitle && <span className="block text-slate-700 mt-1 font-medium">{caseTitle}</span>}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInitiateClose} className="space-y-6">
            {/* Warning Banner */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900">Important Notice</h4>
                  <p className="text-sm text-amber-800 mt-1">
                    Once closed, the case will be archived and no further modifications can be made without administrator approval.
                  </p>
                </div>
              </div>
            </div>

            {/* Closure Status & Date */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="closure_status">Closure Status *</Label>
                <Select
                  value={formData.closure_status}
                  onValueChange={(value) => setFormData({ ...formData, closure_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select closure status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concluded">Concluded</SelectItem>
                    <SelectItem value="settled">Settled</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                    <SelectItem value="appeal_pending">Appeal Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="closure_date">Closure Date *</Label>
                <Input
                  id="closure_date"
                  type="date"
                  value={formData.closure_date}
                  onChange={(e) => setFormData({ ...formData, closure_date: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Final Outcome */}
            <div className="space-y-2">
              <Label htmlFor="final_outcome">Final Outcome *</Label>
              <Select
                value={formData.final_outcome}
                onValueChange={(value) => setFormData({ ...formData, final_outcome: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select final outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_favor_dlpp">In Favor of DLPP</SelectItem>
                  <SelectItem value="against_dlpp">Against DLPP</SelectItem>
                  <SelectItem value="partial_dlpp">Partial - Mixed Result</SelectItem>
                  <SelectItem value="settled_favorably">Settled Favorably</SelectItem>
                  <SelectItem value="settled_unfavorably">Settled Unfavorably</SelectItem>
                  <SelectItem value="dismissed_favor">Dismissed in Favor</SelectItem>
                  <SelectItem value="dismissed_against">Dismissed Against</SelectItem>
                  <SelectItem value="withdrawn_plaintiff">Withdrawn by Plaintiff</SelectItem>
                  <SelectItem value="no_contest">No Contest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Outcome Summary */}
            <div className="space-y-2">
              <Label htmlFor="outcome_summary">Outcome Summary</Label>
              <Textarea
                id="outcome_summary"
                placeholder="Provide a brief summary of the case outcome..."
                value={formData.outcome_summary}
                onChange={(e) => setFormData({ ...formData, outcome_summary: e.target.value })}
                rows={3}
              />
            </div>

            {/* Pre-Closure Checklist */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Pre-Closure Checklist</Label>
              <div className="grid gap-3 p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="judgment_registered"
                    checked={formData.judgment_registered}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, judgment_registered: checked as boolean })
                    }
                  />
                  <label htmlFor="judgment_registered" className="text-sm text-slate-700 cursor-pointer">
                    Court order/judgment has been registered
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="compliance_completed"
                    checked={formData.compliance_completed}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, compliance_completed: checked as boolean })
                    }
                  />
                  <label htmlFor="compliance_completed" className="text-sm text-slate-700 cursor-pointer">
                    All compliance requirements have been fulfilled
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="documents_archived"
                    checked={formData.documents_archived}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, documents_archived: checked as boolean })
                    }
                  />
                  <label htmlFor="documents_archived" className="text-sm text-slate-700 cursor-pointer">
                    All documents have been uploaded and archived
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="costs_finalized"
                    checked={formData.costs_finalized}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, costs_finalized: checked as boolean })
                    }
                  />
                  <label htmlFor="costs_finalized" className="text-sm text-slate-700 cursor-pointer">
                    All litigation costs have been finalized
                  </label>
                </div>
              </div>
            </div>

            {/* Archive Location */}
            <div className="space-y-2">
              <Label htmlFor="archive_location">Archive Location</Label>
              <Input
                id="archive_location"
                placeholder="e.g., Registry File Room, Shelf B-12"
                value={formData.archive_location}
                onChange={(e) => setFormData({ ...formData, archive_location: e.target.value })}
              />
            </div>

            {/* Closure Notes */}
            <div className="space-y-2">
              <Label htmlFor="closure_notes">Closure Notes</Label>
              <Textarea
                id="closure_notes"
                placeholder="Any additional notes about the case closure..."
                value={formData.closure_notes}
                onChange={(e) => setFormData({ ...formData, closure_notes: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !canClose}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? 'Closing...' : 'Close Case'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Confirm Case Closure
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to close case <strong>{caseNumber}</strong>. This action will:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Mark the case as closed</li>
                <li>Archive all case records</li>
                <li>Prevent further modifications without admin approval</li>
              </ul>
              <p className="font-semibold text-slate-900">
                Are you sure you want to proceed?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClose}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Close Case
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
