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
import { Landmark } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { getStatusBadgeClass, type Section160Application } from '@/lib/section-160';
import { Section160Documents } from './Section160Documents';
import { Section160Timeline } from './Section160Timeline';

interface Section160DetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Section160Application | null;
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

export function Section160Detail({
  open,
  onOpenChange,
  application,
  canUpload = true,
}: Section160DetailProps) {
  if (!application) return null;
  const a = application;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <Landmark className="h-5 w-5 text-dlpp-purple" />
            {a.defendant || 'Section 160(2) Application'}
            <Badge className={`border text-xs ${getStatusBadgeClass(a.status_of_matter)}`}>
              {a.status_of_matter}
            </Badge>
            {a.application_year && (
              <span className="text-sm font-normal text-slate-500">({a.application_year})</span>
            )}
          </DialogTitle>
          <DialogDescription>
            {a.case_number ? (
              <>
                Linked case:{' '}
                <Link
                  href={`/cases/${a.case_id}`}
                  className="font-medium text-dlpp-purple hover:underline"
                >
                  {a.case_number}
                  {a.case_title ? ` — ${a.case_title}` : ''}
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

          <TabsContent value="details" className="space-y-6 pt-4">
            <section className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Field label="Application Year" value={a.application_year} />
              <Field label="Date Received" value={fmt(a.date_received)} />
              <Field label="Date Assigned" value={fmt(a.date_assigned_to_legal_officer)} />
              <Field label="Applicant" value={a.applicant_registrar_of_titles} />
              <Field label="Defendant" value={a.defendant} />
              <Field label="Court File Ref." value={a.court_file_reference_no} />
            </section>

            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-dlpp-purple">
                Lawyers
              </h4>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
                <Field label="DLPP Lawyer in Carriage" value={a.dlpp_lawyer_in_carriage} />
                <Field label="Solicitor General" value={a.solicitor_general_lawyer} />
                <Field label="Private Law Firm" value={a.private_law_firm} />
                <Field label="Defendant's Lawyer" value={a.defendants_lawyer} />
              </div>
            </section>

            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-dlpp-purple">
                Land &amp; Title
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Land Description" value={a.land_description} />
                <Field label="Title File Reference" value={a.title_file_reference} />
              </div>
            </section>

            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-dlpp-purple">
                Summons
              </h4>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <Field label="Date of Letter" value={fmt(a.letter_of_summons_date)} />
                <Field label="Summons Received" value={fmt(a.summons_date)} />
                <Field label="Consignment Note" value={a.consignment_note} />
              </div>
            </section>

            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-dlpp-purple">
                Grounds for the Application
              </h4>
              <p className="whitespace-pre-line text-sm text-slate-700">
                {a.grounds_for_application?.trim() ? a.grounds_for_application : '—'}
              </p>
            </section>

            {a.comments_remarks && (
              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-dlpp-purple">
                  Comments / Remarks
                </h4>
                <p className="whitespace-pre-line text-sm text-slate-700">{a.comments_remarks}</p>
              </section>
            )}
          </TabsContent>

          <TabsContent value="documents" className="pt-4">
            <Section160Documents
              applicationId={a.id}
              caseId={a.case_id}
              canUpload={canUpload}
            />
          </TabsContent>

          <TabsContent value="timeline" className="pt-4">
            <Section160Timeline application={a} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
