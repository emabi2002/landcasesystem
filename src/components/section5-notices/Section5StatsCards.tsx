'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileWarning,
  UserPlus,
  ScanSearch,
  Clock,
  Link2,
  CheckCircle,
} from 'lucide-react';
import {
  computeStats,
  type Section5Notice,
  type Section5Stats,
} from '@/lib/section5-notices';

interface StatCard {
  key: keyof Section5Stats;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg: string;
  iconColor: string;
  valueColor: string;
}

const CARDS: StatCard[] = [
  {
    key: 'total',
    label: 'Total Notices',
    icon: FileWarning,
    gradient: 'from-slate-50 to-white',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    valueColor: 'text-slate-900',
  },
  {
    key: 'pendingAssignment',
    label: 'Pending Assignment',
    icon: UserPlus,
    gradient: 'from-amber-50 to-white',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    valueColor: 'text-amber-600',
  },
  {
    key: 'underReview',
    label: 'Under Review',
    icon: ScanSearch,
    gradient: 'from-indigo-50 to-white',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    valueColor: 'text-indigo-600',
  },
  {
    key: 'awaitingAdvice',
    label: 'Awaiting Advice',
    icon: Clock,
    gradient: 'from-orange-50 to-white',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    valueColor: 'text-orange-600',
  },
  {
    key: 'linkedToCases',
    label: 'Linked to Cases',
    icon: Link2,
    gradient: 'from-teal-50 to-white',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    valueColor: 'text-teal-600',
  },
  {
    key: 'closed',
    label: 'Closed',
    icon: CheckCircle,
    gradient: 'from-emerald-50 to-white',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    valueColor: 'text-emerald-600',
  },
];

interface Props {
  /** If provided, stats are computed from these instead of fetching. */
  notices?: Section5Notice[];
  /** Hide entirely if the table is missing (used on the main dashboard). */
  hideIfMissing?: boolean;
  /** Optional section heading rendered above the cards. */
  title?: string;
}

export function Section5StatsCards({ notices, hideIfMissing, title }: Props) {
  const [fetched, setFetched] = useState<Section5Notice[] | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (notices) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await (supabase as any)
        .from('section5_notices')
        .select('id, current_status, date_received, case_id');
      if (cancelled) return;
      if (error) {
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          setMissing(true);
        }
        setFetched([]);
        return;
      }
      setFetched((data as Section5Notice[]) || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [notices]);

  const stats = useMemo<Section5Stats>(
    () => computeStats(notices ?? fetched ?? []),
    [notices, fetched],
  );

  if (hideIfMissing && missing) return null;

  return (
    <div className="space-y-3">
      {title && (
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
