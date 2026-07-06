'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/permissions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CaseSelector } from '@/components/forms/CaseSelector';
import { LabelWithHelp } from '@/components/help';
import { toast } from 'sonner';
import { ShieldAlert } from 'lucide-react';
import {
  SEARCH_WARRANT_STATUSES,
  emptyWarrantForm,
  type SearchWarrant,
  type SearchWarrantForm,
} from '@/lib/search-warrants';

interface SearchWarrantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** Provide to edit an existing warrant; omit to create a new one. */
  warrant?: SearchWarrant | null;
  /** Lock the case (used when adding from inside a case). */
  presetCaseId?: string;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-dlpp-purple border-b border-slate-200 pb-1.5">
      {children}
    </h3>
  );
}

export function SearchWarrantDialog({
  open,
  onOpenChange,
  onSuccess,
  warrant,
  presetCaseId,
}: SearchWarrantDialogProps) {
  const isEdit = Boolean(warrant);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<SearchWarrantForm>(emptyWarrantForm(presetCaseId));

  useEffect(() => {
    if (!open) return;
    if (warrant) {
      setForm({
        case_id: warrant.case_id ?? presetCaseId ?? '',
        warrant_number: warrant.warrant_number ?? '',
        crime_report_number: warrant.crime_report_number ?? '',
        date_received: warrant.date_received ?? '',
        received_from: warrant.received_from ?? '',
        police_officer_name: warrant.police_officer_name ?? '',
        police_officer_rank: warrant.police_officer_rank ?? '',
        police_contact_details: warrant.police_contact_details ?? '',
        received_by: warrant.received_by ?? '',
        date_assigned_to_lawyer: warrant.date_assigned_to_lawyer ?? '',
        dlpp_lawyer_in_carriage: warrant.dlpp_lawyer_in_carriage ?? '',
        applicant_informant: warrant.applicant_informant ?? '',
        respondent: warrant.respondent ?? '',
        land_description: warrant.land_description ?? '',
        legal_issue: warrant.legal_issue ?? '',
        land_file_reference: warrant.land_file_reference ?? '',
        title_file_reference: warrant.title_file_reference ?? '',
        documents_to_provide: warrant.documents_to_provide ?? '',
        witness_statement_status: warrant.witness_statement_status ?? '',
        status: warrant.status ?? 'Received',
        remarks_comments: warrant.remarks_comments ?? '',
      });
    } else {
      setForm(emptyWarrantForm(presetCaseId));
    }
  }, [open, warrant, presetCaseId]);

  const set = (key: keyof SearchWarrantForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.warrant_number.trim()) {
      toast.error('Please enter the search warrant number');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Convert empty strings to null so date/text columns stay clean.
      const payload: Record<string, unknown> = {
        case_id: form.case_id || null,
        warrant_number: form.warrant_number.trim(),
        crime_report_number: form.crime_report_number || null,
        date_received: form.date_received || null,
        received_from: form.received_from || null,
        police_officer_name: form.police_officer_name || null,
        police_officer_rank: form.police_officer_rank || null,
        police_contact_details: form.police_contact_details || null,
        received_by: form.received_by || null,
        date_assigned_to_lawyer: form.date_assigned_to_lawyer || null,
        dlpp_lawyer_in_carriage: form.dlpp_lawyer_in_carriage || null,
        applicant_informant: form.applicant_informant || null,
        respondent: form.respondent || null,
        land_description: form.land_description || null,
        legal_issue: form.legal_issue || null,
        land_file_reference: form.land_file_reference || null,
        title_file_reference: form.title_file_reference || null,
        documents_to_provide: form.documents_to_provide || null,
        witness_statement_status: form.witness_statement_status || null,
        status: form.status || 'Received',
        remarks_comments: form.remarks_comments || null,
      };

      if (isEdit && warrant) {
        payload.updated_by = user?.id ?? null;
        const { error } = await (supabase as any)
          .from('search_warrants')
          .update(payload)
          .eq('id', warrant.id);
        if (error) throw error;

        // Audit: general update, plus specific status / lawyer changes.
        await logAudit('update', 'search_warrants', warrant.id, 'search_warrant', {
          warrant_number: payload.warrant_number,
        });
        if (warrant.status !== form.status) {
          await logAudit('update', 'search_warrants', warrant.id, 'search_warrant', {
            change: 'status',
            from: warrant.status,
            to: form.status,
          });
        }
        if ((warrant.dlpp_lawyer_in_carriage ?? '') !== form.dlpp_lawyer_in_carriage) {
          await logAudit('update', 'search_warrants', warrant.id, 'search_warrant', {
            change: 'lawyer_assignment',
            from: warrant.dlpp_lawyer_in_carriage,
            to: form.dlpp_lawyer_in_carriage,
          });
        }
        toast.success('Search warrant updated');
      } else {
        payload.created_by = user?.id ?? null;
        const { data, error } = await (supabase as any)
          .from('search_warrants')
          .insert([payload])
          .select('id')
          .single();
        if (error) throw error;
        await logAudit('create', 'search_warrants', data?.id, 'search_warrant', {
          warrant_number: payload.warrant_number,
        });
        toast.success('Search warrant registered');
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error('Error saving search warrant:', err);
      if (err?.message?.includes('does not exist') || err?.code === '42P01') {
        toast.error('Search warrants table not found. Please run database-search-warrants.sql in Supabase.');
      } else {
        toast.error('Failed to save search warrant');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-dlpp-purple" />
            {isEdit ? 'Edit Search Warrant' : 'Register Search Warrant'}
          </DialogTitle>
          <DialogDescription>
            An official investigation record linked to a case. The respondent may be the
            Secretary DLPP, Registrar of Titles, a landowner or another entity.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Warrant identification */}
          <div className="space-y-3">
            <SectionTitle>Warrant Identification</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="warrant_number"
                  helpTitle="Search Warrant No."
                  help="The official warrant number as printed on the warrant document. This is the main identifier for the record."
                >
                  Search Warrant No. *
                </LabelWithHelp>
                <Input
                  id="warrant_number"
                  value={form.warrant_number}
                  onChange={(e) => set('warrant_number', e.target.value)}
                  placeholder="e.g., SW-2025-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="crime_report_number"
                  helpTitle="Crime Report (CR) No."
                  help="The police Crime Report number the warrant relates to. Copy it exactly from the police paperwork."
                >
                  Crime Report (CR) No.
                </LabelWithHelp>
                <Input
                  id="crime_report_number"
                  value={form.crime_report_number}
                  onChange={(e) => set('crime_report_number', e.target.value)}
                  placeholder="e.g., CR 456/2025"
                />
              </div>
            </div>
            <div>
              {presetCaseId ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  This warrant will be linked to the current case automatically.
                </div>
              ) : (
                <>
                  <CaseSelector
                    value={form.case_id}
                    onValueChange={(v) => set('case_id', v)}
                    label="Linked Case"
                    placeholder="Search and select the related case..."
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Link the warrant to the legal case it relates to (optional but recommended).
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Receipt & police source */}
          <div className="space-y-3">
            <SectionTitle>Receipt &amp; Police Source</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="date_received"
                  helpTitle="Date Received"
                  help="The date DLPP actually received the warrant. Use the real receipt date, not today's entry date."
                >
                  Date Received
                </LabelWithHelp>
                <Input
                  id="date_received"
                  type="date"
                  value={form.date_received}
                  onChange={(e) => set('date_received', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="received_from">Received From</Label>
                <Input
                  id="received_from"
                  value={form.received_from}
                  onChange={(e) => set('received_from', e.target.value)}
                  placeholder="e.g., Police Fraud Squad"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="police_officer_name">Police Officer Name</Label>
                <Input
                  id="police_officer_name"
                  value={form.police_officer_name}
                  onChange={(e) => set('police_officer_name', e.target.value)}
                  placeholder="Full name of the officer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="police_officer_rank">Police Officer Rank</Label>
                <Input
                  id="police_officer_rank"
                  value={form.police_officer_rank}
                  onChange={(e) => set('police_officer_rank', e.target.value)}
                  placeholder="e.g., Detective Sergeant"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <LabelWithHelp
                  htmlFor="police_contact_details"
                  helpTitle="Police Contact Details"
                  help="Phone and/or email for the officer, so DLPP can respond to the warrant and coordinate documents."
                >
                  Police Contact Details
                </LabelWithHelp>
                <Input
                  id="police_contact_details"
                  value={form.police_contact_details}
                  onChange={(e) => set('police_contact_details', e.target.value)}
                  placeholder="Phone / email"
                />
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="space-y-3">
            <SectionTitle>DLPP Assignment</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="received_by">Received By</Label>
                <Input
                  id="received_by"
                  value={form.received_by}
                  onChange={(e) => set('received_by', e.target.value)}
                  placeholder="DLPP officer who received it"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_assigned_to_lawyer">Date Assigned to Lawyer</Label>
                <Input
                  id="date_assigned_to_lawyer"
                  type="date"
                  value={form.date_assigned_to_lawyer}
                  onChange={(e) => set('date_assigned_to_lawyer', e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <LabelWithHelp
                  htmlFor="dlpp_lawyer_in_carriage"
                  helpTitle="DLPP Lawyer in Carriage"
                  help="The DLPP lawyer responsible for handling this warrant. Assigning a lawyer is recorded in the audit trail."
                >
                  DLPP Lawyer in Carriage
                </LabelWithHelp>
                <Input
                  id="dlpp_lawyer_in_carriage"
                  value={form.dlpp_lawyer_in_carriage}
                  onChange={(e) => set('dlpp_lawyer_in_carriage', e.target.value)}
                  placeholder="Lawyer name"
                />
              </div>
            </div>
          </div>

          {/* Parties & land */}
          <div className="space-y-3">
            <SectionTitle>Parties &amp; Land</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="applicant_informant"
                  helpTitle="Applicant / Informant"
                  help="The person or body that applied for or informed the warrant (often the police informant)."
                >
                  Applicant / Informant
                </LabelWithHelp>
                <Input
                  id="applicant_informant"
                  value={form.applicant_informant}
                  onChange={(e) => set('applicant_informant', e.target.value)}
                  placeholder="Applicant or informant"
                />
              </div>
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="respondent"
                  helpTitle="Respondent"
                  help="Who the warrant is directed at — may be the Secretary DLPP, Registrar of Titles, Department of Lands, a landowner or an occupier."
                >
                  Respondent
                </LabelWithHelp>
                <Input
                  id="respondent"
                  value={form.respondent}
                  onChange={(e) => set('respondent', e.target.value)}
                  placeholder="e.g., Registrar of Titles"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="land_description">Land Description</Label>
                <Textarea
                  id="land_description"
                  value={form.land_description}
                  onChange={(e) => set('land_description', e.target.value)}
                  placeholder="Portion / Section / Allotment and location"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Legal & files */}
          <div className="space-y-3">
            <SectionTitle>Legal Issue &amp; File References</SectionTitle>
            <div className="space-y-2">
              <LabelWithHelp
                htmlFor="legal_issue"
                helpTitle="Legal Issue"
                help="The legal question or investigation subject the warrant concerns (e.g., alleged fraudulent title transfer)."
              >
                Legal Issue
              </LabelWithHelp>
              <Textarea
                id="legal_issue"
                value={form.legal_issue}
                onChange={(e) => set('legal_issue', e.target.value)}
                placeholder="Describe the legal issue / investigation subject"
                rows={2}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="land_file_reference"
                  helpTitle="Land File Reference"
                  help="The DLPP land file number that holds the departmental records for this land."
                >
                  Land File Reference
                </LabelWithHelp>
                <Input
                  id="land_file_reference"
                  value={form.land_file_reference}
                  onChange={(e) => set('land_file_reference', e.target.value)}
                  placeholder="Land file no."
                />
              </div>
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="title_file_reference"
                  helpTitle="Title File Reference"
                  help="The Registrar of Titles file reference for the title relevant to the warrant."
                >
                  Title File Reference
                </LabelWithHelp>
                <Input
                  id="title_file_reference"
                  value={form.title_file_reference}
                  onChange={(e) => set('title_file_reference', e.target.value)}
                  placeholder="Title file no."
                />
              </div>
            </div>
          </div>

          {/* Documents & witness */}
          <div className="space-y-3">
            <SectionTitle>Documents &amp; Witness Statement</SectionTitle>
            <div className="space-y-2">
              <LabelWithHelp
                htmlFor="documents_to_provide"
                helpTitle="Documents to Provide"
                help="List the documents the warrant requires DLPP to provide (e.g., copies of the title, survey plan, file notes)."
              >
                Documents to Provide
              </LabelWithHelp>
              <Textarea
                id="documents_to_provide"
                value={form.documents_to_provide}
                onChange={(e) => set('documents_to_provide', e.target.value)}
                placeholder="List the documents requested by the warrant"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <LabelWithHelp
                htmlFor="witness_statement_status"
                helpTitle="Witness Statement"
                help="Whether a witness statement is required, being prepared, or provided — and by whom."
              >
                Witness Statement Status
              </LabelWithHelp>
              <Input
                id="witness_statement_status"
                value={form.witness_statement_status}
                onChange={(e) => set('witness_statement_status', e.target.value)}
                placeholder="e.g., Required from Registrar / Provided on 12 May"
              />
            </div>
          </div>

          {/* Status & remarks */}
          <div className="space-y-3">
            <SectionTitle>Status &amp; Remarks</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="status"
                  helpTitle="Status of Matter"
                  help="Where the warrant is in the workflow. Changing the status is recorded in the audit trail and drives the dashboard counts."
                >
                  Status of Matter
                </LabelWithHelp>
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEARCH_WARRANT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks_comments">Remarks / Comments</Label>
              <Textarea
                id="remarks_comments"
                value={form.remarks_comments}
                onChange={(e) => set('remarks_comments', e.target.value)}
                placeholder="Any additional notes"
                rows={2}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-200">
            <Button
              type="submit"
              disabled={loading}
              className="bg-dlpp-purple hover:bg-dlpp-purple-dark text-white"
            >
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Register Warrant'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
