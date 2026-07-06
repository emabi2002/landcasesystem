'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  History,
  Plus,
  Pencil,
  Trash2,
  Upload,
  ArrowRightLeft,
  UserCheck,
  Link2,
  Gavel,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Section160Application } from '@/lib/section-160';

interface AuditEntry {
  id: string;
  action: string;
  record_type: string | null;
  details: Record<string, unknown> | null;
  logged_at: string;
  user_id: string | null;
}

interface Section160TimelineProps {
  application: Section160Application;
}

function actionIcon(entry: AuditEntry) {
  const change = (entry.details as { change?: string } | null)?.change;
  if (change === 'status') return ArrowRightLeft;
  if (change === 'lawyer_assignment') return UserCheck;
  if (change === 'case_link') return Link2;
  if (change === 'court_file') return Gavel;
  if (entry.record_type === 'section_160_document') return Upload;
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
  if (d.change === 'court_file') return `Court file reference set to “${d.to ?? '—'}”`;
  if (entry.record_type === 'section_160_document')
    return `Document uploaded${d.title ? `: ${d.title}` : ''}`;
  if (entry.action === 'create') return 'Application registered';
  if (entry.action === 'update') return 'Application details updated';
  if (entry.action === 'delete') return 'Application deleted';
  return entry.action;
}

export function Section160Timeline({ application }: Section160TimelineProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [{ data: logs }, { data: profiles }] = await Promise.all([
        (supabase as any)
          .from('audit_logs')
          .select('id, action, record_type, details, logged_at, user_id')
          .eq('record_id', application.id)
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
      console.error('Error loading application timeline:', err);
    } finally {
      setLoading(false);
    }
  }, [application.id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
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
  );
}
