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
  Landmark,
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
  SECTION_160_STATUSES,
  getStatusBadgeClass,
  type Section160Application,
} from '@/lib/section-160';
import {
  Section160StatsCards,
  Section160Dialog,
  Section160Detail,
} from '@/components/section-160';

const FALLBACK_PERMS = {
  can_read: true,
  can_create: true,
  can_update: true,
  can_delete: false,
  can_print: true,
  can_approve: false,
  can_export: true,
};

type SortField = 'date_received' | 'defendant' | 'application_year' | 'status_of_matter';

export default function Section160Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missing, setMissing] = useState(false);
  const [apps, setApps] = useState<Section160Application[]>([]);
  const [perms, setPerms] = useState(FALLBACK_PERMS);

  // filters
  const [query, setQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [lawyerFilter, setLawyerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courtFilter, setCourtFilter] = useState('all');
  const [titleFilter, setTitleFilter] = useState('all');

  // sorting
  const [sortField, setSortField] = useState<SortField>('date_received');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Section160Application | null>(null);
  const [detail, setDetail] = useState<Section160Application | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Section160Application | null>(null);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Section 160(2) Application Register ${new Date().toISOString().split('T')[0]}`,
  });

  useEffect(() => {
    checkAuth();
    load();
    getModulePermissions('section_160').then((p) => {
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
        .from('section_160_applications')
        .select('*, cases(case_number, title)')
        .order('created_at', { ascending: false });
      if (error) {
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          setMissing(true);
          setApps([]);
          return;
        }
        throw error;
      }
      const rows: Section160Application[] = ((data as any[]) || []).map((a) => ({
        ...a,
        case_number: a.cases?.case_number ?? null,
        case_title: a.cases?.title ?? null,
      }));
      setApps(rows);
      setMissing(false);
    } catch (err) {
      console.error('Error loading Section 160 applications:', err);
      toast.error('Failed to load applications');
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
        .from('section_160_applications')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;
      await logAudit('delete', 'section_160', deleteTarget.id, 'section_160_application', {
        defendant: deleteTarget.defendant,
      });
      toast.success('Application deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete application');
    }
  };

  const yearOf = (a: Section160Application) =>
    (a.date_received ? a.date_received.slice(0, 4) : a.application_year) || '';

  const years = useMemo(
    () => Array.from(new Set(apps.map(yearOf).filter(Boolean))).sort().reverse(),
    [apps],
  );
  const lawyers = useMemo(
    () =>
      Array.from(new Set(apps.map((a) => a.dlpp_lawyer_in_carriage).filter(Boolean) as string[])).sort(),
    [apps],
  );
  const titles = useMemo(
    () =>
      Array.from(new Set(apps.map((a) => a.title_file_reference).filter(Boolean) as string[])).sort(),
    [apps],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = apps.filter((a) => {
      if (yearFilter !== 'all' && yearOf(a) !== yearFilter) return false;
      if (lawyerFilter !== 'all' && a.dlpp_lawyer_in_carriage !== lawyerFilter) return false;
      if (statusFilter !== 'all' && a.status_of_matter !== statusFilter) return false;
      if (titleFilter !== 'all' && a.title_file_reference !== titleFilter) return false;
      if (courtFilter === 'court' && !a.court_file_reference_no) return false;
      if (courtFilter === 'non-court' && a.court_file_reference_no) return false;
      if (!q) return true;
      const haystack = [
        a.defendant,
        a.applicant_registrar_of_titles,
        a.land_description,
        a.title_file_reference,
        a.dlpp_lawyer_in_carriage,
        a.solicitor_general_lawyer,
        a.private_law_firm,
        a.defendants_lawyer,
        a.court_file_reference_no,
        a.grounds_for_application,
        a.consignment_note,
        a.status_of_matter,
        a.application_year,
        a.case_number,
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
  }, [apps, query, yearFilter, lawyerFilter, statusFilter, courtFilter, titleFilter, sortField, sortDir]);

  const activeFilterCount =
    (yearFilter !== 'all' ? 1 : 0) +
    (lawyerFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (courtFilter !== 'all' ? 1 : 0) +
    (titleFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setYearFilter('all');
    setLawyerFilter('all');
    setStatusFilter('all');
    setCourtFilter('all');
    setTitleFilter('all');
    setQuery('');
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
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

  // ---- Register report (all spreadsheet columns) ---------------------------
  const buildRows = (rows: Section160Application[] = filtered) =>
    rows.map((a, i) => ({
      'No.': i + 1,
      'Date Received': a.date_received || '',
      'Date Assigned to Legal Officer': a.date_assigned_to_legal_officer || '',
      'DLPP Lawyer in Carriage': a.dlpp_lawyer_in_carriage || '',
      'Solicitor General Lawyer': a.solicitor_general_lawyer || '',
      'Private Law Firm': a.private_law_firm || '',
      "Defendant's Lawyer": a.defendants_lawyer || '',
      'Applicant - Registrar of Titles': a.applicant_registrar_of_titles || '',
      Defendant: a.defendant || '',
      'Land Description': a.land_description || '',
      'Title File Reference': a.title_file_reference || '',
      'Date of Letter': a.letter_of_summons_date || '',
      'Date Summons Was Received': a.summons_date || '',
      'Consignment Note': a.consignment_note || '',
      'Grounds for the Application': a.grounds_for_application || '',
      'Court File Reference No.': a.court_file_reference_no || '',
      'Status of the Matter': a.status_of_matter || '',
      'Comments / Remarks': a.comments_remarks || '',
    }));

  const exportExcel = () => {
    try {
      const rows = buildRows();
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Section 160(2) Register');
      XLSX.writeFile(wb, `section-160-register-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      logAudit('export', 'section_160', undefined, 'section_160_register', { rows: rows.length, format: 'excel' });
      toast.success(`Exported ${rows.length} applications`);
    } catch {
      toast.error('Export failed');
    }
  };

  const exportPDF = () => {
    try {
      const rows = buildRows();
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a3' });
      doc.setFontSize(14);
      doc.text('DLPP — Section 160(2) Application Register', 40, 40);
      doc.setFontSize(9);
      doc.text(`Generated ${format(new Date(), 'dd MMM yyyy')} · ${rows.length} records`, 40, 56);
      const headers = Object.keys(rows[0] ?? { 'No.': '' });
      autoTable(doc, {
        startY: 70,
        head: [headers],
        body: rows.map((r) => headers.map((h) => String((r as Record<string, unknown>)[h] ?? ''))),
        styles: { fontSize: 6, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [74, 66, 132], textColor: 255 },
        columnStyles: { 9: { cellWidth: 90 }, 14: { cellWidth: 100 } },
      });
      doc.save(`section-160-register-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      logAudit('export', 'section_160', undefined, 'section_160_register', { rows: rows.length, format: 'pdf' });
      toast.success(`Exported ${rows.length} applications`);
    } catch (err) {
      console.error(err);
      toast.error('Export failed');
    }
  };

  // ---- Analytical reports --------------------------------------------------
  const exportGrouped = (title: string, groupLabel: string, counts: Record<string, number>) => {
    const rows = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => ({ [groupLabel]: k || '(Unspecified)', Applications: v }));
    if (rows.length === 0) {
      toast.error('No data for this report');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
    XLSX.writeFile(wb, `${title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    logAudit('export', 'section_160', undefined, 'section_160_report', { report: title });
    toast.success(`${title} exported`);
  };

  const exportList = (title: string, rows: Section160Application[]) => {
    if (rows.length === 0) {
      toast.error('No matching applications for this report');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(buildRows(rows));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
    XLSX.writeFile(wb, `${title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    logAudit('export', 'section_160', undefined, 'section_160_report', { report: title, rows: rows.length });
    toast.success(`${title} exported (${rows.length})`);
  };

  const tally = (fn: (a: Section160Application) => string | null | undefined) =>
    apps.reduce<Record<string, number>>((acc, a) => {
      const key = (fn(a) || '').trim();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  const runReport = (id: string) => {
    switch (id) {
      case 'by-year':
        return exportGrouped('Applications by Year', 'Year', tally(yearOf));
      case 'by-lawyer':
        return exportGrouped('Applications by Lawyer', 'DLPP Lawyer', tally((a) => a.dlpp_lawyer_in_carriage));
      case 'by-status':
        return exportGrouped('Applications by Status', 'Status', tally((a) => a.status_of_matter));
      case 'by-land':
        return exportGrouped('Applications by Land Description', 'Land Description', tally((a) => a.land_description));
      case 'by-title':
        return exportGrouped('Applications by Title File Reference', 'Title File Reference', tally((a) => a.title_file_reference));
      case 'by-court':
        return exportGrouped('Applications by Court File Reference', 'Court File Reference', tally((a) => a.court_file_reference_no));
      case 'outstanding':
        return exportList('Outstanding Applications', apps.filter((a) => a.status_of_matter !== 'Closed' && a.status_of_matter !== 'Rejected'));
      case 'closed':
        return exportList('Closed Applications', apps.filter((a) => a.status_of_matter === 'Closed'));
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

  if (loading && apps.length === 0 && !missing) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-dlpp-purple" />
            <p className="mt-4 text-slate-600">Loading Section 160(2) applications...</p>
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
              <Landmark className="h-5 w-5 text-dlpp-purple" />
              <div className="h-6 w-px bg-slate-300" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Section 160(2) Application Register
                </h1>
                <p className="text-xs text-slate-500">
                  Land Registration Act 1981 applications, linked to cases
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
                      <Button variant="outline" size="sm" disabled={apps.length === 0}>
                        <BarChart3 className="mr-1 h-4 w-4" />
                        Reports
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60">
                      <DropdownMenuLabel>Analytical reports (Excel)</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => runReport('by-year')}>Applications by Year</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => runReport('by-lawyer')}>Applications by Lawyer</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => runReport('by-status')}>Applications by Status</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => runReport('by-land')}>Applications by Land Description</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => runReport('by-title')}>Applications by Title File Reference</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => runReport('by-court')}>Applications by Court File Reference</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => runReport('outstanding')}>Outstanding Applications</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => runReport('closed')}>Closed Applications</DropdownMenuItem>
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
                  Register Application
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
                    The <code className="rounded bg-amber-100 px-1">section_160_applications</code> table
                    does not exist yet. Run{' '}
                    <code className="rounded bg-amber-100 px-1">database-section-160.sql</code> in your
                    Supabase SQL Editor, then refresh this page.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Dashboard */}
              <Section160StatsCards applications={apps} />

              {/* Filters */}
              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search defendant, land, title ref, lawyer, court ref, grounds, status, year..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="h-9 pl-8"
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
                    <div>
                      <Label className="text-xs text-slate-600">Year</Label>
                      <Select value={yearFilter} onValueChange={setYearFilter}>
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All years</SelectItem>
                          {years.map((y) => (
                            <SelectItem key={y} value={y}>
                              {y}
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
                      <Label className="text-xs text-slate-600">Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          {SECTION_160_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Court Matter</Label>
                      <Select value={courtFilter} onValueChange={setCourtFilter}>
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All matters</SelectItem>
                          <SelectItem value="court">Court matters (has court ref)</SelectItem>
                          <SelectItem value="non-court">Non-court</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Title File Ref</Label>
                      <Select value={titleFilter} onValueChange={setTitleFilter}>
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All titles</SelectItem>
                          {titles.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t.length > 30 ? `${t.slice(0, 30)}…` : t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <Landmark className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                      <p className="text-slate-600">
                        {apps.length === 0
                          ? 'No Section 160(2) applications registered yet.'
                          : 'No applications match your filters.'}
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                          <SortHeader field="application_year" label="Year" />
                          <SortHeader field="date_received" label="Received" />
                          <SortHeader field="defendant" label="Defendant" />
                          <th className="px-3 py-3">DLPP Lawyer</th>
                          <th className="px-3 py-3">Title File Ref</th>
                          <th className="px-3 py-3">Court File Ref</th>
                          <th className="px-3 py-3">Case</th>
                          <SortHeader field="status_of_matter" label="Status" />
                          <th className="px-3 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((a) => (
                          <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-3 py-3 text-slate-600">{yearOf(a) || '—'}</td>
                            <td className="px-3 py-3 text-slate-600">{fmt(a.date_received)}</td>
                            <td className="px-3 py-3 font-medium text-slate-900">{a.defendant || '—'}</td>
                            <td className="px-3 py-3 text-slate-600">{a.dlpp_lawyer_in_carriage || '—'}</td>
                            <td className="px-3 py-3 text-slate-600">{a.title_file_reference || '—'}</td>
                            <td className="px-3 py-3 text-slate-600">{a.court_file_reference_no || '—'}</td>
                            <td className="px-3 py-3 font-mono text-xs text-slate-500">{a.case_number || '—'}</td>
                            <td className="px-3 py-3">
                              <Badge className={`border text-xs ${getStatusBadgeClass(a.status_of_matter)}`}>
                                {a.status_of_matter}
                              </Badge>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetail(a)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {perms.can_update && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setEditing(a);
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
                                    onClick={() => setDeleteTarget(a)}
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
                    Showing {filtered.length} of {apps.length} applications
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <Section160Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={load}
        application={editing}
      />
      <Section160Detail
        open={Boolean(detail)}
        onOpenChange={(o) => !o && setDetail(null)}
        application={detail}
        canUpload={perms.can_update || perms.can_create}
      />
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this application?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the Section 160(2) application for{' '}
              <strong>{deleteTarget?.defendant}</strong>. This action cannot be undone.
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
          <style>{`@page { size: A3 landscape; margin: 10mm; }`}</style>
          <div style={{ marginBottom: 12 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#4A4284', margin: 0 }}>
              DLPP — Section 160(2) Application Register
            </h1>
            <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>
              Department of Lands &amp; Physical Planning · Generated{' '}
              {format(new Date(), 'dd MMM yyyy HH:mm')} · {filtered.length} records
            </p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 7 }}>
            <thead>
              <tr style={{ background: '#4A4284', color: '#fff' }}>
                {[
                  'No.',
                  'Date Received',
                  'Date Assigned',
                  'DLPP Lawyer',
                  'Solicitor General',
                  'Private Law Firm',
                  "Defendant's Lawyer",
                  'Applicant',
                  'Defendant',
                  'Land Description',
                  'Title File Ref',
                  'Date of Letter',
                  'Summons Received',
                  'Consignment Note',
                  'Grounds',
                  'Court File Ref',
                  'Status',
                  'Comments',
                ].map((h) => (
                  <th key={h} style={{ border: '1px solid #cbd5e1', padding: '3px 4px', textAlign: 'left' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={a.id} style={{ background: i % 2 ? '#f5f7fa' : '#fff' }}>
                  <td style={{ border: '1px solid #cbd5e1', padding: '3px 4px' }}>{i + 1}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '3px 4px' }}>{fmt(a.date_received)}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '3px 4px' }}>{fmt(a.date_assigned_to_legal_officer)}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '3px 4px' }}>{a.dlpp_lawyer_in_carriage || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '3px 4px' }}>{a.solicitor_general_lawyer || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '3px 4px' }}>{a.private_law_firm || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '3px 4px' }}>{a.defendants_lawyer || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '3px 4px' }}>{a.applicant_registrar_of_titles || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '3px 4px' }}>{a.defendant || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '3px 4px' }}>{a.land_description || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '3px 4px' }}>{a.title_file_reference || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '3px 4px' }}>{fmt(a.letter_of_summons_date)}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '3px 4px' }}>{fmt(a.summons_date)}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '3px 4px' }}>{a.consignment_note || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '3px 4px' }}>{a.grounds_for_application || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '3px 4px' }}>{a.court_file_reference_no || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '3px 4px' }}>{a.status_of_matter || ''}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '3px 4px' }}>{a.comments_remarks || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
