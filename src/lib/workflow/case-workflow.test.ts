import { describe, expect, it } from 'vitest';
import {
  CASE_WORKFLOW_STATES,
  getAvailableWorkflowTransitions,
  getWorkflowTransition,
  isCaseWorkflowState,
} from './case-workflow';

describe('case workflow model', () => {
  it('defines the canonical Phase 3 state sequence', () => {
    expect(CASE_WORKFLOW_STATES).toEqual([
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
    ]);
  });

  it('finds required transition permissions', () => {
    expect(getWorkflowTransition('DRAFTING', 'UNDER_REVIEW')?.permission).toEqual({
      moduleKey: 'filings',
      action: 'update',
    });
    expect(getWorkflowTransition('UNDER_REVIEW', 'APPROVED_FOR_FILING')?.permission).toEqual({
      moduleKey: 'filings',
      action: 'approve',
    });
  });

  it('requires comments for return and closure transitions', () => {
    expect(getWorkflowTransition('UNDER_REVIEW', 'DRAFTING')?.requiresComment).toBe(true);
    expect(getWorkflowTransition('READY_FOR_CLOSURE', 'CLOSED')?.requiresComment).toBe(true);
  });

  it('does not invent exception transitions', () => {
    expect(getWorkflowTransition('REGISTERED', 'DRAFTING')).toBeNull();
    expect(getAvailableWorkflowTransitions('UNDER_REVIEW').map((rule) => rule.to)).toEqual([
      'DRAFTING',
      'APPROVED_FOR_FILING',
    ]);
  });

  it('validates workflow state strings', () => {
    expect(isCaseWorkflowState('REGISTERED')).toBe(true);
    expect(isCaseWorkflowState('registered')).toBe(false);
    expect(isCaseWorkflowState('BAD_STATE')).toBe(false);
  });
});
