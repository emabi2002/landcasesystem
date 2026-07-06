/**
 * Shared types, constants and helpers for the Search Warrants module.
 *
 * A Search Warrant is an official investigation / court-authorised document
 * received by DLPP and (usually) linked to a legal case. It is NOT a plaintiff
 * or defendant — the respondent may be the Secretary DLPP, Registrar of Titles,
 * a landowner, an occupier, or another entity depending on the warrant.
 */

export interface SearchWarrant {
  id: string;
  case_id: string | null;
  warrant_number: string | null;
  crime_report_number: string | null;
  date_received: string | null;
  received_from: string | null;
  police_officer_name: string | null;
  police_officer_rank: string | null;
  police_contact_details: string | null;
  received_by: string | null;
  date_assigned_to_lawyer: string | null;
  dlpp_lawyer_in_carriage: string | null;
  applicant_informant: string | null;
  respondent: string | null;
  land_description: string | null;
  legal_issue: string | null;
  land_file_reference: string | null;
  title_file_reference: string | null;
  documents_to_provide: string | null;
  witness_statement_status: string | null;
  status: string;
  remarks_comments: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  // Joined (from cases) — populated when read with a join.
  case_number?: string | null;
  case_title?: string | null;
}

/** The nine official workflow statuses, in order. */
export const SEARCH_WARRANT_STATUSES = [
  'Received',
  'Assigned',
  'In Progress',
  'Documents Being Retrieved',
  'Witness Statement Required',
  'Completed',
  'Closed',
  'Expired',
  'Cancelled',
] as const;

export type SearchWarrantStatus = (typeof SEARCH_WARRANT_STATUSES)[number];

/** Statuses that mean the matter is still active / being worked. */
export const OPEN_STATUSES: string[] = [
  'Received',
  'Assigned',
  'In Progress',
  'Documents Being Retrieved',
  'Witness Statement Required',
];

/** Statuses that mean the matter is finished. */
export const CLOSED_STATUSES: string[] = [
  'Completed',
  'Closed',
  'Expired',
  'Cancelled',
];

export function isOpenStatus(status: string | null | undefined): boolean {
  return !!status && OPEN_STATUSES.includes(status);
}

/** Tailwind classes for the status badge. */
export function getStatusBadgeClass(status: string | null | undefined): string {
  const map: Record<string, string> = {
    Received: 'bg-slate-100 text-slate-700 border-slate-300',
    Assigned: 'bg-blue-100 text-blue-800 border-blue-300',
    'In Progress': 'bg-amber-100 text-amber-800 border-amber-300',
    'Documents Being Retrieved': 'bg-orange-100 text-orange-800 border-orange-300',
    'Witness Statement Required': 'bg-purple-100 text-purple-800 border-purple-300',
    Completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Closed: 'bg-slate-200 text-slate-700 border-slate-400',
    Expired: 'bg-red-100 text-red-800 border-red-300',
    Cancelled: 'bg-rose-100 text-rose-800 border-rose-300',
  };
  return map[status ?? ''] ?? 'bg-slate-100 text-slate-700 border-slate-300';
}

/**
 * Categories for documents attached to a search warrant. These are stored on
 * the `documents.document_type` column so warrant documents also appear in the
 * main case document list.
 */
export const WARRANT_DOCUMENT_TYPES: { value: string; label: string }[] = [
  { value: 'search_warrant_scan', label: 'Scanned Search Warrant (PDF)' },
  { value: 'supporting_affidavit', label: 'Supporting Affidavit' },
  { value: 'police_request_letter', label: 'Police Request Letter' },
  { value: 'land_file_document', label: 'Land File Document' },
  { value: 'title_file_document', label: 'Title File Document' },
  { value: 'witness_statement', label: 'Witness Statement' },
  { value: 'return_of_warrant', label: 'Return of Warrant' },
  { value: 'correspondence', label: 'Correspondence' },
];

export function getWarrantDocTypeLabel(value: string | null | undefined): string {
  if (!value) return 'Document';
  return WARRANT_DOCUMENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

/** Number of whole days since a date (or null). */
export function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/** A warrant is "urgent" if it is still open and has been sitting for a while. */
export const URGENT_AGE_DAYS = 14;

export function isUrgent(w: SearchWarrant): boolean {
  if (!isOpenStatus(w.status)) return false;
  const age = daysSince(w.date_received);
  return age !== null && age > URGENT_AGE_DAYS;
}

export interface SearchWarrantStats {
  total: number;
  open: number;
  closed: number;
  urgent: number;
  awaitingWitness: number;
  pendingDocuments: number;
}

export function computeStats(warrants: SearchWarrant[]): SearchWarrantStats {
  return warrants.reduce<SearchWarrantStats>(
    (acc, w) => {
      acc.total += 1;
      if (isOpenStatus(w.status)) acc.open += 1;
      else acc.closed += 1;
      if (isUrgent(w)) acc.urgent += 1;
      if (w.status === 'Witness Statement Required') acc.awaitingWitness += 1;
      if (w.status === 'Documents Being Retrieved') acc.pendingDocuments += 1;
      return acc;
    },
    { total: 0, open: 0, closed: 0, urgent: 0, awaitingWitness: 0, pendingDocuments: 0 },
  );
}

/** Empty form values for a new search warrant. */
export function emptyWarrantForm(caseId = '') {
  return {
    case_id: caseId,
    warrant_number: '',
    crime_report_number: '',
    date_received: new Date().toISOString().split('T')[0],
    received_from: '',
    police_officer_name: '',
    police_officer_rank: '',
    police_contact_details: '',
    received_by: '',
    date_assigned_to_lawyer: '',
    dlpp_lawyer_in_carriage: '',
    applicant_informant: '',
    respondent: '',
    land_description: '',
    legal_issue: '',
    land_file_reference: '',
    title_file_reference: '',
    documents_to_provide: '',
    witness_statement_status: '',
    status: 'Received',
    remarks_comments: '',
  };
}

export type SearchWarrantForm = ReturnType<typeof emptyWarrantForm>;
