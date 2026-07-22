'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { logAudit } from '@/lib/permissions';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  X,
  ChevronDown,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Filter,
  Save,
  Bookmark,
} from 'lucide-react';
import Link from 'next/link';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type CaseStatus = 'under_review' | 'in_court' | 'mediation' | 'tribunal' | 'judgment' | 'closed' | 'settled' | string;
type CaseType = 'dispute' | 'court_matter' | 'title_claim' | 'administrative_review' | 'other' | string;
type CasePriority = 'low' | 'medium' | 'high' | 'urgent' | string;

interface CaseRow {
  id: string;
  case_number: string;
  title: string | null;
  description?: string | null;
  status: CaseStatus;
  case_type: CaseType;
  priority?: CasePriority | null;
  region?: string | null;
  created_at: string;
  dlpp_action_officer?: string | null;
}

interface SavedFilter {
  id: string;
  name: string;
  filters: {
    searchQuery: string;
    statusFilter: string;
    typeFilter: string;
    dateFrom: string;
    dateTo: string;
    regionFilter: string;
    priorityFilter: string;
  };
}

type StatusFilter = 'all' | 'active' | CaseStatus;
type TypeFilter = 'all' | CaseType;

const ITEMS_PER_PAGE_OPTIONS = [10, 15, 25, 50];
const DEFAULT_ITEMS_PER_PAGE = 15;

const STORAGE_KEY = 'cases_saved_filters';
const ITEMS_PER_PAGE_KEY = 'cases_items_per_page';

// Default saved filters
const DEFAULT_FILTERS: SavedFilter[] = [
  { id: 'active', name: 'Active Cases', filters: { searchQuery: '', statusFilter: 'active', typeFilter: 'all', dateFrom: '', dateTo: '', regionFilter: 'all', priorityFilter: 'all' } },
  { id: 'urgent', name: 'Urgent Priority', filters: { searchQuery: '', statusFilter: 'active', typeFilter: 'all', dateFrom: '', dateTo: '', regionFilter: 'all', priorityFilter: 'urgent' } },
  { id: 'in_court', name: 'In Court', filters: { searchQuery: '', statusFilter: 'in_court', typeFilter: 'all', dateFrom: '', dateTo: '', regionFilter: 'all', priorityFilter: 'all' } },
  { id: 'closed', name: 'Closed Cases', filters: { searchQuery: '', statusFilter: 'closed', typeFilter: 'all', dateFrom: '', dateTo: '', regionFilter: 'all', priorityFilter: 'all' } },
];

export default function CasesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [filteredCases, setFilteredCases] = useState<CaseRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [showClosed, setShowClosed] = useState(false);
  const [deletingCaseId, setDeletingCaseId] = useState<string | null>(null);

  // Advanced filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const [exporting, setExporting] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);

  // Saved filters
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(DEFAULT_FILTERS);
  const [filterName, setFilterName] = useState('');
  const [showSaveFilter, setShowSaveFilter] = useState(false);

  // Load saved filters and preferences from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSavedFilters([...DEFAULT_FILTERS, ...parsed]);
      } catch {
        // Ignore parse errors
      }
    }
    const storedItemsPerPage = localStorage.getItem(ITEMS_PER_PAGE_KEY);
    if (storedItemsPerPage) {
      setItemsPerPage(parseInt(storedItemsPerPage, 10));
    }
  }, []);

  useEffect(() => {
    void checkAuth();
    void loadCases();
  }, []);

  useEffect(() => {
    filterCases();
    setCurrentPage(1); // Reset to page 1 when filters change
    setSelectedIds(new Set()); // Clear selection when filters change
  }, [searchQuery, statusFilter, typeFilter, cases, showClosed, dateFrom, dateTo, regionFilter, priorityFilter]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('cases_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cases' },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (payload.eventType === 'INSERT') {
            setCases(prev => [payload.new as unknown as CaseRow, ...prev]);
            toast.info('New case registered');
          } else if (payload.eventType === 'UPDATE') {
            setCases(prev => prev.map(c => c.id === payload.new.id ? payload.new as unknown as CaseRow : c));
          } else if (payload.eventType === 'DELETE') {
            setCases(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/login?redirectedFrom=/cases');
  };

  const loadCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases((data as CaseRow[]) ?? []);
    } catch (error) {
      console.error('Error loading cases:', error);
      toast.error('Failed to load cases');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCases();
    toast.success('Cases refreshed');
  };

  const handleDeleteCase = async (caseId: string) => {
    try {
      setDeletingCaseId(caseId);
      const { error } = await supabase.from('cases').delete().eq('id', caseId);
      if (error) throw error;
      await logAudit('delete', 'cases', caseId, 'case', {
        case_number: cases.find(c => c.id === caseId)?.case_number,
      });
      toast.success('Case deleted successfully');
      setCases(prev => prev.filter(c => c.id !== caseId));
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(caseId);
        return newSet;
      });
    } catch (error) {
      console.error('Error deleting case:', error);
      toast.error('Failed to delete case');
    } finally {
      setDeletingCaseId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      const idsToDelete = Array.from(selectedIds);
      const { error } = await supabase.from('cases').delete().in('id', idsToDelete);
      if (error) throw error;
      await logAudit('delete', 'cases', undefined, 'case', {
        bulk: true,
        count: idsToDelete.length,
        ids: idsToDelete,
      });
      toast.success(`${selectedIds.size} cases deleted successfully`);
      setCases(prev => prev.filter(c => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Failed to delete cases');
    } finally {
      setBulkDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('active');
    setTypeFilter('all');
    setDateFrom('');
    setDateTo('');
    setRegionFilter('all');
    setPriorityFilter('all');
    setShowClosed(false);
  };

  const applyPreset = (preset: SavedFilter) => {
    setSearchQuery(preset.filters.searchQuery);
    setStatusFilter(preset.filters.statusFilter as StatusFilter);
    setTypeFilter(preset.filters.typeFilter as TypeFilter);
    setDateFrom(preset.filters.dateFrom);
    setDateTo(preset.filters.dateTo);
    setRegionFilter(preset.filters.regionFilter);
    setPriorityFilter(preset.filters.priorityFilter);
  };

  const saveCurrentFilter = () => {
    if (!filterName.trim()) {
      toast.error('Please enter a filter name');
      return;
    }
    const newFilter: SavedFilter = {
      id: `custom_${Date.now()}`,
      name: filterName,
      filters: { searchQuery, statusFilter, typeFilter, dateFrom, dateTo, regionFilter, priorityFilter },
    };
    const customFilters = savedFilters.filter(f => f.id.startsWith('custom_'));
    const updatedCustomFilters = [...customFilters, newFilter];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustomFilters));
    setSavedFilters([...DEFAULT_FILTERS, ...updatedCustomFilters]);
    setFilterName('');
    setShowSaveFilter(false);
    toast.success(`Filter "${filterName}" saved`);
  };

  const handleItemsPerPageChange = (value: string) => {
    const newValue = parseInt(value, 10);
    setItemsPerPage(newValue);
    setCurrentPage(1);
    localStorage.setItem(ITEMS_PER_PAGE_KEY, value);
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'active' || typeFilter !== 'all' || dateFrom || dateTo || regionFilter !== 'all' || priorityFilter !== 'all';

  const filterCases = () => {
    let filtered = [...cases];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        (c.title ?? '').toLowerCase().includes(q) ||
        (c.case_number ?? '').toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q)
      );
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter(c => c.status !== 'closed');
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (!showClosed && statusFilter === 'all') {
      filtered = filtered.filter(c => c.status !== 'closed');
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(c => c.case_type === typeFilter);
    }

    if (dateFrom) {
      const fromDate = startOfDay(parseISO(dateFrom));
      filtered = filtered.filter(c => isAfter(new Date(c.created_at), fromDate) || new Date(c.created_at).getTime() === fromDate.getTime());
    }

    if (dateTo) {
      const toDate = endOfDay(parseISO(dateTo));
      filtered = filtered.filter(c => isBefore(new Date(c.created_at), toDate) || new Date(c.created_at).getTime() === toDate.getTime());
    }

    if (regionFilter !== 'all') {
      filtered = filtered.filter(c => c.region === regionFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(c => c.priority === priorityFilter);
    }

    setFilteredCases(filtered);
  };

  // Pagination
  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const paginatedCases = filteredCases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Bulk selection helpers
  const allOnPageSelected = paginatedCases.length > 0 && paginatedCases.every(c => selectedIds.has(c.id));
  const someOnPageSelected = paginatedCases.some(c => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        paginatedCases.forEach(c => newSet.delete(c.id));
        return newSet;
      });
    } else {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        paginatedCases.forEach(c => newSet.add(c.id));
        return newSet;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Get unique regions from cases
  const uniqueRegions = [...new Set(cases.map(c => c.region).filter(Boolean))] as string[];

  // Export functions
  const exportToExcel = () => {
    setExporting(true);
    try {
      const exportData = filteredCases.map(c => ({
        'Case Number': c.case_number,
        'Title': c.title || 'Untitled',
        'Status': getStatusLabel(c.status),
        'Type': getTypeLabel(c.case_type),
        'Priority': c.priority || 'N/A',
        'Region': c.region || 'N/A',
        'Officer': c.dlpp_action_officer || 'N/A',
        'Created': format(new Date(c.created_at), 'yyyy-MM-dd'),
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Cases');
      XLSX.writeFile(wb, `cases_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast.success(`Exported ${filteredCases.length} cases`);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF('landscape');
      doc.setFontSize(16);
      doc.text('DLPP Legal Case Management - Case Report', 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')} | Total: ${filteredCases.length} cases`, 14, 22);

      const tableData = filteredCases.map(c => [
        c.case_number,
        (c.title || 'Untitled').substring(0, 25),
        getStatusLabel(c.status),
        getTypeLabel(c.case_type),
        c.priority || '-',
        c.region || '-',
        format(new Date(c.created_at), 'yyyy-MM-dd'),
      ]);

      (autoTable as any)(doc, {
        startY: 28,
        head: [['Case #', 'Title', 'Status', 'Type', 'Priority', 'Region', 'Created']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [139, 35, 50] },
      });

      doc.save(`cases_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success(`Exported ${filteredCases.length} cases`);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Cases Report</title>
      <style>
        body{font-family:Arial,sans-serif;margin:20px;font-size:11px}
        h1{color:#8B2332;font-size:18px;margin-bottom:5px}
        .meta{color:#666;margin-bottom:15px}
        table{width:100%;border-collapse:collapse}
        th{background:#8B2332;color:white;padding:6px;text-align:left}
        td{padding:6px;border-bottom:1px solid #ddd}
        tr:nth-child(even){background:#f9f9f9}
      </style></head><body>
      <h1>DLPP Legal Case Management</h1>
      <div class="meta">Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')} | Total: ${filteredCases.length} cases</div>
      <table><thead><tr><th>Case #</th><th>Title</th><th>Status</th><th>Type</th><th>Priority</th><th>Region</th><th>Created</th></tr></thead>
      <tbody>${filteredCases.map(c => `<tr><td>${c.case_number}</td><td>${c.title || 'Untitled'}</td><td>${getStatusLabel(c.status)}</td><td>${getTypeLabel(c.case_type)}</td><td>${c.priority || '-'}</td><td>${c.region || '-'}</td><td>${format(new Date(c.created_at), 'yyyy-MM-dd')}</td></tr>`).join('')}</tbody></table>
      <script>window.onload=function(){window.print()}</script></body></html>
    `);
    printWindow.document.close();
  };

  const getStatusLabel = (status: CaseStatus): string => {
    const labels: Record<string, string> = {
      under_review: 'Under Review', in_court: 'In Court', mediation: 'Mediation',
      tribunal: 'Tribunal', judgment: 'Judgment', closed: 'Closed', settled: 'Settled',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: CaseStatus): string => {
    const colors: Record<string, string> = {
      under_review: 'bg-yellow-100 text-yellow-800',
      in_court: 'bg-blue-100 text-blue-800',
      mediation: 'bg-purple-100 text-purple-800',
      tribunal: 'bg-orange-100 text-orange-800',
      judgment: 'bg-indigo-100 text-indigo-800',
      closed: 'bg-gray-100 text-gray-800',
      settled: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority?: CasePriority | null): string => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-blue-100 text-blue-700',
      low: 'bg-slate-100 text-slate-700',
    };
    return priority ? colors[priority] || 'bg-gray-100 text-gray-700' : '';
  };

  const getTypeLabel = (caseType: CaseType): string => {
    const labels: Record<string, string> = {
      dispute: 'Dispute', court_matter: 'Court Matter', title_claim: 'Title Claim',
      administrative_review: 'Admin Review', other: 'Other',
    };
    return labels[caseType] || caseType;
  };

  const activeCasesCount = cases.filter(c => c.status !== 'closed').length;
  const closedCasesCount = cases.filter(c => c.status === 'closed').length;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto" />
            <p className="mt-4 text-slate-600">Loading cases...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">
        {/* Sticky Header Bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FolderOpen className="h-5 w-5 text-slate-600" />
              <div className="h-6 w-px bg-slate-300" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">All Cases</h1>
                <p className="text-xs text-slate-500">
                  {filteredCases.length} of {cases.length} cases
                  {statusFilter === 'active' && ' (active only)'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Saved Filters */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Bookmark className="h-4 w-4 mr-1" />
                    Presets
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {savedFilters.map((preset) => (
                    <DropdownMenuItem key={preset.id} onClick={() => applyPreset(preset)}>
                      <Filter className="h-4 w-4 mr-2" />
                      {preset.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowSaveFilter(true)}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Current Filters
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button data-tour="cases-export" variant="outline" size="sm" disabled={exporting || filteredCases.length === 0}>
                    <Download className="h-4 w-4 mr-1" />
                    Export
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToExcel}><FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />Excel</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF}><FileText className="h-4 w-4 mr-2 text-red-600" />PDF</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Print</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>

              <Link href="/cases/new" data-tour="cases-new">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-1" />
                  New Case
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="sticky top-[73px] z-10 bg-emerald-600 text-white px-6 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <span className="text-sm font-medium">{selectedIds.size} case(s) selected</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => setSelectedIds(new Set())}>
                  Clear Selection
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" disabled={bulkDeleting}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete Selected
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {selectedIds.size} Cases</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedIds.size} cases? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                        Delete {selectedIds.size} Cases
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">

            {/* Summary Bar */}
            <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm">
                <span className="text-slate-600">
                  <span className="font-semibold text-emerald-600">{activeCasesCount}</span> Active
                </span>
                <span className="text-slate-600">
                  <span className="font-semibold text-gray-600">{closedCasesCount}</span> Closed
                </span>
                <span className="text-slate-600">
                  <span className="font-semibold text-yellow-600">{cases.filter(c => c.status === 'under_review').length}</span> Under Review
                </span>
                <span className="text-slate-600">
                  <span className="font-semibold text-blue-600">{cases.filter(c => c.status === 'in_court').length}</span> In Court
                </span>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 hover:text-slate-700 h-7">
                  <X className="h-3 w-3 mr-1" />Clear Filters
                </Button>
              )}
            </div>

            {/* Filters Section */}
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Search & Filters</h2>
              <div data-tour="cases-filters" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {/* Search */}
                <div data-tour="cases-search" className="col-span-2">
                  <Label className="text-xs text-slate-600">Search</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Case #, title, description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-9"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <Label className="text-xs text-slate-600">Status</Label>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="in_court">In Court</SelectItem>
                      <SelectItem value="mediation">Mediation</SelectItem>
                      <SelectItem value="tribunal">Tribunal</SelectItem>
                      <SelectItem value="judgment">Judgment</SelectItem>
                      <SelectItem value="settled">Settled</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type */}
                <div>
                  <Label className="text-xs text-slate-600">Type</Label>
                  <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="dispute">Dispute</SelectItem>
                      <SelectItem value="court_matter">Court Matter</SelectItem>
                      <SelectItem value="title_claim">Title Claim</SelectItem>
                      <SelectItem value="administrative_review">Admin Review</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date From */}
                <div>
                  <Label className="text-xs text-slate-600">From</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1 h-9" />
                </div>

                {/* Date To */}
                <div>
                  <Label className="text-xs text-slate-600">To</Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1 h-9" />
                </div>

                {/* Region */}
                <div>
                  <Label className="text-xs text-slate-600">Region</Label>
                  <Select value={regionFilter} onValueChange={setRegionFilter}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      {uniqueRegions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Include Closed checkbox */}
              {statusFilter === 'all' && (
                <div className="flex items-center gap-2 mt-3">
                  <Checkbox id="showClosed" checked={showClosed} onCheckedChange={(c) => setShowClosed(c === true)} />
                  <Label htmlFor="showClosed" className="text-xs text-slate-600 cursor-pointer">Include closed cases</Label>
                </div>
              )}
            </div>

            {/* Cases Table */}
            <div className="overflow-x-auto">
              {paginatedCases.length === 0 ? (
                <div className="p-12 text-center">
                  <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">
                    {cases.length === 0 ? 'No cases registered yet' : 'No cases match your filters'}
                  </p>
                  {cases.length === 0 && (
                    <Link href="/cases/new">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="h-4 w-4 mr-1" />Register First Case
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <table data-tour="cases-table" className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="py-3 px-4 w-10">
                        <Checkbox
                          checked={allOnPageSelected}
                          onCheckedChange={toggleSelectAll}
                          className="data-[state=checked]:bg-emerald-600"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Case #</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Title</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Priority</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Region</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Created</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCases.map((c) => (
                      <tr
                        key={c.id}
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${c.status === 'closed' ? 'bg-gray-50/50 text-slate-500' : ''} ${selectedIds.has(c.id) ? 'bg-emerald-50' : ''}`}
                      >
                        <td className="py-3 px-4">
                          <Checkbox
                            checked={selectedIds.has(c.id)}
                            onCheckedChange={() => toggleSelect(c.id)}
                            className="data-[state=checked]:bg-emerald-600"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/cases/${c.id}`} className="font-mono text-xs hover:text-emerald-600">
                            {c.case_number}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/cases/${c.id}`} className="hover:text-emerald-600 font-medium">
                            {c.title || 'Untitled Case'}
                          </Link>
                          {c.description && (
                            <p className="text-xs text-slate-500 truncate max-w-xs">{c.description}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`${getStatusColor(c.status)} text-xs font-medium`}>
                            {getStatusLabel(c.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-xs">{getTypeLabel(c.case_type)}</td>
                        <td className="py-3 px-4">
                          {c.priority && (
                            <Badge variant="outline" className={`${getPriorityColor(c.priority)} text-xs`}>
                              {c.priority}
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-xs">{c.region || '-'}</td>
                        <td className="py-3 px-4 text-slate-600 text-xs">{format(new Date(c.created_at), 'MMM dd, yyyy')}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/cases/${c.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            {c.status !== 'closed' && (
                              <Link href={`/cases/${c.id}`}>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" disabled={deletingCaseId === c.id}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Case</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Delete <strong>{c.case_number}</strong>? This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteCase(c.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-slate-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCases.length)} of {filteredCases.length} cases
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Per page:</span>
                    <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                      <SelectTrigger className="w-16 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ITEMS_PER_PAGE_OPTIONS.map(opt => (
                          <SelectItem key={opt} value={opt.toString()}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-8 w-8 p-0 ${currentPage === pageNum ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Footer */}
            {filteredCases.length > 0 && totalPages <= 1 && (
              <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
                <span>Showing {filteredCases.length} of {cases.length} cases</span>
                <span>Click on a case to view details</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Filter Dialog */}
      <AlertDialog open={showSaveFilter} onOpenChange={setShowSaveFilter}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Filter Preset</AlertDialogTitle>
            <AlertDialogDescription>
              Save your current filter settings for quick access later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label className="text-sm">Filter Name</Label>
            <Input
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="e.g., My Custom Filter"
              className="mt-1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFilterName('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={saveCurrentFilter} className="bg-emerald-600 hover:bg-emerald-700">
              Save Filter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
