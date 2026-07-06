/**
 * Shared types, constants and helpers for the Section 5 Notice Register.
 *
 * A Section 5 Notice is an official legal notice received by DLPP relating to
 * land claims, Incorporated Land Groups (ILGs), customary land, State leases,
 * ownership claims and other matters requiring legal attention.
 *
 * It is a legal REGISTRY entry — NOT a plaintiff/defendant table. A notice may
 * later create or link to a Legal Case, which can then progress to Legal Advice,
 * Mediation, Litigation, a Search Warrant, Court Proceedings, Appeals or
 * Settlement.
 */

export interface Section5Notice {
  id: string;
  notice_number: string | null;
  case_id: string | null;
  date_received: string | null;
  file_opened_date: string | null;
  assigned_lawyer_date: string | null;
  dlpp_lawyer_id: string | null;
  dlpp_lawyer_user_id: string | null;
  solicitor_general_lawyer: string | null;
  claimant_lawyers: string | null;
  claimant_name: string | null;
  claimant_type: string | null;
  ilg_name: string | null;
  ilg_registration_number: string | null;
  land_description: string | null;
  land_file_reference: string | null;
  title_file_reference: string | null;
  survey_reference: string | null;
  province: string | null;
  district: string | null;
  llg: string | null;
  ward: string | null;
  legal_issue: string | null;
  notice_summary: string | null;
  current_status: string;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  // Joined (from cases) — populated when read with a join.
  case_number?: string | null;
  case_title?: string | null;
}

/* ------------------------------------------------------------------ */
/* Workflow                                                            */
/* ------------------------------------------------------------------ */

/** The official workflow statuses, in order. */
export const SECTION5_STATUSES = [
  'Draft',
  'Received',
  'File Opened',
  'Assigned to Lawyer',
  'Legal Review',
  'Awaiting Advice',
  'Advice Issued',
  'Matter Created',
  'Referred to Court',
  'Closed',
] as const;

export type Section5Status = (typeof SECTION5_STATUSES)[number];

/** The two statuses a brand-new notice may be registered with. */
export const SECTION5_ENTRY_STATUSES: Section5Status[] = ['Draft', 'Received'];

/** Terminal status. */
export const SECTION5_CLOSED_STATUS: Section5Status = 'Closed';

/**
 * Workflow engine. Status changes are only allowed forward one step along the
 * sequence, or straight to "Closed" from any active state (a notice can be
 * closed at any point, e.g. after advice without going to court). "Closed" is
 * terminal.
 *
 * Returns the statuses the notice may move to from `current` (always includes
 * `current` itself so saving without a status change is valid).
 */
export function getAllowedNextStatuses(current: string | null | undefined): Section5Status[] {
  const idx = SECTION5_STATUSES.indexOf((current ?? 'Received') as Section5Status);
  // Unknown status -> allow the full list so data is never stuck.
  if (idx === -1) return [...SECTION5_STATUSES];

  const cur = SECTION5_STATUSES[idx];
  if (cur === 'Closed') return ['Closed'];

  const allowed: Section5Status[] = [cur];
  const next = SECTION5_STATUSES[idx + 1];
  if (next && next !== 'Closed') allowed.push(next);
  // Always allow closing an active notice.
  if (!allowed.includes('Closed')) allowed.push('Closed');
  return allowed;
}

export function isClosedStatus(status: string | null | undefined): boolean {
  return status === SECTION5_CLOSED_STATUS;
}

export function isOpenStatus(status: string | null | undefined): boolean {
  return !!status && !isClosedStatus(status);
}

/** Statuses considered "pending assignment" (not yet with a lawyer). */
export const PENDING_ASSIGNMENT_STATUSES: string[] = ['Draft', 'Received', 'File Opened'];

/** Statuses considered "under review" (with a lawyer, being worked). */
export const UNDER_REVIEW_STATUSES: string[] = ['Assigned to Lawyer', 'Legal Review'];

/* ------------------------------------------------------------------ */
/* Claimant types                                                      */
/* ------------------------------------------------------------------ */

export const CLAIMANT_TYPES = [
  'Individual',
  'Incorporated Land Group',
  'Company',
  'Government',
  'Clan',
  'Community',
] as const;

export type ClaimantType = (typeof CLAIMANT_TYPES)[number];

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

/** Tailwind classes for the status badge. */
export function getStatusBadgeClass(status: string | null | undefined): string {
  const map: Record<string, string> = {
    Draft: 'bg-slate-100 text-slate-600 border-slate-300',
    Received: 'bg-sky-100 text-sky-800 border-sky-300',
    'File Opened': 'bg-cyan-100 text-cyan-800 border-cyan-300',
    'Assigned to Lawyer': 'bg-blue-100 text-blue-800 border-blue-300',
    'Legal Review': 'bg-indigo-100 text-indigo-800 border-indigo-300',
    'Awaiting Advice': 'bg-amber-100 text-amber-800 border-amber-300',
    'Advice Issued': 'bg-teal-100 text-teal-800 border-teal-300',
    'Matter Created': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'Referred to Court': 'bg-orange-100 text-orange-800 border-orange-300',
    Closed: 'bg-slate-200 text-slate-700 border-slate-400',
  };
  return map[status ?? ''] ?? 'bg-slate-100 text-slate-700 border-slate-300';
}

export function getClaimantTypeBadgeClass(type: string | null | undefined): string {
  const map: Record<string, string> = {
    Individual: 'bg-slate-100 text-slate-700 border-slate-300',
    'Incorporated Land Group': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Company: 'bg-blue-100 text-blue-800 border-blue-300',
    Government: 'bg-violet-100 text-violet-800 border-violet-300',
    Clan: 'bg-amber-100 text-amber-800 border-amber-300',
    Community: 'bg-teal-100 text-teal-800 border-teal-300',
  };
  return map[type ?? ''] ?? 'bg-slate-100 text-slate-700 border-slate-300';
}

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

/**
 * Categories for documents attached to a Section 5 Notice. Stored on the
 * `documents.document_type` column so notice documents also appear in the main
 * case document list.
 */
export const SECTION5_DOCUMENT_TYPES: { value: string; label: string }[] = [
  { value: 'section5_notice', label: 'Section 5 Notice' },
  { value: 'claim_document', label: 'Claim Document' },
  { value: 'ilg_registration', label: 'ILG Registration' },
  { value: 'survey_plan', label: 'Survey Plan' },
  { value: 'title_document', label: 'Title Document' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'legal_advice', label: 'Legal Advice' },
  { value: 'map', label: 'Map' },
  { value: 'affidavit', label: 'Affidavit' },
  { value: 'court_document', label: 'Court Document' },
  { value: 'other', label: 'Other Supporting Document' },
];

export function getSection5DocTypeLabel(value: string | null | undefined): string {
  if (!value) return 'Document';
  return SECTION5_DOCUMENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

/* ------------------------------------------------------------------ */
/* Ageing / urgency                                                    */
/* ------------------------------------------------------------------ */

/** Number of whole days since a date (or null). */
export function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/** A notice is "outstanding/urgent" if it is still open and sitting a while. */
export const URGENT_AGE_DAYS = 30;

export function isUrgent(n: Section5Notice): boolean {
  if (!isOpenStatus(n.current_status)) return false;
  const age = daysSince(n.date_received);
  return age !== null && age > URGENT_AGE_DAYS;
}

/* ------------------------------------------------------------------ */
/* Dashboard stats                                                     */
/* ------------------------------------------------------------------ */

export interface Section5Stats {
  total: number;
  pendingAssignment: number;
  underReview: number;
  awaitingAdvice: number;
  linkedToCases: number;
  closed: number;
}

export function computeStats(notices: Section5Notice[]): Section5Stats {
  return notices.reduce<Section5Stats>(
    (acc, n) => {
      acc.total += 1;
      if (PENDING_ASSIGNMENT_STATUSES.includes(n.current_status)) acc.pendingAssignment += 1;
      if (UNDER_REVIEW_STATUSES.includes(n.current_status)) acc.underReview += 1;
      if (n.current_status === 'Awaiting Advice') acc.awaitingAdvice += 1;
      if (n.case_id) acc.linkedToCases += 1;
      if (isClosedStatus(n.current_status)) acc.closed += 1;
      return acc;
    },
    { total: 0, pendingAssignment: 0, underReview: 0, awaitingAdvice: 0, linkedToCases: 0, closed: 0 },
  );
}

/* ------------------------------------------------------------------ */
/* Form                                                                */
/* ------------------------------------------------------------------ */

/** Empty form values for a new Section 5 Notice. */
export function emptyNoticeForm(caseId = '') {
  return {
    notice_number: '',
    case_id: caseId,
    date_received: new Date().toISOString().split('T')[0],
    file_opened_date: '',
    assigned_lawyer_date: '',
    dlpp_lawyer_id: '',
    dlpp_lawyer_user_id: '',
    solicitor_general_lawyer: '',
    claimant_lawyers: '',
    claimant_name: '',
    claimant_type: '',
    ilg_name: '',
    ilg_registration_number: '',
    land_description: '',
    land_file_reference: '',
    title_file_reference: '',
    survey_reference: '',
    province: '',
    district: '',
    llg: '',
    ward: '',
    legal_issue: '',
    notice_summary: '',
    current_status: 'Received',
    remarks: '',
  };
}

export type Section5NoticeForm = ReturnType<typeof emptyNoticeForm>;

/* ------------------------------------------------------------------ */
/* Papua New Guinea provinces (for the province filter/select)         */
/* ------------------------------------------------------------------ */

export const PNG_PROVINCES = [
  'Central',
  'Chimbu (Simbu)',
  'Eastern Highlands',
  'East New Britain',
  'East Sepik',
  'Enga',
  'Gulf',
  'Hela',
  'Jiwaka',
  'Madang',
  'Manus',
  'Milne Bay',
  'Morobe',
  'National Capital District',
  'New Ireland',
  'Northern (Oro)',
  'Bougainville (AROB)',
  'Southern Highlands',
  'Western (Fly)',
  'Western Highlands',
  'West New Britain',
  'West Sepik (Sandaun)',
] as const;
