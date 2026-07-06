'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileWarning } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  getStatusBadgeClass,
  getClaimantTypeBadgeClass,
  type Section5Notice,
} from '@/lib/section5-notices';
import { Section5NoticeDocuments } from './Section5NoticeDocuments';
import { Section5NoticeTimeline } from './Section5NoticeTimeline';

interface Section5NoticeDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notice: Section5Notice | null;
  canUpload?: boolean;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm text-slate-800">{value?.trim() ? value : '—'}</div>
    </div>
  );
}

function fmt(date?: string | null) {
  if (!date) return '—';
  try {
    return format(new Date(date), 'dd MMM yyyy');
  } catch {
    return date;
  }
}

export function Section5NoticeDetail({
  open,
  onOpenChange,
  notice,
  canUpload = true,
}: Section5NoticeDetailProps) {
  if (!notice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <FileWarning className="h-5 w-5 text-dlpp-purple" />
            {notice.notice_number || 'Section 5 Notice'}
            <Badge className={`border text-xs ${getStatusBadgeClass(notice.current_status)}`}>
              {notice.current_status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {notice.case_number ? (
              <>
                Linked case:{' '}
                <Link
                  href={`/cases/${notice.case_id}`}
                  className="font-medium text-dlpp-purple hover:underline"
                >
                  {notice.case_number}
                  {notice.case_title ? ` — ${notice.case_title}` : ''}
                </Link>
              </>
            ) : (
              'Not linked to a case'
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Details */}
          <TabsContent value="details" className="space-y-6 pt-4">
            <section className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Field label="Notice No." value={notice.notice_number} />
              <Field label="Date Received" value={fmt(notice.date_received)} />
              <Field label="File Opened" value={fmt(notice.file_opened_date)} />
              <Field label="Date Assigned" value={fmt(notice.assigned_lawyer_date)} />
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Claimant Type
                </div>
                <div className="mt-0.5">
                  {notice.claimant_type ? (
                    <Badge className={`border text-xs ${getClaimantTypeBadgeClass(notice.claimant_type)}`}>
                      {notice.claimant_type}
                    </Badge>
                  ) : (
                    <span className="text-sm text-slate-800">—</span>
                  )}
                </div>
              </div>
              <Field label="Claimant Name" value={notice.claimant_name} />
            </section>

            {(notice.ilg_name || notice.ilg_registration_number) && (
              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-dlpp-purple">
                  Incorporated Land Group
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="ILG Name" value={notice.ilg_name} />
                  <Field label="ILG Registration No." value={notice.ilg_registration_number} />
                </div>
              </section>
            )}

            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-dlpp-purple">
                Lawyers
              </h4>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <Field label="DLPP Lawyer" value={notice.dlpp_lawyer_id} />
                <Field label="Solicitor General" value={notice.solicitor_general_lawyer} />
                <Field label="Claimant Lawyers" value={notice.claimant_lawyers} />
              </div>
            </section>

            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-dlpp-purple">
                Land &amp; Location
              </h4>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <Field label="Land Description" value={notice.land_description} />
                <Field label="Land File Ref." value={notice.land_file_reference} />
                <Field label="Title File Ref." value={notice.title_file_reference} />
                <Field label="Survey Ref." value={notice.survey_reference} />
                <Field label="Province" value={notice.province} />
                <Field label="District" value={notice.district} />
                <Field label="LLG" value={notice.llg} />
                <Field label="Ward" value={notice.ward} />
              </div>
            </section>

            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-dlpp-purple">
                Legal Issue &amp; Summary
              </h4>
              <div className="space-y-3">
                <Field label="Legal Issue" value={notice.legal_issue} />
                {notice.notice_summary && (
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Notice Summary
                    </div>
                    <p className="mt-0.5 whitespace-pre-line text-sm text-slate-700">
                      {notice.notice_summary}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {notice.remarks && (
              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-dlpp-purple">
                  Remarks
                </h4>
                <p className="whitespace-pre-line text-sm text-slate-700">{notice.remarks}</p>
              </section>
            )}
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="pt-4">
            <Section5NoticeDocuments
              noticeId={notice.id}
              caseId={notice.case_id}
              canUpload={canUpload}
            />
          </TabsContent>

          {/* Timeline */}
          <TabsContent value="timeline" className="pt-4">
            <Section5NoticeTimeline notice={notice} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
