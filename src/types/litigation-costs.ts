// =====================================================
// LITIGATION COSTING MODULE - TypeScript Types
// =====================================================

export type PaymentStatus = 'paid' | 'unpaid' | 'partial' | 'waived' | 'disputed';

export type PayeeType = 'law_firm' | 'court' | 'individual' | 'company' | 'government';

export type DocumentType = 'invoice' | 'receipt' | 'court_order' | 'payment_voucher' | 'other';

// Cost Category
export interface CostCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category_group: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Litigation Cost Entry
export interface LitigationCost {
  id: string;
  case_id: string;
  category_id: string | null;
  cost_type: string;
  amount: number;
  currency: string;
  date_incurred: string;
  date_paid: string | null;
  payment_status: PaymentStatus;
  amount_paid: number;
  responsible_unit: string | null;
  responsible_authority: string | null;
  approved_by: string | null;
  description: string | null;
  reference_number: string | null;
  payee_name: string | null;
  payee_type: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  // Joined fields
  category?: CostCategory;
  documents?: LitigationCostDocument[];
}

// Cost Document
export interface LitigationCostDocument {
  id: string;
  cost_id: string;
  document_name: string;
  document_type: string | null;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  description: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

// Cost History (Audit Trail)
export interface LitigationCostHistory {
  id: string;
  cost_id: string;
  action: 'created' | 'updated' | 'deleted';
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  change_reason: string | null;
  changed_by: string | null;
  changed_at: string;
  record_snapshot: Record<string, unknown> | null;
}

// Case Cost Summary (from view)
export interface CaseCostSummary {
  case_id: string;
  case_number: string;
  case_title: string;
  case_status: string;
  case_type: string;
  total_cost_entries: number;
  total_amount: number;
  total_paid: number;
  total_outstanding: number;
  paid_entries: number;
  unpaid_entries: number;
  first_cost_date: string | null;
  last_cost_date: string | null;
}

// Monthly Cost Summary (from view)
export interface MonthlyCostSummary {
  month: string;
  category_group: string;
  category_name: string;
  entry_count: number;
  total_amount: number;
  total_paid: number;
  outstanding: number;
}

// Cost by Case Type (from view)
export interface CostByCaseType {
  case_type: string;
  case_count: number;
  cost_entries: number;
  total_amount: number;
  total_paid: number;
  avg_cost_per_entry: number;
}

// Form Data Types
export interface CreateLitigationCostInput {
  case_id: string;
  category_id?: string;
  cost_type: string;
  amount: number;
  currency?: string;
  date_incurred: string;
  date_paid?: string;
  payment_status?: PaymentStatus;
  amount_paid?: number;
  responsible_unit?: string;
  responsible_authority?: string;
  approved_by?: string;
  description?: string;
  reference_number?: string;
  payee_name?: string;
  payee_type?: string;
}

export interface UpdateLitigationCostInput extends Partial<CreateLitigationCostInput> {
  id: string;
}

// Aggregation Types
export interface CostAggregation {
  total_amount: number;
  total_paid: number;
  total_outstanding: number;
  entry_count: number;
}

export interface CategoryBreakdown {
  category_name: string;
  category_group: string;
  total_amount: number;
  entry_count: number;
}

// Report Filter Types
export interface CostReportFilters {
  dateFrom?: string;
  dateTo?: string;
  caseId?: string;
  caseType?: string;
  costType?: string;
  paymentStatus?: PaymentStatus;
  responsibleUnit?: string;
}

// Default cost categories for reference
export const DEFAULT_COST_CATEGORIES = [
  { code: 'LEGAL_INTERNAL', name: 'Legal Fees (Internal Counsel)', group: 'Legal Fees' },
  { code: 'LEGAL_EXTERNAL', name: 'Legal Fees (External Counsel)', group: 'Legal Fees' },
  { code: 'COURT_FILING', name: 'Court Filing Fees', group: 'Court Fees' },
  { code: 'COURT_PROCESSING', name: 'Court Processing Fees', group: 'Court Fees' },
  { code: 'SETTLEMENT', name: 'Settlements', group: 'Settlements' },
  { code: 'CONSENT_AWARD', name: 'Consent Awards', group: 'Settlements' },
  { code: 'PENALTY', name: 'Penalties', group: 'Penalties' },
  { code: 'COMPENSATION', name: 'Compensation Payments', group: 'Penalties' },
  { code: 'DISBURSEMENT', name: 'Disbursements', group: 'Disbursements' },
  { code: 'INCIDENTAL', name: 'Incidental Legal Costs', group: 'Disbursements' },
] as const;

// Payment status options for forms
export const PAYMENT_STATUS_OPTIONS = [
  { value: 'unpaid', label: 'Unpaid', color: 'red' },
  { value: 'partial', label: 'Partially Paid', color: 'yellow' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'waived', label: 'Waived', color: 'gray' },
  { value: 'disputed', label: 'Disputed', color: 'orange' },
] as const;

// Responsible units for DLPP
export const RESPONSIBLE_UNITS = [
  'Legal Division',
  'Finance Division',
  'Secretary\'s Office',
  'Lands Administration',
  'Physical Planning',
  'Survey & Mapping',
  'Valuation Division',
  'State Solicitor\'s Office',
  'Attorney General\'s Office',
] as const;

// Responsible authorities
export const RESPONSIBLE_AUTHORITIES = [
  'DLPP',
  'State',
  'Solicitor General',
  'Attorney General',
  'National Court',
  'Supreme Court',
] as const;
