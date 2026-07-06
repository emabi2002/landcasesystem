'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  Circle,
  History,
  Plus,
  Pencil,
  Trash2,
  Upload,
  ArrowRightLeft,
  UserCheck,
  Link2,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  SECTION5_STATUSES,
  isClosedStatus,
  type Section5Notice,
} from '@/lib/section5-notices';

interface AuditEntry {
  id: string;
  action: string;
  record_type: string | null;
  details: Record<string, unknown> | null;
  logged_at: string;
  user_id: string | null;
}

interface Section5NoticeTimelineProps {
  notice: Section5Notice;
}

function actionIcon(entry: AuditEntry) {
  const change = (entry.details as { change?: string } | null)?.change;
  if (change === 'status') return ArrowRightLeft;
  if (change === 'lawyer_assignment') return UserCheck;
  if (change === 'case_link') return Link2;
  if (entry.record_type === 'section5_notice_document') return Upload;
  if (entry.action === 'create') return Plus;
  if (entry.action === 'update') return Pencil;
  if (entry.action === 'delete') return Trash2;
  return History;
}

function describe(entry: AuditEntry): string {
  const d = (entry.details ?? {}) as Record<string, unknown>;
  if (d.change === 'status') return `Status changed from “${d.from ?? '—'}” to “${d.to ?? '—'}”`;
  if (d.change === 'lawyer_assignment') return `Lawyer set to “${d.to ?? '—'}”`;
  if (d.change === 'case_link') return d.to ? 'Linked to a case' : 'Unlinked from case';
  if (entry.record_type === 'section5_notice_document')
    return `Document uploaded${d.title ? `: ${d.title}` : ''}`;
  if (entry.action === 'create') return 'Notice registered';
  if (entry.action === 'update') return 'Notice details updated';
  if (entry.action === 'delete') return 'Notice deleted';
  return entry.action;
}

export function Section5NoticeTimeline({ notice }: Section5NoticeTimelineProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [{ data: logs }, { data: profiles }] = await Promise.all([
        (supabase as any)
          .from('audit_logs')
          .select('id, action, record_type, details, logged_at, user_id')
          .eq('record_id', notice.id)
          .order('logged_at', { ascending: false }),
        (supabase as any).from('profiles').select('id, full_name, email'),
      ]);
      const um: Record<string, string> = {};
      (profiles || []).forEach((p: { id: string; full_name: string | null; email: string | null }) => {
        um[p.id] = p.full_name || p.email || p.id.slice(0, 8);
      });
      setUserMap(um);
      setEntries((logs as AuditEntry[]) || []);
    } catch (err) {
      console.error('Error loading notice timeline:', err);
    } finally {
      setLoading(false);
    }
  }, [notice.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Workflow progress: everything up to and including the current status is done.
  const currentIndex = SECTION5_STATUSES.indexOf(notice.current_status as (typeof SECTION5_STATUSES)[number]);
  const closed = isClosedStatus(notice.current_status);

  return (
    <div className="space-y-6">
      {/* Workflow stepper */}
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-dlpp-purple">
          Workflow Progress
        </h4>
        <ol className="space-y-0">
          {SECTION5_STATUSES.map((status, i) => {
            const done = currentIndex >= 0 && i < currentIndex;
            const active = i === currentIndex;
            const isLast = i === SECTION5_STATUSES.length - 1;
            return (
              <li key={status} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={[
                      'flex h-6 w-6 items-center justify-center rounded-full border text-[11px]',
                      done
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : active
                          ? closed
                            ? 'border-slate-500 bg-slate-500 text-white'
                            : 'border-dlpp-purple bg-dlpp-purple text-white'
                          : 'border-slate-300 bg-white text-slate-400',
                    ].join(' ')}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : active ? <Circle className="h-2.5 w-2.5 fill-current" /> : i + 1}
                  </span>
                  {!isLast && (
                    <span
                      className={`my-0.5 w-px flex-1 ${done ? 'bg-emerald-400' : 'bg-slate-200'}`}
                      style={{ minHeight: 14 }}
                    />
                  )}
                </div>
                <div className={`pb-3 text-sm ${active ? 'font-semibold text-slate-900' : done ? 'text-slate-600' : 'text-slate-400'}`}>
                  {status}
                  {active && (
                    <Badge className="ml-2 border border-dlpp-purple/30 bg-dlpp-purple/10 text-[10px] text-dlpp-purple">
                      Current
                    </Badge>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Audit trail */}
      <div>
        <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-dlpp-purple">
          <History className="h-4 w-4" />
          Activity &amp; Audit Trail
        </h4>
        {loading ? (
          <div className="py-6 text-center text-sm text-slate-400">Loading history...</div>
        ) : entries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
            No recorded activity yet.
          </div>
        ) : (
          <ol className="space-y-3">
            {entries.map((e) => {
              const Icon = actionIcon(e);
              return (
                <li key={e.id} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-800">{describe(e)}</p>
                    <p className="text-xs text-slate-400">
                      {e.logged_at ? format(new Date(e.logged_at), 'dd MMM yyyy, HH:mm') : ''}
                      {e.user_id ? ` · ${userMap[e.user_id] ?? 'Unknown user'}` : ''}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
