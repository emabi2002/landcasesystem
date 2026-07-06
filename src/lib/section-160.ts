/**
 * Shared types, constants and helpers for the Section 160(2) Application Register.
 *
 * Section 160(2) Applications relate to matters under the Land Registration Act
 * 1981 — title disputes, Registrar of Titles matters, summons, fraud, consent
 * issues, title rectification and court-related land registration matters.
 *
 * It is a legal REGISTRY entry (not a plaintiff/defendant table). An application
 * may create a new Legal Case or be linked to an existing one.
 */

export interface Section160Application {
  id: string;
  application_year: string | null;
  date_received: string | null;
  date_assigned_to_legal_officer: string | null;
  dlpp_lawyer_in_carriage: string | null;
  dlpp_lawyer_user_id: string | null;
  solicitor_general_lawyer: string | null;
  private_law_firm: string | null;
  defendants_lawyer: string | null;
  applicant_registrar_of_titles: string | null;
  defendant: string | null;
  land_description: string | null;
  title_file_reference: string | null;
  letter_of_summons_date: string | null;
  summons_date: string | null;
  consignment_note: string | null;
  grounds_for_application: string | null;
  court_file_reference_no: string | null;
  status_of_matter: string;
  comments_remarks: string | null;
  case_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  // Joined (from cases) — populated when read with a join.
  case_number?: string | null;
  case_title?: string | null;
}

/* ------------------------------------------------------------------ */
/* Statuses                                                            */
/* ------------------------------------------------------------------ */

export const SECTION_160_STATUSES = [
  'Received',
  'Assigned',
  'Under Review',
  'Awaiting Summons',
  'Summons Received',
  'Awaiting Legal Response',
  'Awaiting Court Direction',
  'In Court',
  'Director Response Required',
  'Director Response Issued',
  'Closed',
  'Rejected',
] as const;

export type Section160Status = (typeof SECTION_160_STATUSES)[number];

/** Terminal statuses. */
export const CLOSED_STATUSES: string[] = ['Closed', 'Rejected'];

/** Statuses considered "pending legal review". */
export const PENDING_REVIEW_STATUSES: string[] = ['Under Review', 'Awaiting Legal Response'];

export function isClosedStatus(status: string | null | undefined): boolean {
  return !!status && CLOSED_STATUSES.includes(status);
}

export function isOpenStatus(status: string | null | undefined): boolean {
  return !!status && !isClosedStatus(status);
}

/** Tailwind classes for the status badge. */
export function getStatusBadgeClass(status: string | null | undefined): string {
  const map: Record<string, string> = {
    Received: 'bg-sky-100 text-sky-800 border-sky-300',
    Assigned: 'bg-blue-100 text-blue-800 border-blue-300',
    'Under Review': 'bg-indigo-100 text-indigo-800 border-indigo-300',
    'Awaiting Summons': 'bg-amber-100 text-amber-800 border-amber-300',
    'Summons Received': 'bg-cyan-100 text-cyan-800 border-cyan-300',
    'Awaiting Legal Response': 'bg-orange-100 text-orange-800 border-orange-300',
    'Awaiting Court Direction': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'In Court': 'bg-purple-100 text-purple-800 border-purple-300',
    'Director Response Required': 'bg-rose-100 text-rose-800 border-rose-300',
    'Director Response Issued': 'bg-teal-100 text-teal-800 border-teal-300',
    Closed: 'bg-slate-200 text-slate-700 border-slate-400',
    Rejected: 'bg-red-100 text-red-800 border-red-300',
  };
  return map[status ?? ''] ?? 'bg-slate-100 text-slate-700 border-slate-300';
}

/* ------------------------------------------------------------------ */
/* Documents                                                          */
/* ------------------------------------------------------------------ */

export const SECTION_160_DOCUMENT_TYPES: { value: string; label: string }[] = [
  { value: 'section_160_application', label: 'Section 160(2) Application' },
  { value: 'letter_of_summons', label: 'Letter of Summons' },
  { value: 'consignment_note', label: 'Consignment Note' },
  { value: 'court_document', label: 'Court Document' },
  { value: 'registrar_correspondence', label: 'Registrar of Titles Correspondence' },
  { value: 'title_file_extract', label: 'Title File Extract' },
  { value: 'land_file_document', label: 'Land File Document' },
  { value: 'legal_opinion', label: 'Legal Opinion' },
  { value: 'director_response', label: 'Director Response' },
  { value: 'court_order', label: 'Court Order' },
  { value: 'other', label: 'Other Supporting Document' },
];

export function getSection160DocTypeLabel(value: string | null | undefined): string {
  if (!value) return 'Document';
  return SECTION_160_DOCUMENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

/* ------------------------------------------------------------------ */
/* Dashboard stats                                                     */
/* ------------------------------------------------------------------ */

export interface Section160Stats {
  total: number;
  thisYear: number;
  pendingReview: number;
  awaitingSummons: number;
  inCourt: number;
  directorResponseRequired: number;
  closed: number;
  rejected: number;
}

function receivedYear(a: Section160Application): string {
  if (a.date_received) return a.date_received.slice(0, 4);
  return (a.application_year || '').trim();
}

export function computeStats(apps: Section160Application[]): Section160Stats {
  const currentYear = String(new Date().getFullYear());
  return apps.reduce<Section160Stats>(
    (acc, a) => {
      acc.total += 1;
      if (receivedYear(a) === currentYear) acc.thisYear += 1;
      if (PENDING_REVIEW_STATUSES.includes(a.status_of_matter)) acc.pendingReview += 1;
      if (a.status_of_matter === 'Awaiting Summons') acc.awaitingSummons += 1;
      if (a.status_of_matter === 'In Court') acc.inCourt += 1;
      if (a.status_of_matter === 'Director Response Required') acc.directorResponseRequired += 1;
      if (a.status_of_matter === 'Closed') acc.closed += 1;
      if (a.status_of_matter === 'Rejected') acc.rejected += 1;
      return acc;
    },
    {
      total: 0,
      thisYear: 0,
      pendingReview: 0,
      awaitingSummons: 0,
      inCourt: 0,
      directorResponseRequired: 0,
      closed: 0,
      rejected: 0,
    },
  );
}

/* ------------------------------------------------------------------ */
/* Form                                                                */
/* ------------------------------------------------------------------ */

export function emptyApplicationForm(caseId = '') {
  return {
    application_year: String(new Date().getFullYear()),
    date_received: new Date().toISOString().split('T')[0],
    date_assigned_to_legal_officer: '',
    dlpp_lawyer_in_carriage: '',
    dlpp_lawyer_user_id: '',
    solicitor_general_lawyer: '',
    private_law_firm: '',
    defendants_lawyer: '',
    applicant_registrar_of_titles: 'Registrar of Titles',
    defendant: '',
    land_description: '',
    title_file_reference: '',
    letter_of_summons_date: '',
    summons_date: '',
    consignment_note: '',
    grounds_for_application: '',
    court_file_reference_no: '',
    status_of_matter: 'Received',
    comments_remarks: '',
    case_id: caseId,
  };
}

export type Section160Form = ReturnType<typeof emptyApplicationForm>;
