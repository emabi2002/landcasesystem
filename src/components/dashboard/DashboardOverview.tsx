'use client';

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
import { SearchWarrantStatsCards } from '@/components/search-warrants';
import { Section5StatsCards } from '@/components/section5-notices';
import { Section160StatsCards } from '@/components/section-160';

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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading real-time statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div data-tour="dashboard-metrics">
        <KeyMetricsCards stats={stats} pendingAlerts={pendingAlerts} />
      </div>

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

      {/* Registry overviews (hidden until each module's table is set up) */}
      <Section5StatsCards hideIfMissing title="Section 5 Notices" />
      <Section160StatsCards hideIfMissing title="Section 160(2) Applications" />
      <SearchWarrantStatsCards hideIfMissing title="Search Warrants" />

      {/* Charts Row 1: Monthly Trend & Status Distribution */}
      <div data-tour="dashboard-charts" className="grid gap-4 lg:grid-cols-2">
        <MonthlyTrendChart data={stats.monthlyTrend} />
        <StatusDistributionChart data={statusData} />
      </div>

      {/* Charts Row 2: Case Age & Region Distribution */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CaseAgeChart data={ageData} />
        <RegionDistributionChart data={regionData} />
      </div>

      {/* Alerts Section */}
      <div data-tour="dashboard-alerts">
        <AlertsNotificationCard
          upcomingEvents={stats.upcomingEvents}
          overdueTasks={stats.overdueTasks}
        />
      </div>
    </div>
  );
}
