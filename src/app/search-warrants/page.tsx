'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getModulePermissions, logAudit } from '@/lib/permissions';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ShieldAlert,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  Download,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  SEARCH_WARRANT_STATUSES,
  getStatusBadgeClass,
  type SearchWarrant,
} from '@/lib/search-warrants';
import {
  SearchWarrantStatsCards,
  SearchWarrantDialog,
  SearchWarrantDetail,
} from '@/components/search-warrants';

const FALLBACK_PERMS = {
  can_read: true,
  can_create: true,
  can_update: true,
  can_delete: false,
  can_print: true,
  can_approve: false,
  can_export: true,
};

export default function SearchWarrantsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missing, setMissing] = useState(false);
  const [warrants, setWarrants] = useState<SearchWarrant[]>([]);
  const [perms, setPerms] = useState(FALLBACK_PERMS);

  // filters
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lawyerFilter, setLawyerFilter] = useState('all');
  const [legalIssueFilter, setLegalIssueFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SearchWarrant | null>(null);
  const [detail, setDetail] = useState<SearchWarrant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SearchWarrant | null>(null);

  useEffect(() => {
    checkAuth();
    load();
    getModulePermissions('search_warrants').then((p) => {
      if (p) setPerms(p);
    });
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/login');
  };

  const load = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('search_warrants')
        .select('*, cases(case_number, title)')
        .order('created_at', { ascending: false });
      if (error) {
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          setMissing(true);
          setWarrants([]);
          return;
        }
        throw error;
      }
      const rows: SearchWarrant[] = ((data as any[]) || []).map((w) => ({
        ...w,
        case_number: w.cases?.case_number ?? null,
        case_title: w.cases?.title ?? null,
      }));
      setWarrants(rows);
      setMissing(false);
    } catch (err) {
      console.error('Error loading search warrants:', err);
      toast.error('Failed to load search warrants');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    toast.success('Data refreshed');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await (supabase as any)
        .from('search_warrants')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;
      await logAudit('delete', 'search_warrants', deleteTarget.id, 'search_warrant', {
        warrant_number: deleteTarget.warrant_number,
      });
      toast.success('Search warrant deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete warrant');
    }
  };

  const lawyers = useMemo(
    () =>
      Array.from(
        new Set(warrants.map((w) => w.dlpp_lawyer_in_carriage).filter(Boolean) as string[]),
      ).sort(),
    [warrants],
  );
  const legalIssues = useMemo(
    () =>
      Array.from(
        new Set(warrants.map((w) => w.legal_issue).filter(Boolean) as string[]),
      ).sort(),
    [warrants],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return warrants.filter((w) => {
      if (statusFilter !== 'all' && w.status !== statusFilter) return false;
      if (lawyerFilter !== 'all' && w.dlpp_lawyer_in_carriage !== lawyerFilter) return false;
      if (legalIssueFilter !== 'all' && w.legal_issue !== legalIssueFilter) return false;
      if (dateFrom && (!w.date_received || w.date_received < dateFrom)) return false;
      if (dateTo && (!w.date_received || w.date_received > dateTo)) return false;
      if (!q) return true;
      const haystack = [
        w.warrant_number,
        w.crime_report_number,
        w.land_file_reference,
        w.title_file_reference,
        w.police_officer_name,
        w.applicant_informant,
        w.respondent,
        w.land_description,
        w.dlpp_lawyer_in_carriage,
        w.legal_issue,
        w.status,
        w.case_number,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [warrants, query, statusFilter, lawyerFilter, legalIssueFilter, dateFrom, dateTo]);

  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (lawyerFilter !== 'all' ? 1 : 0) +
    (legalIssueFilter !== 'all' ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

  const clearFilters = () => {
    setStatusFilter('all');
    setLawyerFilter('all');
    setLegalIssueFilter('all');
    setDateFrom('');
    setDateTo('');
    setQuery('');
  };

  // ---- Register report export (all columns) --------------------------------
  const buildRows = () =>
    filtered.map((w, i) => ({
      'No.': i + 1,
      'Date Received': w.date_received || '',
      'Received From': w.received_from || '',
      'Contact Details of Police Officer': [w.police_officer_name, w.police_officer_rank, w.police_contact_details]
        .filter(Boolean)
        .join(' | '),
      'Received By': w.received_by || '',
      'Date Assigned to Lawyer': w.date_assigned_to_lawyer || '',
      'DLPP Lawyer in Carriage': w.dlpp_lawyer_in_carriage || '',
      'Crime Report No.': w.crime_report_number || '',
      'Search Warrant No.': w.warrant_number || '',
      'Applicant/Informant': w.applicant_informant || '',
      Respondent: w.respondent || '',
      'Land Description': w.land_description || '',
      'Legal Issue': w.legal_issue || '',
      'Land File Reference': w.land_file_reference || '',
      'Title File Reference': w.title_file_reference || '',
      'Documents to Provide': w.documents_to_provide || '',
      'Witness Statement': w.witness_statement_status || '',
      'Status of Matter': w.status || '',
      'Remarks/Comments': w.remarks_comments || '',
    }));

  const exportExcel = () => {
    try {
      const rows = buildRows();
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Search Warrant Register');
      XLSX.writeFile(wb, `search-warrant-register-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast.success(`Exported ${rows.length} warrants`);
    } catch {
      toast.error('Export failed');
    }
  };

  const exportPDF = () => {
    try {
      const rows = buildRows();
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a3' });
      doc.setFontSize(14);
      doc.text('DLPP — Search Warrant Register', 40, 40);
      doc.setFontSize(9);
      doc.text(`Generated ${format(new Date(), 'dd MMM yyyy')} · ${rows.length} records`, 40, 56);
      const headers = Object.keys(rows[0] ?? { 'No.': '' });
      autoTable(doc, {
        startY: 70,
        head: [headers],
        body: rows.map((r) => headers.map((h) => String((r as Record<string, unknown>)[h] ?? ''))),
        styles: { fontSize: 6, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [74, 66, 132], textColor: 255 },
        columnStyles: { 11: { cellWidth: 90 }, 12: { cellWidth: 90 }, 15: { cellWidth: 90 } },
      });
      doc.save(`search-warrant-register-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success(`Exported ${rows.length} warrants`);
    } catch (err) {
      console.error(err);
      toast.error('Export failed');
    }
  };

  const fmt = (d?: string | null) => {
    if (!d) return '—';
    try {
      return format(new Date(d), 'dd MMM yyyy');
    } catch {
      return d;
    }
  };

  if (loading && warrants.length === 0 && !missing) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-dlpp-purple" />
            <p className="mt-4 text-slate-600">Loading search warrants...</p>
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
              <ShieldAlert className="h-5 w-5 text-dlpp-purple" />
              <div className="h-6 w-px bg-slate-300" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Search Warrants</h1>
                <p className="text-xs text-slate-500">
                  Official warrant / investigation register, linked to cases
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              {perms.can_export && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={filtered.length === 0}>
                      <Download className="mr-1 h-4 w-4" />
                      Register Report
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exportExcel}>
                      <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                      Export to Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportPDF}>
                      <FileText className="mr-2 h-4 w-4 text-red-600" />
                      Export to PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {perms.can_create && !missing && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditing(null);
                    setDialogOpen(true);
                  }}
                  className="bg-dlpp-purple hover:bg-dlpp-purple-dark text-white"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Register Warrant
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
          {missing ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-amber-900">
                    Database setup required
                  </h3>
                  <p className="text-xs text-amber-800">
                    The <code className="rounded bg-amber-100 px-1">search_warrants</code> table does
                    not exist yet. Run{' '}
                    <code className="rounded bg-amber-100 px-1">database-search-warrants.sql</code> in
                    your Supabase SQL Editor, then refresh this page.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Stats */}
              <SearchWarrantStatsCards warrants={warrants} />

              {/* Filters */}
              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search warrant no., CR no., file refs, officer, applicant, respondent, land, lawyer, status..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="h-9 pl-8"
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
                    <div>
                      <Label className="text-xs text-slate-600">Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          {SEARCH_WARRANT_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Lawyer</Label>
                      <Select value={lawyerFilter} onValueChange={setLawyerFilter}>
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All lawyers</SelectItem>
                          {lawyers.map((l) => (
                            <SelectItem key={l} value={l}>
                              {l}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Legal Issue</Label>
                      <Select value={legalIssueFilter} onValueChange={setLegalIssueFilter}>
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All legal issues</SelectItem>
                          {legalIssues.map((l) => (
                            <SelectItem key={l} value={l}>
                              {l.length > 40 ? `${l.slice(0, 40)}…` : l}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Received From</Label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="mt-1 h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Received To</Label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="mt-1 h-9"
                      />
                    </div>
                  </div>
                  {activeFilterCount > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="secondary">{activeFilterCount} filter(s) active</Badge>
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7">
                        <X className="mr-1 h-3 w-3" />
                        Clear
                      </Button>
                    </div>
                  )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  {filtered.length === 0 ? (
                    <div className="py-16 text-center">
                      <ShieldAlert className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                      <p className="text-slate-600">
                        {warrants.length === 0
                          ? 'No search warrants registered yet.'
                          : 'No warrants match your filters.'}
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                          <th className="px-4 py-3">Warrant No.</th>
                          <th className="px-4 py-3">CR No.</th>
                          <th className="px-4 py-3">Received</th>
                          <th className="px-4 py-3">Respondent</th>
                          <th className="px-4 py-3">Lawyer</th>
                          <th className="px-4 py-3">Case</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((w) => (
                          <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {w.warrant_number || '—'}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{w.crime_report_number || '—'}</td>
                            <td className="px-4 py-3 text-slate-600">{fmt(w.date_received)}</td>
                            <td className="px-4 py-3 text-slate-600">{w.respondent || '—'}</td>
                            <td className="px-4 py-3 text-slate-600">{w.dlpp_lawyer_in_carriage || '—'}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">
                              {w.case_number || '—'}
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={`border text-xs ${getStatusBadgeClass(w.status)}`}>
                                {w.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setDetail(w)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {perms.can_update && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setEditing(w);
                                      setDialogOpen(true);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                )}
                                {perms.can_delete && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700"
                                    onClick={() => setDeleteTarget(w)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                {filtered.length > 0 && (
                  <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                    Showing {filtered.length} of {warrants.length} warrants
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <SearchWarrantDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={load}
        warrant={editing}
      />
      <SearchWarrantDetail
        open={Boolean(detail)}
        onOpenChange={(o) => !o && setDetail(null)}
        warrant={detail}
        canUpload={perms.can_update || perms.can_create}
      />
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this search warrant?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes warrant <strong>{deleteTarget?.warrant_number}</strong>. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
