'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  getStatusBadgeClass,
  type SearchWarrant,
} from '@/lib/search-warrants';
import { SearchWarrantDocuments } from './SearchWarrantDocuments';

interface SearchWarrantDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warrant: SearchWarrant | null;
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

export function SearchWarrantDetail({
  open,
  onOpenChange,
  warrant,
  canUpload = true,
}: SearchWarrantDetailProps) {
  if (!warrant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-dlpp-purple" />
            {warrant.warrant_number || 'Search Warrant'}
            <Badge className={`border text-xs ${getStatusBadgeClass(warrant.status)}`}>
              {warrant.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {warrant.case_number ? (
              <>
                Linked case:{' '}
                <Link
                  href={`/cases/${warrant.case_id}`}
                  className="font-medium text-dlpp-purple hover:underline"
                >
                  {warrant.case_number}
                  {warrant.case_title ? ` — ${warrant.case_title}` : ''}
                </Link>
              </>
            ) : (
              'Not linked to a case'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <Field label="Search Warrant No." value={warrant.warrant_number} />
            <Field label="Crime Report No." value={warrant.crime_report_number} />
            <Field label="Date Received" value={fmt(warrant.date_received)} />
            <Field label="Received From" value={warrant.received_from} />
            <Field label="Received By" value={warrant.received_by} />
            <Field label="Date Assigned to Lawyer" value={fmt(warrant.date_assigned_to_lawyer)} />
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-dlpp-purple">
              Police Source
            </h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Field label="Officer Name" value={warrant.police_officer_name} />
              <Field label="Officer Rank" value={warrant.police_officer_rank} />
              <Field label="Contact Details" value={warrant.police_contact_details} />
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-dlpp-purple">
              Parties &amp; Land
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Applicant / Informant" value={warrant.applicant_informant} />
              <Field label="Respondent" value={warrant.respondent} />
              <Field label="DLPP Lawyer in Carriage" value={warrant.dlpp_lawyer_in_carriage} />
              <Field label="Land Description" value={warrant.land_description} />
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-dlpp-purple">
              Legal Issue &amp; Files
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Legal Issue" value={warrant.legal_issue} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Land File Ref." value={warrant.land_file_reference} />
                <Field label="Title File Ref." value={warrant.title_file_reference} />
              </div>
              <Field label="Documents to Provide" value={warrant.documents_to_provide} />
              <Field label="Witness Statement" value={warrant.witness_statement_status} />
            </div>
          </section>

          {warrant.remarks_comments && (
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-dlpp-purple">
                Remarks / Comments
              </h4>
              <p className="whitespace-pre-line text-sm text-slate-700">
                {warrant.remarks_comments}
              </p>
            </section>
          )}

          <section className="border-t border-slate-200 pt-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-dlpp-purple">
              Documents
            </h4>
            <SearchWarrantDocuments
              warrantId={warrant.id}
              caseId={warrant.case_id}
              canUpload={canUpload}
            />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
