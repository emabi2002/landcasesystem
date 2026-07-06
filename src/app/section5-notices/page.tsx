'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  FileWarning,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  AlertCircle,
  X,
  ArrowUpDown,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  SECTION5_STATUSES,
  CLAIMANT_TYPES,
  getStatusBadgeClass,
  getClaimantTypeBadgeClass,
  type Section5Notice,
} from '@/lib/section5-notices';
import {
  Section5StatsCards,
  Section5NoticeDialog,
  Section5NoticeDetail,
} from '@/components/section5-notices';

const FALLBACK_PERMS = {
  can_read: true,
  can_create: true,
  can_update: true,
  can_delete: false,
  can_print: true,
  can_approve: false,
  can_export: true,
};

type SortField = 'notice_number' | 'date_received' | 'claimant_name' | 'province' | 'current_status';

export default function Section5NoticesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missing, setMissing] = useState(false);
  const [notices, setNotices] = useState<Section5Notice[]>([]);
  const [perms, setPerms] = useState(FALLBACK_PERMS);

  // filters
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lawyerFilter, setLawyerFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [provinceFilter, setProvinceFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // sorting
  const [sortField, setSortField] = useState<SortField>('date_received');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Section5Notice | null>(null);
  const [detail, setDetail] = useState<Section5Notice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Section5Notice | null>(null);

  // Print
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Section 5 Notice Register ${new Date().toISOString().split('T')[0]}`,
  });

  useEffect(() => {
    checkAuth();
    load();
    getModulePermissions('section5_notices').then((p) => {
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
        .from('section5_notices')
        .select('*, cases(case_number, title)')
        .order('created_at', { ascending: false });
      if (error) {
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          setMissing(true);
          setNotices([]);
          return;
        }
        throw error;
      }
      const rows: Section5Notice[] = ((data as any[]) || []).map((n) => ({
        ...n,
        case_number: n.cases?.case_number ?? null,
        case_title: n.cases?.title ?? null,
      }));
      setNotices(rows);
      setMissing(false);
    } catch (err) {
      console.error('Error loading Section 5 Notices:', err);
      toast.error('Failed to load Section 5 Notices');
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
        .from('section5_notices')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;
      await logAudit('delete', 'section5_notices', deleteTarget.id, 'section5_notice', {
        notice_number: deleteTarget.notice_number,
      });
      toast.success('Section 5 Notice deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete notice');
    }
  };

  const lawyers = useMemo(
    () =>
      Array.from(new Set(notices.map((n) => n.dlpp_lawyer_id).filter(Boolean) as string[])).sort(),
    [notices],
  );
  const provinces = useMemo(
    () => Array.from(new Set(notices.map((n) => n.province).filter(Boolean) as string[])).sort(),
    [notices],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = notices.filter((n) => {
      if (statusFilter !== 'all' && n.current_status !== statusFilter) return false;
      if (lawyerFilter !== 'all' && n.dlpp_lawyer_id !== lawyerFilter) return false;
      if (typeFilter !== 'all' && n.claimant_type !== typeFilter) return false;
      if (provinceFilter !== 'all' && n.province !== provinceFilter) return false;
      if (dateFrom && (!n.date_received || n.date_received < dateFrom)) return false;
      if (dateTo && (!n.date_received || n.date_received > dateTo)) return false;
      if (!q) return true;
      const haystack = [
        n.notice_number,
        n.claimant_name,
        n.claimant_type,
        n.ilg_name,
        n.ilg_registration_number,
        n.land_description,
        n.land_file_reference,
        n.title_file_reference,
        n.dlpp_lawyer_id,
        n.solicitor_general_lawyer,
        n.claimant_lawyers,
        n.legal_issue,
        n.province,
        n.district,
        n.current_status,
        n.case_number,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = (a[sortField] ?? '') as string;
      const bv = (b[sortField] ?? '') as string;
      return av.localeCompare(bv) * dir;
    });
  }, [notices, query, statusFilter, lawyerFilter, typeFilter, provinceFilter, dateFrom, dateTo, sortField, sortDir]);

  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (lawyerFilter !== 'all' ? 1 : 0) +
    (typeFilter !== 'all' ? 1 : 0) +
    (provinceFilter !== 'all' ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

  const clearFilters = () => {
    setStatusFilter('all');
    setLawyerFilter('all');
    setTypeFilter('all');
    setProvinceFilter('all');
    setDateFrom('');
    setDateTo('');
    setQuery('');
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
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

  // ---- Register report (all columns) ---------------------------------------
  const buildRows = (rows: Section5Notice[] = filtered) =>
    rows.map((n, i) => ({
      'No.': i + 1,
      'Date Received': n.date_received || '',
      'File Opened': n.file_opened_date || '',
      'Date Assigned': n.assigned_lawyer_date || '',
      'DLPP Lawyer': n.dlpp_lawyer_id || '',
      'Solicitor General Lawyer': n.solicitor_general_lawyer || '',
      'Claimant Lawyers': n.claimant_lawyers || '',
      'Claimant Name': n.claimant_name || '',
      'Claimant Type': n.claimant_type || '',
      'ILG Registration Number': n.ilg_registration_number || '',
      'Land Description': n.land_description || '',
      'Land File Reference': n.land_file_reference || '',
      'Title File Reference': n.title_file_reference || '',
      Province: n.province || '',
      District: n.district || '',
      'Notice No.': n.notice_number || '',
      'Linked Case': n.case_number || '',
      Status: n.current_status || '',
      Remarks: n.remarks || '',
    }));

  const exportExcel = () => {
    try {
      const rows = buildRows();
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Section 5 Notice Register');
      XLSX.writeFile(wb, `section5-notice-register-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      logAudit('export', 'section5_notices', undefined, 'section5_register', { rows: rows.length, format: 'excel' });
      toast.success(`Exported ${rows.length} notices`);
    } catch {
      toast.error('Export failed');
    }
  };

  const exportPDF = () => {
    try {
      const rows = buildRows();
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a3' });
      doc.setFontSize(14);
      doc.text('DLPP — Section 5 Notice Register', 40, 40);
      doc.setFontSize(9);
      doc.text(`Generated ${format(new Date(), 'dd MMM yyyy')} · ${rows.length} records`, 40, 56);
      const headers = Object.keys(rows[0] ?? { 'No.': '' });
      autoTable(doc, {
        startY: 70,
        head: [headers],
        body: rows.map((r) => headers.map((h) => String((r as Record<string, unknown>)[h] ?? ''))),
        styles: { fontSize: 6, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [74, 66, 132], textColor: 255 },
        columnStyles: { 10: { cellWidth: 90 } },
      });
      doc.save(`section5-notice-register-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      logAudit('export', 'section5_notices', undefined, 'section5_register', { rows: rows.length, format: 'pdf' });
      toast.success(`Exported ${rows.length} notices`);
    } catch (err) {
      console.error(err);
      toast.error('Export failed');
    }
  };

  // ---- Analytical reports --------------------------------------------------
  const exportGrouped = (title: string, groupLabel: string, counts: Record<string, number>) => {
    const rows = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => ({ [groupLabel]: k || '(Unspecified)', Notices: v }));
    if (rows.length === 0) {
      toast.error('No data for this report');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
    XLSX.writeFile(wb, `${title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    logAudit('export', 'section5_notices', undefined, 'section5_report', { report: title });
    toast.success(`${title} exported`);
  };

  const exportList = (title: string, rows: Section5Notice[]) => {
    if (rows.length === 0) {
      toast.error('No matching notices for this report');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(buildRows(rows));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
    XLSX.writeFile(wb, `${title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    logAudit('export', 'section5_notices', undefined, 'section5_report', { report: title, rows: rows.length });
    toast.success(`${title} exported (${rows.length})`);
  };

  const tally = (fn: (n: Section5Notice) => string | null | undefined) =>
    notices.reduce<Record<string, number>>((acc, n) => {
      const key = (fn(n) || '').trim();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  const runReport = (id: string) => {
    switch (id) {
      case 'by-month':
        return exportGrouped('Notices Received by Month', 'Month', tally((n) =>
          n.date_received ? n.date_received.slice(0, 7) : '',
        ));
      case 'by-province':
        return exportGrouped('Notices by Province', 'Province', tally((n) => n.province));
      case 'by-lawyer':
        return exportGrouped('Notices by Lawyer', 'DLPP Lawyer', tally((n) => n.dlpp_lawyer_id));
      case 'by-ilg':
        return exportGrouped(
          'Notices by ILG',
          'ILG',
          notices
            .filter((n) => n.ilg_name || n.ilg_registration_number)
            .reduce<Record<string, number>>((acc, n) => {
              const key = (n.ilg_name || n.ilg_registration_number || '').trim();
              acc[key] = (acc[key] || 0) + 1;
              return acc;
            }, {}),
        );
      case 'by-status':
        return exportGrouped('Notices by Status', 'Status', tally((n) => n.current_status));
      case 'linked':
        return exportList('Notices linked to Cases', notices.filter((n) => n.case_id));
      case 'outstanding':
        return exportList('Outstanding Notices', notices.filter((n) => n.current_status !== 'Closed'));
      case 'closed':
        return exportList('Closed Notices', notices.filter((n) => n.current_status === 'Closed'));
    }
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th className="px-3 py-3">
      <button
        onClick={() => toggleSort(field)}
        className="flex items-center gap-1 text-left uppercase tracking-wide hover:text-slate-800"
      >
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-dlpp-purple' : 'text-slate-300'}`} />
      </button>
    </th>
  );

  if (loading && notices.length === 0 && !missing) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-dlpp-purple" />
            <p className="mt-4 text-slate-600">Loading Section 5 Notices...</p>
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
          <div className="mx-auto flex max-w-[1500px] items-center justify-between">
            <div className="flex items-center gap-4">
              <FileWarning className="h-5 w-5 text-dlpp-purple" />
              <div className="h-6 w-px bg-slate-300" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Section 5 Notice Register</h1>
                <p className="text-xs text-slate-500">
                  Official Section 5 Notices received by the Department, linked to cases
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              {perms.can_export && !missing && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" disabled={notices.length === 0}>
                        <BarChart3 className="mr-1 h-4 w-4" />
                        Reports
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Analytical reports (Excel)</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => runReport('by-month')}>Notices Received by Month</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => runReport('by-province')}>Notices by Province</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => runReport('by-lawyer')}>Notices by Lawyer</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => runReport('by-ilg')}>Notices by ILG</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => runReport('by-status')}>Notices by Status</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => runReport('linked')}>Notices linked to Cases</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => runReport('outstanding')}>Outstanding Notices</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => runReport('closed')}>Closed Notices</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" disabled={filtered.length === 0}>
                        <Download className="mr-1 h-4 w-4" />
                        Register
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
                      {perms.can_print && (
                        <DropdownMenuItem onClick={() => handlePrint?.()}>
                          <Printer className="mr-2 h-4 w-4 text-slate-600" />
                          Print Register
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              {perms.can_create && !missing && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditing(null);
                    setDialogOpen(true);
                  }}
                  className="bg-dlpp-purple text-white hover:bg-dlpp-purple-dark"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Register Notice
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1500px] space-y-6 px-6 py-6">
          {missing ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-amber-900">Database setup required</h3>
                  <p className="text-xs text-amber-800">
                    The <code className="rounded bg-amber-100 px-1">section5_notices</code> table does
                    not exist yet. Run{' '}
                    <code className="rounded bg-amber-100 px-1">database-section5-notices.sql</code> in
                    your Supabase SQL Editor, then refresh this page.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Dashboard */}
              <Section5StatsCards notices={notices} />

              {/* Filters */}
              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search notice no., claimant, ILG, land, file refs, lawyer, province, status..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="h-9 pl-8"
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-6">
                    <div>
                      <Label className="text-xs text-slate-600">Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          {SECTION5_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Claimant Type</Label>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All types</SelectItem>
                          {CLAIMANT_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">DLPP Lawyer</Label>
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
                      <Label className="text-xs text-slate-600">Province</Label>
                      <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All provinces</SelectItem>
                          {provinces.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
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

                {/* Register table */}
                <div className="overflow-x-auto">
                  {filtered.length === 0 ? (
                    <div className="py-16 text-center">
                      <FileWarning className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                      <p className="text-slate-600">
                        {notices.length === 0
                          ? 'No Section 5 Notices registered yet.'
                          : 'No notices match your filters.'}
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                          <SortHeader field="notice_number" label="Notice No." />
                          <SortHeader field="date_received" label="Received" />
                          <SortHeader field="claimant_name" label="Claimant" />
                          <th className="px-3 py-3">Type</th>
                          <th className="px-3 py-3">ILG Reg. No.</th>
                          <th className="px-3 py-3">DLPP Lawyer</th>
                          <SortHeader field="province" label="Province" />
                          <th className="px-3 py-3">Case</th>
                          <SortHeader field="current_status" label="Status" />
                          <th className="px-3 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((n) => (
                          <tr key={n.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-3 py-3 font-medium text-slate-900">
                              {n.notice_number || '—'}
                            </td>
                            <td className="px-3 py-3 text-slate-600">{fmt(n.date_received)}</td>
                            <td className="px-3 py-3 text-slate-700">{n.claimant_name || '—'}</td>
                            <td className="px-3 py-3">
                              {n.claimant_type ? (
                                <Badge className={`border text-[11px] ${getClaimantTypeBadgeClass(n.claimant_type)}`}>
                                  {n.claimant_type}
                                </Badge>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="px-3 py-3 text-slate-600">{n.ilg_registration_number || '—'}</td>
                            <td className="px-3 py-3 text-slate-600">{n.dlpp_lawyer_id || '—'}</td>
                            <td className="px-3 py-3 text-slate-600">{n.province || '—'}</td>
                            <td className="px-3 py-3 font-mono text-xs text-slate-500">
                              {n.case_number || '—'}
                            </td>
                            <td className="px-3 py-3">
                              <Badge className={`border text-xs ${getStatusBadgeClass(n.current_status)}`}>
                                {n.current_status}
                              </Badge>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setDetail(n)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {perms.can_update && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setEditing(n);
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
                                    onClick={() => setDeleteTarget(n)}
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
                    Showing {filtered.length} of {notices.length} notices
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <Section5NoticeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={load}
        notice={editing}
      />
      <Section5NoticeDetail
        open={Boolean(detail)}
        onOpenChange={(o) => !o && setDetail(null)}
        notice={detail}
        canUpload={perms.can_update || perms.can_create}
      />
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Section 5 Notice?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes notice <strong>{deleteTarget?.notice_number}</strong>. This
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

      {/* Hidden printable register */}
      <div style={{ display: 'none' }}>
        <div ref={printRef} className="p-6">
          <style>{`@page { size: A3 landscape; margin: 12mm; }`}</style>
          <div style={{ marginBottom: 12 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#4A4284', margin: 0 }}>
              DLPP — Section 5 Notice Register
            </h1>
            <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>
              Department of Lands &amp; Physical Planning · Generated{' '}
              {format(new Date(), 'dd MMM yyyy HH:mm')} · {filtered.length} records
            </p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 8 }}>
            <thead>
              <tr style={{ background: '#4A4284', color: '#fff' }}>
                {[
                  'No.',
                  'Date Received',
                  'File Opened',
                  'Date Assigned',
                  'DLPP Lawyer',
                  'Solicitor General',
                  'Claimant Lawyers',
                  'Claimant Name',
                  'ILG Reg. No.',
                  'Land Description',
                  'Land File Ref.',
                  'Title File Ref.',
                  'Province',
                  'District',
                  'Status',
                  'Remarks',
                ].map((h) => (
                  <th key={h} style={{ border: '1px solid #cbd5e1', padding: '4px 6px', textAlign: 'left' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((n, i) => (
                <tr key={n.id} style={{ background: i % 2 ? '#f5f7fa' : '#fff' }}>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px' }}>{i + 1}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px' }}>{fmt(n.date_received)}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px' }}>{fmt(n.file_opened_date)}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px' }}>{fmt(n.assigned_lawyer_date)}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px' }}>{n.dlpp_lawyer_id || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px' }}>{n.solicitor_general_lawyer || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px' }}>{n.claimant_lawyers || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px' }}>{n.claimant_name || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px' }}>{n.ilg_registration_number || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px' }}>{n.land_description || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px' }}>{n.land_file_reference || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px' }}>{n.title_file_reference || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px' }}>{n.province || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px' }}>{n.district || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px' }}>{n.current_status || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px' }}>{n.remarks || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
