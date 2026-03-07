'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { KeyMetricsCards } from './KeyMetricsCards';
import { WorkflowProgressCard } from './WorkflowProgressCard';
import { LitigationCostsCard } from './LitigationCostsCard';
import { YearComparisonCards } from './YearComparisonCards';
import { MonthlyTrendChart } from './MonthlyTrendChart';
import { StatusDistributionChart } from './StatusDistributionChart';
import { CaseAgeChart } from './CaseAgeChart';
import { RegionDistributionChart } from './RegionDistributionChart';
import { AlertsNotificationCard } from './AlertsNotificationCard';
import { useDashboardStats } from './useDashboardStats';

export function DashboardOverview() {
  const { stats, loading, pendingAlerts } = useDashboardStats();

  // Prepare chart data
  const statusData = Object.entries(stats.byStatus)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  const regionData = Object.entries(stats.byRegion)
    .filter(([name]) => name !== 'Not specified')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  const ageData = Object.entries(stats.byAge)
    .map(([name, value]) => ({ name, value }));

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading real-time statistics...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
        </div>

        {/* Key Metrics */}
        <KeyMetricsCards stats={stats} pendingAlerts={pendingAlerts} />

        {/* Workflow Progress */}
        <WorkflowProgressCard workflowProgress={stats.workflowProgress} />

        {/* Litigation Costs Summary */}
        <LitigationCostsCard
          litigationCosts={stats.litigationCosts}
          totalCases={stats.total}
        />

        {/* Year Comparison */}
        <YearComparisonCards
          thisYear={stats.thisYear}
          lastYear={stats.lastYear}
        />

        {/* Charts Row 1: Monthly Trend & Status Distribution */}
        <div className="grid gap-4 lg:grid-cols-2">
          <MonthlyTrendChart data={stats.monthlyTrend} />
          <StatusDistributionChart data={statusData} />
        </div>

        {/* Charts Row 2: Case Age & Region Distribution */}
        <div className="grid gap-4 lg:grid-cols-2">
          <CaseAgeChart data={ageData} />
          <RegionDistributionChart data={regionData} />
        </div>

        {/* Alerts Section */}
        <AlertsNotificationCard
          upcomingEvents={stats.upcomingEvents}
          overdueTasks={stats.overdueTasks}
        />
      </div>
    </AppLayout>
  );
}
