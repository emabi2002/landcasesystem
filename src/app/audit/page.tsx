'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getModulePermissions } from '@/lib/permissions';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  History,
  Search,
  RefreshCw,
  Download,
  Lock,
  X,
  ShieldCheck,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

interface AuditLog {
  id: string;
  user_id: string | null;
  module_id: string | null;
  action: string;
  record_id: string | null;
  record_type: string | null;
  details: unknown;
  logged_at: string;
}

const ACTION_BADGE: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  update: 'bg-blue-100 text-blue-800 border-blue-300',
  delete: 'bg-red-100 text-red-800 border-red-300',
  read: 'bg-slate-100 text-slate-700 border-slate-300',
  print: 'bg-violet-100 text-violet-800 border-violet-300',
  approve: 'bg-amber-100 text-amber-800 border-amber-300',
  export: 'bg-teal-100 text-teal-800 border-teal-300',
};

function formatDetails(details: unknown): string {
  if (!details) return '';
  if (typeof details === 'string') return details;
  try {
    return Object.entries(details as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
      .join(' · ');
  } catch {
    return '';
  }
}

export default function AuditTrailPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [canExport, setCanExport] = useState(false);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [moduleMap, setModuleMap] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [myActivityOnly, setMyActivityOnly] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUserId(user.id);
    const perms = await getModulePermissions('audit_trail');
    // Fallback: allow if module not configured (setup phase) — read-only anyway.
    const canRead = perms ? perms.can_read : true;
    setCanExport(perms ? perms.can_export : true);
    setAllowed(canRead);
    if (canRead) {
      await load();
    } else {
      setLoading(false);
    }
  };

  const load = async () => {
    try {
      const [{ data: logData, error }, { data: profiles }, { data: modules }] = await Promise.all([
        (supabase as any)
          .from('audit_logs')
          .select('*')
          .order('logged_at', { ascending: false })
          .limit(1000),
        (supabase as any).from('profiles').select('id, full_name, email'),
        (supabase as any).from('modules').select('id, module_name'),
      ]);

      if (error) throw error;

      const um: Record<string, string> = {};
      (profiles || []).forEach((p: { id: string; full_name: string | null; email: string | null }) => {
        um[p.id] = p.full_name || p.email || p.id.slice(0, 8);
      });
      const mm: Record<string, string> = {};
      (modules || []).forEach((m: { id: string; module_name: string }) => {
        mm[m.id] = m.module_name;
      });

      setUserMap(um);
      setModuleMap(mm);
      setLogs((logData as AuditLog[]) || []);
    } catch (err) {
      console.error('Error loading audit logs:', err);
      toast.error('Failed to load audit trail');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    toast.success('Audit trail refreshed');
  };

  const actions = useMemo(
    () => Array.from(new Set(logs.map((l) => l.action).filter(Boolean))).sort(),
    [logs],
  );
  const moduleOptions = useMemo(
    () =>
      Array.from(new Set(logs.map((l) => l.module_id).filter(Boolean) as string[]))
        .map((id) => ({ id, name: moduleMap[id] || 'Unknown' }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [logs, moduleMap],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((l) => {
      if (myActivityOnly && l.user_id !== currentUserId) return false;
      if (actionFilter !== 'all' && l.action !== actionFilter) return false;
      if (moduleFilter !== 'all' && l.module_id !== moduleFilter) return false;
      const day = l.logged_at?.slice(0, 10);
      if (dateFrom && (!day || day < dateFrom)) return false;
      if (dateTo && (!day || day > dateTo)) return false;
      if (!q) return true;
      const hay = [
        userMap[l.user_id ?? ''] ?? l.user_id,
        l.action,
        moduleMap[l.module_id ?? ''] ?? '',
        l.record_type,
        l.record_id,
        formatDetails(l.details),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [logs, query, actionFilter, moduleFilter, dateFrom, dateTo, userMap, moduleMap, myActivityOnly, currentUserId]);

  const activeFilters =
    (actionFilter !== 'all' ? 1 : 0) +
    (moduleFilter !== 'all' ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (myActivityOnly ? 1 : 0);

  const exportExcel = () => {
    try {
      const rows = filtered.map((l) => ({
        'Date/Time': l.logged_at ? format(new Date(l.logged_at), 'yyyy-MM-dd HH:mm:ss') : '',
        User: userMap[l.user_id ?? ''] ?? l.user_id ?? '',
        Action: l.action,
        Module: moduleMap[l.module_id ?? ''] ?? '',
        'Record Type': l.record_type ?? '',
        'Record ID': l.record_id ?? '',
        Details: formatDetails(l.details),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Audit Trail');
      XLSX.writeFile(wb, `audit-trail-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast.success(`Exported ${rows.length} entries`);
    } catch {
      toast.error('Export failed');
    }
  };

  // --- Access denied -------------------------------------------------------
  if (allowed === false) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-6">
          <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Lock className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-3 text-lg font-semibold text-slate-900">Access restricted</h2>
            <p className="mt-1 text-sm text-slate-500">
              You do not have permission to view the audit trail. Ask an administrator to add the
              Audit Trail permission to your group.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between">
            <div className="flex items-center gap-4">
              <History className="h-5 w-5 text-dlpp-purple" />
              <div className="h-6 w-px bg-slate-300" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Audit Trail</h1>
                <p className="text-xs text-slate-500">
                  Read-only record of who did what and when
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={myActivityOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMyActivityOnly((v) => !v)}
                className={myActivityOnly ? 'bg-dlpp-purple hover:bg-dlpp-purple-dark text-white' : ''}
              >
                <User className="mr-1 h-4 w-4" />
                My activity
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              {canExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportExcel}
                  disabled={filtered.length === 0}
                >
                  <Download className="mr-1 h-4 w-4" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
          {/* Read-only notice */}
          <div className="flex items-center gap-2 rounded-lg border border-dlpp-purple/20 bg-dlpp-purple/5 px-4 py-2.5 text-sm text-slate-700">
            <ShieldCheck className="h-4 w-4 text-dlpp-purple" />
            This is a permanent, read-only record. Entries cannot be edited or deleted.
          </div>

          {/* Filters */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by user, action, module, record or details..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-9 pl-8"
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div>
                  <Label className="text-xs text-slate-600">Action</Label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All actions</SelectItem>
                      {actions.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Module</Label>
                  <Select value={moduleFilter} onValueChange={setModuleFilter}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All modules</SelectItem>
                      {moduleOptions.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">From</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-600">To</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="mt-1 h-9"
                  />
                </div>
              </div>
              {activeFilters > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="secondary">{activeFilters} filter(s)</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7"
                    onClick={() => {
                      setActionFilter('all');
                      setModuleFilter('all');
                      setDateFrom('');
                      setDateTo('');
                      setQuery('');
                      setMyActivityOnly(false);
                    }}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-16 text-center text-sm text-slate-400">Loading audit trail...</div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <History className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                  <p className="text-slate-600">
                    {logs.length === 0
                      ? 'No audit entries yet. Actions performed in the system will appear here.'
                      : 'No entries match your filters.'}
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Date / Time</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Module</th>
                      <th className="px-4 py-3">Record</th>
                      <th className="px-4 py-3">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((l) => (
                      <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {l.logged_at ? format(new Date(l.logged_at), 'dd MMM yyyy HH:mm') : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {userMap[l.user_id ?? ''] ?? (l.user_id ? l.user_id.slice(0, 8) : '—')}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={`border text-xs capitalize ${
                              ACTION_BADGE[l.action] ?? 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {l.action}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {moduleMap[l.module_id ?? ''] ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {l.record_type ? (
                            <span className="font-mono text-xs">
                              {l.record_type}
                              {l.record_id ? ` · ${l.record_id.slice(0, 8)}` : ''}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="max-w-md px-4 py-3 text-xs text-slate-500">
                          {formatDetails(l.details) || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {filtered.length > 0 && (
              <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                Showing {filtered.length} of {logs.length} entries
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
