'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ShieldAlert,
  FolderOpen,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  FileClock,
} from 'lucide-react';
import {
  computeStats,
  type SearchWarrant,
  type SearchWarrantStats,
} from '@/lib/search-warrants';

interface StatCard {
  key: keyof SearchWarrantStats;
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
    label: 'Total Search Warrants',
    icon: ShieldAlert,
    gradient: 'from-slate-50 to-white',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    valueColor: 'text-slate-900',
  },
  {
    key: 'open',
    label: 'Open Search Warrants',
    icon: FolderOpen,
    gradient: 'from-amber-50 to-white',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    valueColor: 'text-amber-600',
  },
  {
    key: 'closed',
    label: 'Closed Search Warrants',
    icon: CheckCircle,
    gradient: 'from-emerald-50 to-white',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    valueColor: 'text-emerald-600',
  },
  {
    key: 'urgent',
    label: 'Urgent Search Warrants',
    icon: AlertTriangle,
    gradient: 'from-red-50 to-white',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    valueColor: 'text-red-600',
  },
  {
    key: 'awaitingWitness',
    label: 'Awaiting Witness Statement',
    icon: UserCheck,
    gradient: 'from-purple-50 to-white',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    valueColor: 'text-purple-600',
  },
  {
    key: 'pendingDocuments',
    label: 'Pending Documents',
    icon: FileClock,
    gradient: 'from-orange-50 to-white',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    valueColor: 'text-orange-600',
  },
];

interface Props {
  /** If provided, stats are computed from these instead of fetching. */
  warrants?: SearchWarrant[];
  /** Hide entirely if the table is missing (used on the main dashboard). */
  hideIfMissing?: boolean;
  /** Optional section heading rendered above the cards. */
  title?: string;
}

export function SearchWarrantStatsCards({ warrants, hideIfMissing, title }: Props) {
  const [fetched, setFetched] = useState<SearchWarrant[] | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (warrants) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await (supabase as any)
        .from('search_warrants')
        .select('id, status, date_received');
      if (cancelled) return;
      if (error) {
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          setMissing(true);
        }
        setFetched([]);
        return;
      }
      setFetched((data as SearchWarrant[]) || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [warrants]);

  const stats = useMemo<SearchWarrantStats>(
    () => computeStats(warrants ?? fetched ?? []),
    [warrants, fetched],
  );

  if (hideIfMissing && missing) return null;

  return (
    <div className="space-y-3">
      {title && (
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h2>
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
