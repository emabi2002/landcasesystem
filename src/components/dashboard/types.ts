// Dashboard Types

export interface CaseStats {
  total: number;
  open: number;
  closed: number;
  thisMonth: number;
  thisYear: number;
  lastYear: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byRegion: Record<string, number>;
  byAge: Record<string, number>;
  monthlyTrend: Array<{ month: string; opened: number; closed: number }>;
  upcomingEvents: number;
  overdueTasks: number;
  workflowProgress: WorkflowProgress;
  litigationCosts: LitigationCostsStats;
}

export interface WorkflowProgress {
  registered: number;
  directions: number;
  allocated: number;
  litigation: number;
  compliance: number;
  readyForClosure: number;
}

export interface LitigationCostsStats {
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  entryCount: number;
  caseCount: number;
}

export interface DashboardStatsHook {
  stats: CaseStats;
  loading: boolean;
  pendingAlerts: number;
  refreshStats: () => Promise<void>;
}

export const CHART_COLORS = ['#4A4284', '#EF5A5A', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];

export const initialStats: CaseStats = {
  total: 0,
  open: 0,
  closed: 0,
  thisMonth: 0,
  thisYear: 0,
  lastYear: 0,
  byStatus: {},
  byType: {},
  byRegion: {},
  byAge: {},
  monthlyTrend: [],
  upcomingEvents: 0,
  overdueTasks: 0,
  workflowProgress: {
    registered: 0,
    directions: 0,
    allocated: 0,
    litigation: 0,
    compliance: 0,
    readyForClosure: 0,
  },
  litigationCosts: {
    totalAmount: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    entryCount: 0,
    caseCount: 0,
  },
};
