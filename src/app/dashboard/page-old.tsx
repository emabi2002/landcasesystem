'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

import { DashboardNav } from '@/components/layout/DashboardNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FolderOpen,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  FileText,
} from 'lucide-react';

/* =========================
   Strong Types
   ========================= */

type CaseStatus =
  | 'under_review'
  | 'in_court'
  | 'mediation'
  | 'tribunal'
  | 'judgment'
  | 'closed'
  | 'settled'
  | string;

type Priority = 'low' | 'medium' | 'high' | 'urgent' | string;

interface CaseRow {
  id: string;
  case_number: string;
  title: string | null;
  description?: string | null;
  status: CaseStatus;
  case_type: string;
  priority?: Priority | null;
  region?: string | null;
  created_at: string; // ISO timestamp
}

interface EventRow {
  id: string;
  case_id: string;
  title: string;
  description?: string | null;
  event_type: string;
  event_date: string; // ISO timestamp
  location?: string | null;
}

interface TaskRow {
  id: string;
  case_id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | string;
  due_date?: string | null;
}

interface Stats {
  totalCases: number;
  openCases: number;
  closedCases: number;
  overdueTasks: number;
  upcomingEvents: number;
}

/* =========================
   Helpers
   ========================= */

const getStatusBadge = (
  status: CaseStatus
): { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string } => {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    under_review: { variant: 'secondary', label: 'Under Review' },
    in_court: { variant: 'default', label: 'In Court' },
    mediation: { variant: 'outline', label: 'Mediation' },
    tribunal: { variant: 'outline', label: 'Tribunal' },
    judgment: { variant: 'default', label: 'Judgment' },
    closed: { variant: 'secondary', label: 'Closed' },
    settled: { variant: 'secondary', label: 'Settled' },
  };
  return map[status] ?? { variant: 'outline', label: String(status) };
};

/* =========================
   Component
   ========================= */

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<Stats>({
    totalCases: 0,
    openCases: 0,
    closedCases: 0,
    overdueTasks: 0,
    upcomingEvents: 0,
  });

  const [recentCases, setRecentCases] = useState<CaseRow[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    void checkAuth();
    void loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/login');
  };

  const loadDashboardData = async () => {
    try {
      // Get all cases to compute open/closed quickly (or you can do separate count queries)
      const { data: allCases, error: casesError } = await supabase
        .from('cases')
        .select('*');

      if (casesError) throw casesError;

      const all: CaseRow[] = (allCases ?? []) as CaseRow[];
      const open = all.filter(c => c.status !== 'closed' && c.status !== 'settled');
      const closed = all.filter(c => c.status === 'closed' || c.status === 'settled');

      // Upcoming events (limit 5)
      const { data: ev } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(5);

      // Overdue tasks (pending + due_date < now)
      const { data: overdue } = await supabase
        .from('tasks')
        .select('*')
        .lt('due_date', new Date().toISOString())
        .eq('status', 'pending');

      // Recent cases (limit 5 newest)
      const { data: rc } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalCases: all.length,
        openCases: open.length,
        closedCases: closed.length,
        overdueTasks: (overdue as TaskRow[] | null)?.length ?? 0,
        upcomingEvents: (ev as EventRow[] | null)?.length ?? 0,
      });

      setRecentCases((rc as CaseRow[] | null) ?? []);
      setUpcomingEvents((ev as EventRow[] | null) ?? []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Cases', value: stats.totalCases, icon: FolderOpen, color: '#4A4284', bg: '#F3F2F7' },
    { title: 'Open Cases', value: stats.openCases, icon: AlertCircle, color: '#EF5A5A', bg: '#FEF2F2' },
    { title: 'Closed Cases', value: stats.closedCases, icon: CheckCircle, color: '#10B981', bg: '#ECFDF5' },
    { title: 'Overdue Tasks', value: stats.overdueTasks, icon: Clock, color: '#D4A574', bg: '#FEF9F3' },
  ] as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Overview of legal case management system</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map(({ title, value, icon: Icon, color, bg }) => (
            <Card key={title} className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{title}</p>
                    <p className="text-3xl font-bold mt-2" style={{ color }}>{value}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: bg }}>
                    <Icon className="h-6 w-6" style={{ color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Cases & Upcoming Events */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Cases */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Recent Cases
              </CardTitle>
              <CardDescription>Latest registered cases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCases.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No cases found</p>
                    <Link href="/cases/new">
                      <Button size="sm" className="mt-4 text-white hover:opacity-90" style={{ background: '#EF5A5A' }}>
                        Create First Case
                      </Button>
                    </Link>
                  </div>
                ) : (
                  recentCases.map((c) => {
                    const badge = getStatusBadge(c.status);
                    return (
                      <div
                        key={c.id as string}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex-1">
                          <Link href={`/cases/${c.id}`}>
                            <h4 className="font-medium hover:text-blue-600 transition-colors">
                              {c.title ?? 'Untitled Case'}
                            </h4>
                          </Link>
                          <p className="text-sm text-slate-600 mt-1">{c.case_number}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {format(new Date(c.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Badge variant={badge.variant} className="ml-4">
                          {badge.label}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
              <CardDescription>Hearings and deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No upcoming events</p>
                  </div>
                ) : (
                  upcomingEvents.map((ev) => (
                    <div
                      key={ev.id as string}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="bg-blue-50 p-2 rounded">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{ev.title}</h4>
                        <p className="text-sm text-slate-600 mt-1">
                          {String(ev.event_type || '').replaceAll('_', ' ')}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {format(new Date(ev.event_date), 'MMM dd, yyyy - h:mm a')}
                        </p>
                        <div className="mt-2">
                          <Link href={`/cases/${ev.case_id}`}>
                            <Button variant="outline" size="sm">View Case</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Link href="/cases/new">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-4 hover:border-[#4A4284] transition-colors">
                  <div className="p-2 rounded" style={{ background: '#F3F2F7' }}>
                    <FolderOpen className="h-5 w-5" style={{ color: '#4A4284' }} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Register New Case</div>
                    <div className="text-xs text-slate-500">Create a new legal case</div>
                  </div>
                </Button>
              </Link>

              <Link href="/tasks">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-4 hover:border-[#EF5A5A] transition-colors">
                  <div className="p-2 rounded" style={{ background: '#FEF2F2' }}>
                    <Clock className="h-5 w-5" style={{ color: '#EF5A5A' }} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">View Tasks</div>
                    <div className="text-xs text-slate-500">Manage pending tasks</div>
                  </div>
                </Button>
              </Link>

              <Link href="/reports">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-4 hover:border-[#D4A574] transition-colors">
                  <div className="p-2 rounded" style={{ background: '#FEF9F3' }}>
                    <FileText className="h-5 w-5" style={{ color: '#D4A574' }} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Generate Report</div>
                    <div className="text-xs text-slate-500">Export case data</div>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
