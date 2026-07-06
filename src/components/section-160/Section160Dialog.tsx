'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/permissions';
import { sendSection160Notifications } from '@/lib/section-160-notifications';
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
import { Landmark } from 'lucide-react';
import {
  SECTION_160_STATUSES,
  emptyApplicationForm,
  type Section160Application,
  type Section160Form,
} from '@/lib/section-160';

interface Section160DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  application?: Section160Application | null;
  presetCaseId?: string;
}

interface LawyerProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b border-slate-200 pb-1.5 text-xs font-semibold uppercase tracking-wide text-dlpp-purple">
      {children}
    </h3>
  );
}

export function Section160Dialog({
  open,
  onOpenChange,
  onSuccess,
  application,
  presetCaseId,
}: Section160DialogProps) {
  const isEdit = Boolean(application);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Section160Form>(emptyApplicationForm(presetCaseId));
  const [lawyers, setLawyers] = useState<LawyerProfile[]>([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, email')
        .eq('is_active', true)
        .order('full_name', { ascending: true });
      setLawyers((data as LawyerProfile[]) || []);
    })();
  }, [open]);

  const lawyerLabel = (p: LawyerProfile) => p.full_name || p.email || p.id.slice(0, 8);

  useEffect(() => {
    if (!open) return;
    if (application) {
      setForm({
        application_year: application.application_year ?? '',
        date_received: application.date_received ?? '',
        date_assigned_to_legal_officer: application.date_assigned_to_legal_officer ?? '',
        dlpp_lawyer_in_carriage: application.dlpp_lawyer_in_carriage ?? '',
        dlpp_lawyer_user_id: application.dlpp_lawyer_user_id ?? '',
        solicitor_general_lawyer: application.solicitor_general_lawyer ?? '',
        private_law_firm: application.private_law_firm ?? '',
        defendants_lawyer: application.defendants_lawyer ?? '',
        applicant_registrar_of_titles: application.applicant_registrar_of_titles ?? '',
        defendant: application.defendant ?? '',
        land_description: application.land_description ?? '',
        title_file_reference: application.title_file_reference ?? '',
        letter_of_summons_date: application.letter_of_summons_date ?? '',
        summons_date: application.summons_date ?? '',
        consignment_note: application.consignment_note ?? '',
        grounds_for_application: application.grounds_for_application ?? '',
        court_file_reference_no: application.court_file_reference_no ?? '',
        status_of_matter: application.status_of_matter ?? 'Received',
        comments_remarks: application.comments_remarks ?? '',
        case_id: application.case_id ?? presetCaseId ?? '',
      });
    } else {
      setForm(emptyApplicationForm(presetCaseId));
    }
  }, [open, application, presetCaseId]);

  const set = (key: keyof Section160Form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.defendant.trim()) {
      toast.error('Please enter the defendant');
      return;
    }

    setLoading(true);
    let savedId: string | null = application?.id ?? null;
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Derive the application year from the received date when blank.
      const applicationYear =
        form.application_year.trim() ||
        (form.date_received ? form.date_received.slice(0, 4) : '');

      const payload: Record<string, unknown> = {
        application_year: applicationYear || null,
        date_received: form.date_received || null,
        date_assigned_to_legal_officer: form.date_assigned_to_legal_officer || null,
        dlpp_lawyer_in_carriage: form.dlpp_lawyer_in_carriage || null,
        dlpp_lawyer_user_id: form.dlpp_lawyer_user_id || null,
        solicitor_general_lawyer: form.solicitor_general_lawyer || null,
        private_law_firm: form.private_law_firm || null,
        defendants_lawyer: form.defendants_lawyer || null,
        applicant_registrar_of_titles: form.applicant_registrar_of_titles || null,
        defendant: form.defendant.trim(),
        land_description: form.land_description || null,
        title_file_reference: form.title_file_reference || null,
        letter_of_summons_date: form.letter_of_summons_date || null,
        summons_date: form.summons_date || null,
        consignment_note: form.consignment_note || null,
        grounds_for_application: form.grounds_for_application || null,
        court_file_reference_no: form.court_file_reference_no || null,
        status_of_matter: form.status_of_matter || 'Received',
        comments_remarks: form.comments_remarks || null,
        case_id: form.case_id || null,
      };

      if (isEdit && application) {
        payload.updated_by = user?.id ?? null;
        const { error } = await (supabase as any)
          .from('section_160_applications')
          .update(payload)
          .eq('id', application.id);
        if (error) throw error;

        await logAudit('update', 'section_160', application.id, 'section_160_application', {
          defendant: payload.defendant,
        });
        if (application.status_of_matter !== form.status_of_matter) {
          await logAudit('update', 'section_160', application.id, 'section_160_application', {
            change: 'status',
            from: application.status_of_matter,
            to: form.status_of_matter,
          });
        }
        if ((application.dlpp_lawyer_in_carriage ?? '') !== form.dlpp_lawyer_in_carriage) {
          await logAudit('update', 'section_160', application.id, 'section_160_application', {
            change: 'lawyer_assignment',
            from: application.dlpp_lawyer_in_carriage,
            to: form.dlpp_lawyer_in_carriage,
          });
        }
        if ((application.court_file_reference_no ?? '') !== form.court_file_reference_no) {
          await logAudit('update', 'section_160', application.id, 'section_160_application', {
            change: 'court_file',
            from: application.court_file_reference_no,
            to: form.court_file_reference_no,
          });
        }
        if ((application.case_id ?? '') !== (form.case_id ?? '')) {
          await logAudit('update', 'section_160', application.id, 'section_160_application', {
            change: 'case_link',
            from: application.case_id,
            to: form.case_id,
          });
        }
        toast.success('Section 160(2) Application updated');
      } else {
        payload.created_by = user?.id ?? null;
        const { data, error } = await (supabase as any)
          .from('section_160_applications')
          .insert([payload])
          .select('id')
          .single();
        if (error) throw error;
        savedId = data?.id ?? null;
        await logAudit('create', 'section_160', data?.id, 'section_160_application', {
          defendant: payload.defendant,
        });
        toast.success('Section 160(2) Application registered');
      }

      // Alert the assigned lawyer on assignment / status change.
      if (savedId) {
        await sendSection160Notifications({
          isEdit,
          before: application ?? null,
          after: {
            id: savedId,
            application_year: applicationYear,
            case_id: form.case_id || null,
            defendant: form.defendant.trim(),
            court_file_reference_no: form.court_file_reference_no || null,
            dlpp_lawyer_user_id: form.dlpp_lawyer_user_id || null,
            status_of_matter: form.status_of_matter,
          },
        });
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error('Error saving Section 160(2) Application:', err);
      if (err?.message?.includes('does not exist') || err?.code === '42P01') {
        toast.error('Section 160 table not found. Run database-section-160.sql in Supabase.');
      } else {
        toast.error('Failed to save application');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-dlpp-purple" />
            {isEdit ? 'Edit Section 160(2) Application' : 'Register Section 160(2) Application'}
          </DialogTitle>
          <DialogDescription>
            An application under the Land Registration Act 1981. It is a registry entry — not a
            plaintiff or defendant record — and can create or link to a legal case.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identification */}
          <div className="space-y-3">
            <SectionTitle>Application Identification</SectionTitle>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="application_year"
                  helpTitle="Application Year"
                  help="The year the application belongs to. Auto-filled from the date received; you can override it."
                >
                  Application Year
                </LabelWithHelp>
                <Input
                  id="application_year"
                  value={form.application_year}
                  onChange={(e) => set('application_year', e.target.value)}
                  placeholder="e.g., 2025"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="date_received"
                  helpTitle="Date Received"
                  help="The date the Department received the application. Use the real receipt date."
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
                <Label htmlFor="date_assigned_to_legal_officer">Date Assigned to Legal Officer</Label>
                <Input
                  id="date_assigned_to_legal_officer"
                  type="date"
                  value={form.date_assigned_to_legal_officer}
                  onChange={(e) => set('date_assigned_to_legal_officer', e.target.value)}
                />
              </div>
            </div>
            <div>
              {presetCaseId ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  This application will be linked to the current case automatically.
                </div>
              ) : (
                <>
                  <CaseSelector
                    value={form.case_id}
                    onValueChange={(v) => set('case_id', v)}
                    label="Linked Case"
                    placeholder="Search and select an existing case (optional)..."
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Leave blank to register now and link (or create) a case later.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Parties */}
          <div className="space-y-3">
            <SectionTitle>Parties</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="applicant_registrar_of_titles"
                  helpTitle="Applicant — Registrar of Titles"
                  help="The applicant, usually the Registrar of Titles."
                >
                  Applicant — Registrar of Titles
                </LabelWithHelp>
                <Input
                  id="applicant_registrar_of_titles"
                  value={form.applicant_registrar_of_titles}
                  onChange={(e) => set('applicant_registrar_of_titles', e.target.value)}
                  placeholder="Registrar of Titles"
                />
              </div>
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="defendant"
                  helpTitle="Defendant"
                  help="The defendant / respondent in the application. This is a key search field."
                >
                  Defendant *
                </LabelWithHelp>
                <Input
                  id="defendant"
                  value={form.defendant}
                  onChange={(e) => set('defendant', e.target.value)}
                  placeholder="Defendant name"
                  required
                />
              </div>
            </div>
          </div>

          {/* Lawyers */}
          <div className="space-y-3">
            <SectionTitle>Lawyers</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="dlpp_lawyer_user_id"
                  helpTitle="DLPP Lawyer in Carriage"
                  help="The DLPP lawyer in carriage. Choose a system user so they are alerted when assigned or when the status changes."
                >
                  DLPP Lawyer in Carriage
                </LabelWithHelp>
                <Select
                  value={form.dlpp_lawyer_user_id}
                  onValueChange={(v) => {
                    const picked = lawyers.find((l) => l.id === v);
                    setForm((prev) => ({
                      ...prev,
                      dlpp_lawyer_user_id: v,
                      dlpp_lawyer_in_carriage: picked ? lawyerLabel(picked) : prev.dlpp_lawyer_in_carriage,
                      date_assigned_to_legal_officer:
                        prev.date_assigned_to_legal_officer || new Date().toISOString().split('T')[0],
                    }));
                  }}
                >
                  <SelectTrigger id="dlpp_lawyer_user_id">
                    <SelectValue placeholder="Select DLPP lawyer" />
                  </SelectTrigger>
                  <SelectContent>
                    {lawyers.length === 0 ? (
                      <div className="px-2 py-1.5 text-xs text-slate-500">No active users found</div>
                    ) : (
                      lawyers.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {lawyerLabel(l)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {form.dlpp_lawyer_in_carriage && !form.dlpp_lawyer_user_id && (
                  <p className="text-xs text-amber-600">
                    Recorded as “{form.dlpp_lawyer_in_carriage}” with no linked user — select one to enable alerts.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="solicitor_general_lawyer">Solicitor General Lawyer</Label>
                <Input
                  id="solicitor_general_lawyer"
                  value={form.solicitor_general_lawyer}
                  onChange={(e) => set('solicitor_general_lawyer', e.target.value)}
                  placeholder="SG lawyer (if involved)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="private_law_firm">Private Law Firm</Label>
                <Input
                  id="private_law_firm"
                  value={form.private_law_firm}
                  onChange={(e) => set('private_law_firm', e.target.value)}
                  placeholder="Private firm (if instructed)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defendants_lawyer">Defendant&apos;s Lawyer</Label>
                <Input
                  id="defendants_lawyer"
                  value={form.defendants_lawyer}
                  onChange={(e) => set('defendants_lawyer', e.target.value)}
                  placeholder="Lawyer acting for the defendant"
                />
              </div>
            </div>
          </div>

          {/* Land & title */}
          <div className="space-y-3">
            <SectionTitle>Land &amp; Title</SectionTitle>
            <div className="space-y-2">
              <Label htmlFor="land_description">Land Description</Label>
              <Textarea
                id="land_description"
                value={form.land_description}
                onChange={(e) => set('land_description', e.target.value)}
                placeholder="Portion / Section / Allotment and location"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <LabelWithHelp
                htmlFor="title_file_reference"
                helpTitle="Title File Reference"
                help="The Registrar of Titles file reference for the relevant title."
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

          {/* Summons */}
          <div className="space-y-3">
            <SectionTitle>Summons</SectionTitle>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="letter_of_summons_date"
                  helpTitle="Date of Letter"
                  help="The date of the letter of summons."
                >
                  Date of Letter
                </LabelWithHelp>
                <Input
                  id="letter_of_summons_date"
                  type="date"
                  value={form.letter_of_summons_date}
                  onChange={(e) => set('letter_of_summons_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="summons_date"
                  helpTitle="Date Summons Was Received"
                  help="The date the summons was received."
                >
                  Date Summons Was Received
                </LabelWithHelp>
                <Input
                  id="summons_date"
                  type="date"
                  value={form.summons_date}
                  onChange={(e) => set('summons_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="consignment_note">Consignment Note</Label>
                <Input
                  id="consignment_note"
                  value={form.consignment_note}
                  onChange={(e) => set('consignment_note', e.target.value)}
                  placeholder="Consignment note ref."
                />
              </div>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <SectionTitle>Legal</SectionTitle>
            <div className="space-y-2">
              <LabelWithHelp
                htmlFor="grounds_for_application"
                helpTitle="Grounds for the Application"
                help="The legal grounds on which the Section 160(2) application is made."
              >
                Grounds for the Application
              </LabelWithHelp>
              <Textarea
                id="grounds_for_application"
                value={form.grounds_for_application}
                onChange={(e) => set('grounds_for_application', e.target.value)}
                placeholder="Describe the grounds for the application"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <LabelWithHelp
                htmlFor="court_file_reference_no"
                helpTitle="Court File Reference No."
                help="The court file reference for the matter, once it is before the court."
              >
                Court File Reference No.
              </LabelWithHelp>
              <Input
                id="court_file_reference_no"
                value={form.court_file_reference_no}
                onChange={(e) => set('court_file_reference_no', e.target.value)}
                placeholder="e.g., OS 123 of 2025"
              />
            </div>
          </div>

          {/* Status & remarks */}
          <div className="space-y-3">
            <SectionTitle>Status &amp; Remarks</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="status_of_matter"
                  helpTitle="Status of the Matter"
                  help="Where the matter currently stands. Status changes are recorded in the audit trail and drive the dashboard counts."
                >
                  Status of the Matter
                </LabelWithHelp>
                <Select value={form.status_of_matter} onValueChange={(v) => set('status_of_matter', v)}>
                  <SelectTrigger id="status_of_matter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_160_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comments_remarks">Comments / Remarks</Label>
              <Textarea
                id="comments_remarks"
                value={form.comments_remarks}
                onChange={(e) => set('comments_remarks', e.target.value)}
                placeholder="Any additional notes"
                rows={2}
              />
            </div>
          </div>

          <div className="flex gap-3 border-t border-slate-200 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-dlpp-purple text-white hover:bg-dlpp-purple-dark"
            >
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Register Application'}
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
