import type { PermissionAction } from '@/lib/rbac-types';

export const CASE_WORKFLOW_STATES = [
  'REGISTERED',
  'ASSIGNED',
  'REGISTRATION_COMPLETED',
  'DRAFTING',
  'UNDER_REVIEW',
  'APPROVED_FOR_FILING',
  'FILED',
  'COMPLIANCE',
  'READY_FOR_CLOSURE',
  'CLOSED',
] as const;

export type CaseWorkflowState = (typeof CASE_WORKFLOW_STATES)[number];

export type WorkflowTransitionRule = {
  from: CaseWorkflowState;
  to: CaseWorkflowState;
  permission: {
    moduleKey: string;
    action: PermissionAction;
  };
  requiresComment?: boolean;
  requiresAssignment?: boolean;
  notificationType?: string;
  caseStatus: string;
  businessCondition: string;
};

export const CASE_WORKFLOW_TRANSITIONS: WorkflowTransitionRule[] = [
  {
    from: 'REGISTERED',
    to: 'ASSIGNED',
    permission: { moduleKey: 'allocation', action: 'update' },
    requiresAssignment: true,
    notificationType: 'case_assignment',
    caseStatus: 'assigned',
    businessCondition: 'An active officer must be assigned.',
  },
  {
    from: 'ASSIGNED',
    to: 'REGISTRATION_COMPLETED',
    permission: { moduleKey: 'cases', action: 'update' },
    caseStatus: 'in_progress',
    businessCondition: 'Mandatory registration fields must be complete.',
  },
  {
    from: 'REGISTRATION_COMPLETED',
    to: 'DRAFTING',
    permission: { moduleKey: 'filings', action: 'create' },
    caseStatus: 'in_progress',
    businessCondition: 'A draft filing is created by the assigned officer or authorised supervisor.',
  },
  {
    from: 'DRAFTING',
    to: 'UNDER_REVIEW',
    permission: { moduleKey: 'filings', action: 'update' },
    notificationType: 'filing_review',
    caseStatus: 'under_review',
    businessCondition: 'At least one draft filing must have a real attached document.',
  },
  {
    from: 'UNDER_REVIEW',
    to: 'DRAFTING',
    permission: { moduleKey: 'filings', action: 'approve' },
    requiresComment: true,
    notificationType: 'filing_returned',
    caseStatus: 'in_progress',
    businessCondition: 'Reviewer returns a filing for correction with a mandatory comment.',
  },
  {
    from: 'UNDER_REVIEW',
    to: 'APPROVED_FOR_FILING',
    permission: { moduleKey: 'filings', action: 'approve' },
    notificationType: 'filing_approved',
    caseStatus: 'approved_for_filing',
    businessCondition: 'Authorised reviewer approves and may not approve their own filing.',
  },
  {
    from: 'APPROVED_FOR_FILING',
    to: 'FILED',
    permission: { moduleKey: 'filings', action: 'update' },
    notificationType: 'filing_filed',
    caseStatus: 'filed',
    businessCondition: 'Court filing date and reference/supporting document must be recorded.',
  },
  {
    from: 'FILED',
    to: 'COMPLIANCE',
    permission: { moduleKey: 'compliance', action: 'update' },
    notificationType: 'compliance_started',
    caseStatus: 'compliance',
    businessCondition: 'Filing is complete and compliance work can begin.',
  },
  {
    from: 'COMPLIANCE',
    to: 'READY_FOR_CLOSURE',
    permission: { moduleKey: 'compliance', action: 'update' },
    notificationType: 'case_ready_for_closure',
    caseStatus: 'ready_for_closure',
    businessCondition: 'Required compliance items are completed and no critical blockers remain.',
  },
  {
    from: 'READY_FOR_CLOSURE',
    to: 'CLOSED',
    permission: { moduleKey: 'cases', action: 'approve' },
    requiresComment: true,
    notificationType: 'case_closed',
    caseStatus: 'closed',
    businessCondition: 'Closure type, date, notes and final validation must be recorded.',
  },
];

export function isCaseWorkflowState(value: string): value is CaseWorkflowState {
  return CASE_WORKFLOW_STATES.includes(value as CaseWorkflowState);
}

export function getWorkflowTransition(from: string, to: string) {
  return CASE_WORKFLOW_TRANSITIONS.find((rule) => rule.from === from && rule.to === to) ?? null;
}

export function getAvailableWorkflowTransitions(from: string) {
  return CASE_WORKFLOW_TRANSITIONS.filter((rule) => rule.from === from);
}
