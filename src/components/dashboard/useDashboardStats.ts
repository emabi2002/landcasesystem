'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { format, subMonths, subYears, startOfMonth, endOfMonth, startOfYear } from 'date-fns';
import type { CaseStats, DashboardStatsHook } from './types';
import { initialStats } from './types';

export function useDashboardStats(): DashboardStatsHook {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pendingAlerts, setPendingAlerts] = useState(0);
  const [stats, setStats] = useState<CaseStats>(initialStats);

  const checkAuth = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/login');
  }, [router]);

  const loadPendingAlerts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userRole } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!userRole) return;

      const seniorRoles = ['legal_manager', 'secretary', 'director'];
      if (!seniorRoles.includes(userRole.role)) {
        setPendingAlerts(0);
        return;
      }

      const { data, error } = await (supabase as any)
        .from('communications')
        .select('id')
        .eq('communication_type', 'alert')
        .eq('recipient_role', userRole.role)
        .eq('response_status', 'pending');

      if (error) throw error;
      setPendingAlerts(data?.length || 0);
    } catch (error) {
      console.error('Error loading pending alerts:', error);
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      const casesResponse = await fetch('/api/dashboard/stats');
      const casesData = await casesResponse.json();

      if (!casesData.success) throw new Error(casesData.error);

      const cases = casesData.cases;
      console.log(`Dashboard: Loaded ${cases?.length || 0} cases from database via API`);

      const { data: events } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .lte('event_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'pending')
        .lt('due_date', new Date().toISOString());

      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const thisYearStart = startOfYear(now);
      const lastYearStart = startOfYear(subYears(now, 1));
      const lastYearEnd = startOfYear(now);

      const typedCases = (cases as { status: string; case_type: string; region?: string; created_at: string; closure_date?: string }[]) || [];

      const statistics: CaseStats = {
        total: typedCases?.length || 0,
        open: typedCases?.filter(c => !['closed', 'settled'].includes(c.status)).length || 0,
        closed: typedCases?.filter(c => ['closed', 'settled'].includes(c.status)).length || 0,
        thisMonth: typedCases?.filter(c => new Date(c.created_at) >= thisMonthStart).length || 0,
        thisYear: typedCases?.filter(c => new Date(c.created_at) >= thisYearStart).length || 0,
        lastYear: typedCases?.filter(c =>
          new Date(c.created_at) >= lastYearStart &&
          new Date(c.created_at) < lastYearEnd
        ).length || 0,
        byStatus: {},
        byType: {},
        byRegion: {},
        byAge: {
          'Under 1 year': 0,
          '1-3 years': 0,
          '3-5 years': 0,
          '5-10 years': 0,
          'Over 10 years': 0,
        },
        monthlyTrend: [],
        upcomingEvents: events?.length || 0,
        overdueTasks: tasks?.length || 0,
        workflowProgress: {
          registered: typedCases?.filter(c => (c as any).workflow_status === 'registered').length || 0,
          directions: typedCases?.filter(c => (c as any).workflow_status === 'directions').length || 0,
          allocated: typedCases?.filter(c => (c as any).workflow_status === 'allocated').length || 0,
          litigation: typedCases?.filter(c => (c as any).workflow_status === 'litigation').length || 0,
          compliance: typedCases?.filter(c => (c as any).workflow_status === 'compliance').length || 0,
          readyForClosure: typedCases?.filter(c => (c as any).workflow_status === 'ready_for_closure').length || 0,
        },
        litigationCosts: {
          totalAmount: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          entryCount: 0,
          caseCount: 0,
        },
      };

      // Load litigation costs summary
      try {
        const { data: costsData, error: costsError } = await (supabase as any)
          .from('litigation_costs')
          .select('amount, amount_paid, case_id')
          .eq('is_deleted', false);

        if (!costsError && costsData && costsData.length > 0) {
          const totalAmount = costsData.reduce((sum: number, c: { amount: number }) => sum + (c.amount || 0), 0);
          const totalPaid = costsData.reduce((sum: number, c: { amount_paid: number }) => sum + (c.amount_paid || 0), 0);
          const uniqueCases = new Set(costsData.map((c: { case_id: string }) => c.case_id));

          statistics.litigationCosts = {
            totalAmount,
            totalPaid,
            totalOutstanding: totalAmount - totalPaid,
            entryCount: costsData.length,
            caseCount: uniqueCases.size,
          };
        }
      } catch (costErr) {
        console.error('Error loading litigation costs:', costErr);
      }

      // Calculate by status, type, region
      typedCases?.forEach(c => {
        statistics.byStatus[c.status] = (statistics.byStatus[c.status] || 0) + 1;
        statistics.byType[c.case_type] = (statistics.byType[c.case_type] || 0) + 1;
        const region = c.region || 'Not specified';
        statistics.byRegion[region] = (statistics.byRegion[region] || 0) + 1;

        const yearsOld = (now.getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (yearsOld < 1) statistics.byAge['Under 1 year']++;
        else if (yearsOld < 3) statistics.byAge['1-3 years']++;
        else if (yearsOld < 5) statistics.byAge['3-5 years']++;
        else if (yearsOld < 10) statistics.byAge['5-10 years']++;
        else statistics.byAge['Over 10 years']++;
      });

      // Calculate monthly trend (last 12 months)
      const monthlyTrend = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const opened = typedCases?.filter(c => {
          const createdAt = new Date(c.created_at);
          return createdAt >= monthStart && createdAt <= monthEnd;
        }).length || 0;

        const closed = typedCases?.filter(c => {
          if (!c.closure_date) return false;
          const closureDate = new Date(c.closure_date);
          return closureDate >= monthStart && closureDate <= monthEnd;
        }).length || 0;

        monthlyTrend.push({
          month: format(monthDate, 'MMM'),
          opened,
          closed,
        });
      }

      statistics.monthlyTrend = monthlyTrend;

      // Load workflow progress statistics
      try {
        const [directionsRes, delegationsRes, filingsRes, complianceRes] = await Promise.all([
          supabase.from('directions').select('case_id', { count: 'exact', head: true }),
          supabase.from('case_delegations').select('case_id', { count: 'exact', head: true }),
          supabase.from('filings').select('case_id', { count: 'exact', head: true }),
          supabase.from('compliance_tracking').select('case_id', { count: 'exact', head: true }),
        ]);

        const openCases = typedCases?.filter(c => c.status !== 'closed') || [];

        statistics.workflowProgress = {
          registered: statistics.total - statistics.closed,
          directions: directionsRes.count || 0,
          allocated: delegationsRes.count || 0,
          litigation: filingsRes.count || 0,
          compliance: complianceRes.count || 0,
          readyForClosure: openCases.filter(c => c.status === 'under_review' || c.status === 'judgment').length,
        };
      } catch (err) {
        console.error('Error loading workflow stats:', err);
      }

      setStats(statistics);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    setLoading(true);
    await loadDashboardData();
    await loadPendingAlerts();
  }, [loadDashboardData, loadPendingAlerts]);

  useEffect(() => {
    checkAuth();
    loadDashboardData();
    loadPendingAlerts();
  }, [checkAuth, loadDashboardData, loadPendingAlerts]);

  return {
    stats,
    loading,
    pendingAlerts,
    refreshStats,
  };
}
