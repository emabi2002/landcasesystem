'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Eye, FileText, Plus, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';

import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';

interface CaseRow {
  id: string;
  case_number: string;
  title: string | null;
  description?: string | null;
  status: string;
  case_type: string;
  priority?: string | null;
  region?: string | null;
  created_at: string;
  dlpp_action_officer?: string | null;
}

const ACTIVE_STATUSES = new Set(['under_review', 'in_court', 'mediation', 'tribunal', 'judgment']);

function formatLabel(value: string | null | undefined) {
  if (!value) return 'Not set';
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getStatusClasses(status: string) {
  if (status === 'closed' || status === 'settled') return 'bg-slate-100 text-slate-700 border-slate-200';
  if (status === 'judgment') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (status === 'in_court') return 'bg-red-100 text-red-800 border-red-200';
  if (status === 'mediation' || status === 'tribunal') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  return 'bg-blue-100 text-blue-800 border-blue-200';
}

function getPriorityClasses(priority: string | null | undefined) {
  if (priority === 'urgent') return 'bg-red-50 text-red-700 border-red-200';
  if (priority === 'high') return 'bg-orange-50 text-orange-700 border-orange-200';
  if (priority === 'low') return 'bg-slate-50 text-slate-600 border-slate-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

export default function CasesPage() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [typeFilter, setTypeFilter] = useState('all');

  const loadCases = async () => {
    try {
      const batchSize = 1000;
      let from = 0;
      let allCases: CaseRow[] = [];

      while (true) {
        const { data, error } = await supabase
          .from('cases')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, from + batchSize - 1);

        if (error) throw error;

        const batch = (data as CaseRow[]) ?? [];
        allCases = allCases.concat(batch);

        if (batch.length < batchSize) break;
        from += batchSize;
      }

      setCases(allCases);
    } catch (error) {
      console.error('Error loading cases:', error);
      toast.error('Failed to load cases');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadCases();
  }, []);

  const caseTypes = useMemo(() => {
    return Array.from(new Set(cases.map((caseItem) => caseItem.case_type).filter(Boolean))).sort();
  }, [cases]);

  const filteredCases = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return cases.filter((caseItem) => {
      const matchesQuery = !query || [
        caseItem.case_number,
        caseItem.title,
        caseItem.description,
        caseItem.region,
        caseItem.dlpp_action_officer,
      ].some((value) => value?.toLowerCase().includes(query));

      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' && ACTIVE_STATUSES.has(caseItem.status))
        || caseItem.status === statusFilter;

      const matchesType = typeFilter === 'all' || caseItem.case_type === typeFilter;

      return matchesQuery && matchesStatus && matchesType;
    });
  }, [cases, searchQuery, statusFilter, typeFilter]);

  const summary = useMemo(() => {
    return {
      total: cases.length,
      active: cases.filter((caseItem) => ACTIVE_STATUSES.has(caseItem.status)).length,
      closed: cases.filter((caseItem) => caseItem.status === 'closed' || caseItem.status === 'settled').length,
      urgent: cases.filter((caseItem) => caseItem.priority === 'urgent').length,
    };
  }, [cases]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCases();
    toast.success('Cases refreshed');
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cases Register</h1>
                  <p className="text-sm text-slate-500">View, filter, and manage DLPP litigation matters.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button asChild className="gap-2 bg-emerald-700 hover:bg-emerald-800">
                <Link href="/cases/new">
                  <Plus className="h-4 w-4" />
                  New Case
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Total Cases', summary.total],
              ['Active Cases', summary.active],
              ['Closed / Settled', summary.closed],
              ['Urgent Priority', summary.urgent],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search case number, title, region, or officer"
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active cases</SelectItem>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="under_review">Under review</SelectItem>
                  <SelectItem value="in_court">In court</SelectItem>
                  <SelectItem value="mediation">Mediation</SelectItem>
                  <SelectItem value="tribunal">Tribunal</SelectItem>
                  <SelectItem value="judgment">Judgment</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="settled">Settled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All case types</SelectItem>
                  {caseTypes.map((caseType) => (
                    <SelectItem key={caseType} value={caseType}>{formatLabel(caseType)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">Case list</h2>
                <p className="text-sm text-slate-500">Showing {filteredCases.length} of {cases.length} cases</p>
              </div>
            </div>

            {loading ? (
              <div className="p-10 text-center text-slate-500">Loading cases...</div>
            ) : filteredCases.length === 0 ? (
              <div className="p-10 text-center text-slate-500">No cases match the selected filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Case</th>
                      <th className="px-6 py-3 font-semibold">Type</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold">Priority</th>
                      <th className="px-6 py-3 font-semibold">Region</th>
                      <th className="px-6 py-3 font-semibold">Created</th>
                      <th className="px-6 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCases.map((caseItem) => (
                      <tr key={caseItem.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{caseItem.case_number}</div>
                          <div className="mt-1 max-w-md truncate text-slate-500">{caseItem.title || 'Untitled case'}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{formatLabel(caseItem.case_type)}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={getStatusClasses(caseItem.status)}>
                            {formatLabel(caseItem.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={getPriorityClasses(caseItem.priority)}>
                            {formatLabel(caseItem.priority || 'medium')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{caseItem.region || 'Not set'}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {caseItem.created_at ? format(new Date(caseItem.created_at), 'dd MMM yyyy') : 'Not set'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button asChild variant="outline" size="sm" className="gap-2">
                            <Link href={`/cases/${caseItem.id}`}>
                              <Eye className="h-4 w-4" />
                              View
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
