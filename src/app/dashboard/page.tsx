/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';
import {
  AlertCircle, TrendingUp, TrendingDown, Clock,
  CheckCircle, FileText, Calendar, Users
} from 'lucide-react';
import { format, subMonths, subYears, startOfMonth, endOfMonth, startOfYear } from 'date-fns';

const COLORS = ['#4A4284', '#EF5A5A', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];

interface CaseStats {
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
}

export default function EnhancedDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CaseStats>({
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
  });

  useEffect(() => {
    void checkAuth();
    void loadDashboardData();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/login');
  };

  const loadDashboardData = async () => {
    try {
      // Load all cases via API route (bypasses RLS limits)
      const casesResponse = await fetch('/api/dashboard/stats');
      const casesData = await casesResponse.json();

      if (!casesData.success) throw new Error(casesData.error);

      const cases = casesData.cases;
      console.log(`📊 Dashboard: Loaded ${cases?.length || 0} cases from database via API`);

      // Load upcoming events (next 30 days)
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .lte('event_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

      // Load overdue tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'pending')
        .lt('due_date', new Date().toISOString());

      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const thisYearStart = startOfYear(now);
      const lastYearStart = startOfYear(subYears(now, 1));
      const lastYearEnd = startOfYear(now);

      // Type assertion for cases
      const typedCases = (cases as { status: string; case_type: string; region?: string; created_at: string; closure_date?: string }[]) || [];

      // Calculate statistics
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
      };

      // Calculate by status, type, region
      typedCases?.forEach(c => {
        statistics.byStatus[c.status] = (statistics.byStatus[c.status] || 0) + 1;
        statistics.byType[c.case_type] = (statistics.byType[c.case_type] || 0) + 1;
        const region = c.region || 'Not specified';
        statistics.byRegion[region] = (statistics.byRegion[region] || 0) + 1;

        // Calculate age for all cases
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
      setStats(statistics);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading real-time statistics...</p>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-600 mt-1">Bird's eye view of all legal case management activities</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-green-600">{stats.thisMonth} this month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Open Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-orange-600">{stats.open}</div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
              <div className="mt-2 text-sm text-slate-600">
                {((stats.open / stats.total) * 100).toFixed(1)}% of total
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Closed Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-green-600">{stats.closed}</div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-2 text-sm text-slate-600">
                {((stats.closed / stats.total) * 100).toFixed(1)}% of total
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-purple-600">{stats.upcomingEvents}</div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <Clock className="h-4 w-4 text-orange-600 mr-1" />
                <span className="text-orange-600">{stats.overdueTasks} overdue tasks</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Year Comparison */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">This Year</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.thisYear}</div>
              <p className="text-xs text-slate-600 mt-1">Cases opened in {format(new Date(), 'yyyy')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Last Year</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-700">{stats.lastYear}</div>
              <p className="text-xs text-slate-600 mt-1">Cases opened in {format(subYears(new Date(), 1), 'yyyy')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Year-over-Year</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                {stats.thisYear > stats.lastYear ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-2xl font-bold text-green-600">
                      +{((stats.thisYear - stats.lastYear) / stats.lastYear * 100).toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-2xl font-bold text-red-600">
                      {((stats.thisYear - stats.lastYear) / stats.lastYear * 100).toFixed(1)}%
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">Compared to last year</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1: Monthly Trend & Status Distribution */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>12-Month Trend</CardTitle>
              <CardDescription>Cases opened vs closed over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="opened" stroke="#4A4284" name="Opened" strokeWidth={2} />
                  <Line type="monotone" dataKey="closed" stroke="#10B981" name="Closed" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cases by Status</CardTitle>
              <CardDescription>Current distribution of case statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    label={(entry: any) => `${entry.name} ${((entry.percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2: Case Age & Type Distribution */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Cases by Age</CardTitle>
              <CardDescription>How long open cases have been active</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#EF5A5A" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cases by Region</CardTitle>
              <CardDescription>Geographic distribution (Top 8 regions)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={180} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        {(stats.upcomingEvents > 0 || stats.overdueTasks > 0) && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Alerts & Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.upcomingEvents > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-100 text-purple-800">
                      {stats.upcomingEvents} Upcoming Events
                    </Badge>
                    <span className="text-sm text-slate-600">in the next 30 days</span>
                  </div>
                )}
                {stats.overdueTasks > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800">
                      {stats.overdueTasks} Overdue Tasks
                    </Badge>
                    <span className="text-sm text-slate-600">require immediate attention</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
