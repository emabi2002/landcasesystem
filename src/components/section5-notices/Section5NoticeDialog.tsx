'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/permissions';
import { sendSection5Notifications } from '@/lib/section5-notifications';
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
import { FileWarning } from 'lucide-react';
import {
  CLAIMANT_TYPES,
  PNG_PROVINCES,
  SECTION5_ENTRY_STATUSES,
  getAllowedNextStatuses,
  emptyNoticeForm,
  type Section5Notice,
  type Section5NoticeForm,
} from '@/lib/section5-notices';

interface Section5NoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** Provide to edit an existing notice; omit to create a new one. */
  notice?: Section5Notice | null;
  /** Lock the case (used when adding from inside a case). */
  presetCaseId?: string;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b border-slate-200 pb-1.5 text-xs font-semibold uppercase tracking-wide text-dlpp-purple">
      {children}
    </h3>
  );
}

interface LawyerProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}

export function Section5NoticeDialog({
  open,
  onOpenChange,
  onSuccess,
  notice,
  presetCaseId,
}: Section5NoticeDialogProps) {
  const isEdit = Boolean(notice);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Section5NoticeForm>(emptyNoticeForm(presetCaseId));
  const [lawyers, setLawyers] = useState<LawyerProfile[]>([]);

  // Load internal users who can be assigned as the DLPP lawyer in carriage.
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
    if (notice) {
      setForm({
        notice_number: notice.notice_number ?? '',
        case_id: notice.case_id ?? presetCaseId ?? '',
        date_received: notice.date_received ?? '',
        file_opened_date: notice.file_opened_date ?? '',
        assigned_lawyer_date: notice.assigned_lawyer_date ?? '',
        dlpp_lawyer_id: notice.dlpp_lawyer_id ?? '',
        dlpp_lawyer_user_id: notice.dlpp_lawyer_user_id ?? '',
        solicitor_general_lawyer: notice.solicitor_general_lawyer ?? '',
        claimant_lawyers: notice.claimant_lawyers ?? '',
        claimant_name: notice.claimant_name ?? '',
        claimant_type: notice.claimant_type ?? '',
        ilg_name: notice.ilg_name ?? '',
        ilg_registration_number: notice.ilg_registration_number ?? '',
        land_description: notice.land_description ?? '',
        land_file_reference: notice.land_file_reference ?? '',
        title_file_reference: notice.title_file_reference ?? '',
        survey_reference: notice.survey_reference ?? '',
        province: notice.province ?? '',
        district: notice.district ?? '',
        llg: notice.llg ?? '',
        ward: notice.ward ?? '',
        legal_issue: notice.legal_issue ?? '',
        notice_summary: notice.notice_summary ?? '',
        current_status: notice.current_status ?? 'Received',
        remarks: notice.remarks ?? '',
      });
    } else {
      setForm(emptyNoticeForm(presetCaseId));
    }
  }, [open, notice, presetCaseId]);

  const set = (key: keyof Section5NoticeForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Enforce the workflow: on edit only allow valid transitions; on create only
  // allow the two entry statuses (Draft / Received).
  const statusOptions = useMemo(() => {
    if (!isEdit) return SECTION5_ENTRY_STATUSES as unknown as string[];
    return getAllowedNextStatuses(notice?.current_status) as unknown as string[];
  }, [isEdit, notice?.current_status]);

  const isIlg = form.claimant_type === 'Incorporated Land Group';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.notice_number.trim()) {
      toast.error('Please enter the Section 5 Notice number');
      return;
    }
    if (!form.claimant_name.trim()) {
      toast.error('Please enter the claimant name');
      return;
    }

    setLoading(true);
    let savedId: string | null = notice?.id ?? null;
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const payload: Record<string, unknown> = {
        notice_number: form.notice_number.trim(),
        case_id: form.case_id || null,
        date_received: form.date_received || null,
        file_opened_date: form.file_opened_date || null,
        assigned_lawyer_date: form.assigned_lawyer_date || null,
        dlpp_lawyer_id: form.dlpp_lawyer_id || null,
        dlpp_lawyer_user_id: form.dlpp_lawyer_user_id || null,
        solicitor_general_lawyer: form.solicitor_general_lawyer || null,
        claimant_lawyers: form.claimant_lawyers || null,
        claimant_name: form.claimant_name.trim(),
        claimant_type: form.claimant_type || null,
        ilg_name: form.ilg_name || null,
        ilg_registration_number: form.ilg_registration_number || null,
        land_description: form.land_description || null,
        land_file_reference: form.land_file_reference || null,
        title_file_reference: form.title_file_reference || null,
        survey_reference: form.survey_reference || null,
        province: form.province || null,
        district: form.district || null,
        llg: form.llg || null,
        ward: form.ward || null,
        legal_issue: form.legal_issue || null,
        notice_summary: form.notice_summary || null,
        current_status: form.current_status || 'Received',
        remarks: form.remarks || null,
      };

      if (isEdit && notice) {
        payload.updated_by = user?.id ?? null;
        const { error } = await (supabase as any)
          .from('section5_notices')
          .update(payload)
          .eq('id', notice.id);
        if (error) throw error;

        await logAudit('update', 'section5_notices', notice.id, 'section5_notice', {
          notice_number: payload.notice_number,
        });
        if (notice.current_status !== form.current_status) {
          await logAudit('update', 'section5_notices', notice.id, 'section5_notice', {
            change: 'status',
            from: notice.current_status,
            to: form.current_status,
          });
        }
        if ((notice.dlpp_lawyer_id ?? '') !== form.dlpp_lawyer_id) {
          await logAudit('update', 'section5_notices', notice.id, 'section5_notice', {
            change: 'lawyer_assignment',
            from: notice.dlpp_lawyer_id,
            to: form.dlpp_lawyer_id,
          });
        }
        if ((notice.case_id ?? '') !== (form.case_id ?? '')) {
          await logAudit('update', 'section5_notices', notice.id, 'section5_notice', {
            change: 'case_link',
            from: notice.case_id,
            to: form.case_id,
          });
        }
        toast.success('Section 5 Notice updated');
      } else {
        payload.created_by = user?.id ?? null;
        const { data, error } = await (supabase as any)
          .from('section5_notices')
          .insert([payload])
          .select('id')
          .single();
        if (error) throw error;
        savedId = data?.id ?? null;
        await logAudit('create', 'section5_notices', data?.id, 'section5_notice', {
          notice_number: payload.notice_number,
        });
        toast.success('Section 5 Notice registered');
      }

      // Alert the assigned lawyer on assignment / status change.
      if (savedId) {
        await sendSection5Notifications({
          isEdit,
          before: notice ?? null,
          after: {
            id: savedId,
            notice_number: form.notice_number.trim(),
            case_id: form.case_id || null,
            claimant_name: form.claimant_name.trim(),
            dlpp_lawyer_user_id: form.dlpp_lawyer_user_id || null,
            current_status: form.current_status,
          },
        });
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error('Error saving Section 5 Notice:', err);
      if (err?.message?.includes('does not exist') || err?.code === '42P01') {
        toast.error('Section 5 Notices table not found. Run database-section5-notices.sql in Supabase.');
      } else {
        toast.error('Failed to save Section 5 Notice');
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
            <FileWarning className="h-5 w-5 text-dlpp-purple" />
            {isEdit ? 'Edit Section 5 Notice' : 'Register Section 5 Notice'}
          </DialogTitle>
          <DialogDescription>
            An official legal notice received by the Department. It is a registry entry — not a
            plaintiff or defendant — and can create or link to a legal case.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Notice identification */}
          <div className="space-y-3">
            <SectionTitle>Notice Identification</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="notice_number"
                  helpTitle="Section 5 Notice No."
                  help="The official Section 5 Notice number. This is the main identifier for the register entry."
                >
                  Section 5 Notice No. *
                </LabelWithHelp>
                <Input
                  id="notice_number"
                  value={form.notice_number}
                  onChange={(e) => set('notice_number', e.target.value)}
                  placeholder="e.g., S5-2025-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="date_received"
                  helpTitle="Date Received"
                  help="The date the Department actually received the notice. Use the real receipt date, not today's entry date."
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
            </div>
            <div>
              {presetCaseId ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  This notice will be linked to the current case automatically.
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
                    Leave blank until a case is created. A notice can be linked to a case at any time.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Claimant */}
          <div className="space-y-3">
            <SectionTitle>Claimant</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="claimant_name"
                  helpTitle="Claimant Name"
                  help="The person or entity making the claim in the notice."
                >
                  Claimant Name *
                </LabelWithHelp>
                <Input
                  id="claimant_name"
                  value={form.claimant_name}
                  onChange={(e) => set('claimant_name', e.target.value)}
                  placeholder="Full name of claimant"
                  required
                />
              </div>
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="claimant_type"
                  helpTitle="Claimant Type"
                  help="The nature of the claimant. Choosing Incorporated Land Group reveals ILG name and registration number fields."
                >
                  Claimant Type
                </LabelWithHelp>
                <Select value={form.claimant_type} onValueChange={(v) => set('claimant_type', v)}>
                  <SelectTrigger id="claimant_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLAIMANT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isIlg && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="ilg_name">ILG Name</Label>
                    <Input
                      id="ilg_name"
                      value={form.ilg_name}
                      onChange={(e) => set('ilg_name', e.target.value)}
                      placeholder="Registered ILG name"
                    />
                  </div>
                  <div className="space-y-2">
                    <LabelWithHelp
                      htmlFor="ilg_registration_number"
                      helpTitle="ILG Registration Number"
                      help="The registration number issued when the Incorporated Land Group was registered."
                    >
                      ILG Registration Number
                    </LabelWithHelp>
                    <Input
                      id="ilg_registration_number"
                      value={form.ilg_registration_number}
                      onChange={(e) => set('ilg_registration_number', e.target.value)}
                      placeholder="e.g., ILG 1234"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Lawyers */}
          <div className="space-y-3">
            <SectionTitle>Lawyers &amp; Assignment</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="dlpp_lawyer_user_id"
                  helpTitle="DLPP Lawyer"
                  help="The DLPP lawyer in carriage. Choose a system user so they are alerted when the notice is assigned to them or its status changes. Assignment is recorded in the audit trail."
                >
                  DLPP Lawyer
                </LabelWithHelp>
                <Select
                  value={form.dlpp_lawyer_user_id}
                  onValueChange={(v) => {
                    const picked = lawyers.find((l) => l.id === v);
                    setForm((prev) => ({
                      ...prev,
                      dlpp_lawyer_user_id: v,
                      dlpp_lawyer_id: picked ? lawyerLabel(picked) : prev.dlpp_lawyer_id,
                      // Auto-stamp the assignment date on first assignment.
                      assigned_lawyer_date:
                        prev.assigned_lawyer_date || new Date().toISOString().split('T')[0],
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
                {form.dlpp_lawyer_id && !form.dlpp_lawyer_user_id && (
                  <p className="text-xs text-amber-600">
                    Recorded as “{form.dlpp_lawyer_id}” with no linked user — select one to enable alerts.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigned_lawyer_date">Date Assigned to Lawyer</Label>
                <Input
                  id="assigned_lawyer_date"
                  type="date"
                  value={form.assigned_lawyer_date}
                  onChange={(e) => set('assigned_lawyer_date', e.target.value)}
                />
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
                <Label htmlFor="claimant_lawyers">Claimant Lawyers</Label>
                <Input
                  id="claimant_lawyers"
                  value={form.claimant_lawyers}
                  onChange={(e) => set('claimant_lawyers', e.target.value)}
                  placeholder="Private firm acting for claimant"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file_opened_date">File Opened Date</Label>
                <Input
                  id="file_opened_date"
                  type="date"
                  value={form.file_opened_date}
                  onChange={(e) => set('file_opened_date', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Land & location */}
          <div className="space-y-3">
            <SectionTitle>Land &amp; Location</SectionTitle>
            <div className="space-y-2">
              <Label htmlFor="land_description">Land Description</Label>
              <Textarea
                id="land_description"
                value={form.land_description}
                onChange={(e) => set('land_description', e.target.value)}
                placeholder="Portion / Section / Allotment, customary land name and location"
                rows={2}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="land_file_reference">Land File Reference</Label>
                <Input
                  id="land_file_reference"
                  value={form.land_file_reference}
                  onChange={(e) => set('land_file_reference', e.target.value)}
                  placeholder="Land file no."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title_file_reference">Title File Reference</Label>
                <Input
                  id="title_file_reference"
                  value={form.title_file_reference}
                  onChange={(e) => set('title_file_reference', e.target.value)}
                  placeholder="Title file no."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="survey_reference">Survey Reference</Label>
                <Input
                  id="survey_reference"
                  value={form.survey_reference}
                  onChange={(e) => set('survey_reference', e.target.value)}
                  placeholder="Survey plan no."
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
                <Select value={form.province} onValueChange={(v) => set('province', v)}>
                  <SelectTrigger id="province">
                    <SelectValue placeholder="Province" />
                  </SelectTrigger>
                  <SelectContent>
                    {PNG_PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  value={form.district}
                  onChange={(e) => set('district', e.target.value)}
                  placeholder="District"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="llg">LLG</Label>
                <Input
                  id="llg"
                  value={form.llg}
                  onChange={(e) => set('llg', e.target.value)}
                  placeholder="Local-Level Govt"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ward">Ward</Label>
                <Input
                  id="ward"
                  value={form.ward}
                  onChange={(e) => set('ward', e.target.value)}
                  placeholder="Ward"
                />
              </div>
            </div>
          </div>

          {/* Legal issue & summary */}
          <div className="space-y-3">
            <SectionTitle>Legal Issue &amp; Summary</SectionTitle>
            <div className="space-y-2">
              <LabelWithHelp
                htmlFor="legal_issue"
                helpTitle="Legal Issue"
                help="The legal question or subject the notice raises (e.g., disputed customary ownership, fraudulent title)."
              >
                Legal Issue
              </LabelWithHelp>
              <Textarea
                id="legal_issue"
                value={form.legal_issue}
                onChange={(e) => set('legal_issue', e.target.value)}
                placeholder="Describe the legal issue raised by the notice"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notice_summary">Notice Summary</Label>
              <Textarea
                id="notice_summary"
                value={form.notice_summary}
                onChange={(e) => set('notice_summary', e.target.value)}
                placeholder="A short summary of what the notice says and requests"
                rows={3}
              />
            </div>
          </div>

          {/* Status & remarks */}
          <div className="space-y-3">
            <SectionTitle>Status &amp; Remarks</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="current_status"
                  helpTitle="Status"
                  help="Where the notice is in the workflow. Status changes are limited to the next valid step (or Closed) and are recorded in the audit trail."
                >
                  Status
                </LabelWithHelp>
                <Select value={form.current_status} onValueChange={(v) => set('current_status', v)}>
                  <SelectTrigger id="current_status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isEdit && (
                  <p className="text-xs text-slate-500">
                    Only the next workflow step (or Closed) is available from “{notice?.current_status}”.
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={form.remarks}
                onChange={(e) => set('remarks', e.target.value)}
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
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Register Notice'}
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
