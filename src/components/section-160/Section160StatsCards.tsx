'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Landmark,
  CalendarClock,
  ScanSearch,
  Clock,
  Gavel,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  computeStats,
  type Section160Application,
  type Section160Stats,
} from '@/lib/section-160';

interface StatCard {
  key: keyof Section160Stats;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg: string;
  iconColor: string;
  valueColor: string;
}

const CARDS: StatCard[] = [
  { key: 'total', label: 'Total Applications', icon: Landmark, gradient: 'from-slate-50 to-white', iconBg: 'bg-slate-100', iconColor: 'text-slate-600', valueColor: 'text-slate-900' },
  { key: 'thisYear', label: 'Received This Year', icon: CalendarClock, gradient: 'from-sky-50 to-white', iconBg: 'bg-sky-100', iconColor: 'text-sky-600', valueColor: 'text-sky-600' },
  { key: 'pendingReview', label: 'Pending Legal Review', icon: ScanSearch, gradient: 'from-indigo-50 to-white', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', valueColor: 'text-indigo-600' },
  { key: 'awaitingSummons', label: 'Awaiting Summons', icon: Clock, gradient: 'from-amber-50 to-white', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', valueColor: 'text-amber-600' },
  { key: 'inCourt', label: 'In Court', icon: Gavel, gradient: 'from-purple-50 to-white', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', valueColor: 'text-purple-600' },
  { key: 'directorResponseRequired', label: 'Director Response Required', icon: AlertTriangle, gradient: 'from-rose-50 to-white', iconBg: 'bg-rose-100', iconColor: 'text-rose-600', valueColor: 'text-rose-600' },
  { key: 'closed', label: 'Closed', icon: CheckCircle, gradient: 'from-emerald-50 to-white', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', valueColor: 'text-emerald-600' },
  { key: 'rejected', label: 'Rejected', icon: XCircle, gradient: 'from-red-50 to-white', iconBg: 'bg-red-100', iconColor: 'text-red-600', valueColor: 'text-red-600' },
];

interface Props {
  applications?: Section160Application[];
  hideIfMissing?: boolean;
  title?: string;
}

export function Section160StatsCards({ applications, hideIfMissing, title }: Props) {
  const [fetched, setFetched] = useState<Section160Application[] | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (applications) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await (supabase as any)
        .from('section_160_applications')
        .select('id, status_of_matter, date_received, application_year, case_id');
      if (cancelled) return;
      if (error) {
        if (error.message?.includes('does not exist') || error.code === '42P01') setMissing(true);
        setFetched([]);
        return;
      }
      setFetched((data as Section160Application[]) || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [applications]);

  const stats = useMemo<Section160Stats>(
    () => computeStats(applications ?? fetched ?? []),
    [applications, fetched],
  );

  if (hideIfMissing && missing) return null;

  return (
    <div className="space-y-3">
      {title && (
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <Card
              key={c.key}
              className="relative overflow-hidden border-slate-200 transition-shadow hover:shadow-md"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient}`} />
              <CardHeader className="relative pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {c.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-center justify-between">
                  <div className={`text-3xl font-bold ${c.valueColor}`}>{stats[c.key]}</div>
                  <div className={`rounded-xl p-3 ${c.iconBg}`}>
                    <Icon className={`h-6 w-6 ${c.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
