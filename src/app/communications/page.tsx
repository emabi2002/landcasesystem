/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  DropdownMenuSeparator,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  Clock,
  Trash2,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronDown,
  X,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Save,
  Bookmark,
} from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';
import { toast } from 'sonner';
import { AddCommunicationDialog } from '@/components/forms/AddCommunicationDialog';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Communication {
  id: string;
  communication_type: string;
  direction: string;
  party_type: string;
  party_name: string | null;
  subject: string;
  communication_date: string;
  response_required: boolean;
  response_status: string;
}

type DirectionFilter = 'all' | 'incoming' | 'outgoing';

interface SavedFilter {
  id: string;
  name: string;
  filters: {
    searchQuery: string;
    directionFilter: DirectionFilter;
    dateFrom: string;
    dateTo: string;
    responseFilter: string;
  };
}

const ITEMS_PER_PAGE_OPTIONS = [10, 15, 25, 50];
const DEFAULT_ITEMS_PER_PAGE = 15;

// Default saved filters
const DEFAULT_FILTERS: SavedFilter[] = [
  { id: 'incoming', name: 'Incoming Only', filters: { searchQuery: '', directionFilter: 'incoming', dateFrom: '', dateTo: '', responseFilter: 'all' } },
  { id: 'outgoing', name: 'Outgoing Only', filters: { searchQuery: '', directionFilter: 'outgoing', dateFrom: '', dateTo: '', responseFilter: 'all' } },
  { id: 'pending', name: 'Pending Response', filters: { searchQuery: '', directionFilter: 'all', dateFrom: '', dateTo: '', responseFilter: 'pending' } },
  { id: 'recent', name: 'This Month', filters: { searchQuery: '', directionFilter: 'all', dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], dateTo: '', responseFilter: 'all' } },
];

const STORAGE_KEY = 'communications_saved_filters';
const ITEMS_PER_PAGE_KEY = 'communications_items_per_page';

export default function CommunicationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [filteredCommunications, setFilteredCommunications] = useState<Communication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [responseFilter, setResponseFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
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
    void loadCommunications();
  }, []);

  useEffect(() => {
    filterCommunications();
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [searchQuery, directionFilter, communications, dateFrom, dateTo, responseFilter]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('communications_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'communications' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCommunications(prev => [payload.new as Communication, ...prev]);
            toast.info('New communication received');
          } else if (payload.eventType === 'UPDATE') {
            setCommunications(prev => prev.map(c => c.id === payload.new.id ? payload.new as Communication : c));
          } else if (payload.eventType === 'DELETE') {
            setCommunications(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/login');
  };

  const loadCommunications = async () => {
    try {
      const { data, error } = await supabase
        .from('communications')
        .select('*')
        .order('communication_date', { ascending: false });

      if (error) throw error;
      setCommunications(data || []);
    } catch (error) {
      console.error('Error loading communications:', error);
      toast.error('Failed to load communications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCommunications();
    toast.success('Communications refreshed');
  };

  const filterCommunications = () => {
    let filtered = [...communications];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.subject.toLowerCase().includes(q) ||
        c.party_name?.toLowerCase().includes(q) ||
        c.party_type.toLowerCase().includes(q)
      );
    }

    if (directionFilter !== 'all') {
      filtered = filtered.filter(c => c.direction === directionFilter);
    }

    if (responseFilter === 'pending') {
      filtered = filtered.filter(c => c.response_required && c.response_status === 'pending');
    } else if (responseFilter === 'responded') {
      filtered = filtered.filter(c => c.response_required && c.response_status === 'responded');
    }

    if (dateFrom) {
      const fromDate = startOfDay(parseISO(dateFrom));
      filtered = filtered.filter(c => isAfter(new Date(c.communication_date), fromDate) || new Date(c.communication_date).getTime() === fromDate.getTime());
    }

    if (dateTo) {
      const toDate = endOfDay(parseISO(dateTo));
      filtered = filtered.filter(c => isBefore(new Date(c.communication_date), toDate) || new Date(c.communication_date).getTime() === toDate.getTime());
    }

    setFilteredCommunications(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDirectionFilter('all');
    setDateFrom('');
    setDateTo('');
    setResponseFilter('all');
  };

  const applyPreset = (preset: SavedFilter) => {
    setSearchQuery(preset.filters.searchQuery);
    setDirectionFilter(preset.filters.directionFilter);
    setDateFrom(preset.filters.dateFrom);
    setDateTo(preset.filters.dateTo);
    setResponseFilter(preset.filters.responseFilter);
  };

  const saveCurrentFilter = () => {
    if (!filterName.trim()) {
      toast.error('Please enter a filter name');
      return;
    }
    const newFilter: SavedFilter = {
      id: `custom_${Date.now()}`,
      name: filterName,
      filters: { searchQuery, directionFilter, dateFrom, dateTo, responseFilter },
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

  const hasActiveFilters = searchQuery || directionFilter !== 'all' || dateFrom || dateTo || responseFilter !== 'all';

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('communications')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast.success('Communication deleted successfully');
      setDeleteId(null);
      setCommunications(prev => prev.filter(c => c.id !== deleteId));
    } catch (error) {
      console.error('Error deleting communication:', error);
      toast.error('Failed to delete communication');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      const { error } = await supabase.from('communications').delete().in('id', Array.from(selectedIds));
      if (error) throw error;
      toast.success(`${selectedIds.size} communications deleted successfully`);
      setCommunications(prev => prev.filter(c => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Failed to delete communications');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkMarkResponded = async () => {
    if (selectedIds.size === 0) return;
    try {
      const { error } = await supabase
        .from('communications')
        .update({ response_status: 'responded' } as never)
        .in('id', Array.from(selectedIds));
      if (error) throw error;
      toast.success(`${selectedIds.size} communications marked as responded`);
      setSelectedIds(new Set());
      loadCommunications();
    } catch (error) {
      console.error('Error bulk updating:', error);
      toast.error('Failed to update communications');
    }
  };

  const markAsResponded = async (id: string) => {
    try {
      const { error } = await supabase
        .from('communications')
        .update({ response_status: 'responded' } as never)
        .eq('id', id);

      if (error) throw error;

      toast.success('Marked as responded');
      setCommunications(prev => prev.map(c => c.id === id ? { ...c, response_status: 'responded' } : c));
    } catch (error) {
      console.error('Error updating communication:', error);
      toast.error('Failed to update');
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredCommunications.length / itemsPerPage);
  const paginatedCommunications = filteredCommunications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Bulk selection helpers
  const allOnPageSelected = paginatedCommunications.length > 0 && paginatedCommunications.every(c => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        paginatedCommunications.forEach(c => newSet.delete(c.id));
        return newSet;
      });
    } else {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        paginatedCommunications.forEach(c => newSet.add(c.id));
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

  // Stats
  const totalCount = communications.length;
  const incomingCount = communications.filter(c => c.direction === 'incoming').length;
  const outgoingCount = communications.filter(c => c.direction === 'outgoing').length;
  const responseRequiredCount = communications.filter(c => c.response_required && c.response_status === 'pending').length;

  const getPartyTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      plaintiff: 'bg-blue-100 text-blue-800',
      defendant: 'bg-purple-100 text-purple-800',
      solicitor_general: 'bg-indigo-100 text-indigo-800',
      private_lawyer: 'bg-pink-100 text-pink-800',
      witness: 'bg-green-100 text-green-800',
      court: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return styles[type] || styles.other;
  };

  const getPartyTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Export functions
  const exportToExcel = () => {
    setExporting(true);
    try {
      const exportData = filteredCommunications.map(c => ({
        'Subject': c.subject,
        'Direction': c.direction,
        'Party Type': getPartyTypeLabel(c.party_type),
        'Party Name': c.party_name || 'N/A',
        'Type': c.communication_type,
        'Date': format(new Date(c.communication_date), 'yyyy-MM-dd'),
        'Response Required': c.response_required ? 'Yes' : 'No',
        'Status': c.response_status,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Communications');
      XLSX.writeFile(wb, `communications_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast.success(`Exported ${filteredCommunications.length} communications`);
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
      doc.text('DLPP Legal Case Management - Communications Report', 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')} | Total: ${filteredCommunications.length}`, 14, 22);

      const tableData = filteredCommunications.map(c => [
        c.subject.substring(0, 30),
        c.direction,
        getPartyTypeLabel(c.party_type),
        c.party_name || '-',
        format(new Date(c.communication_date), 'yyyy-MM-dd'),
        c.response_required ? 'Yes' : 'No',
      ]);

      (autoTable as any)(doc, {
        startY: 28,
        head: [['Subject', 'Direction', 'Party Type', 'Party Name', 'Date', 'Response Req']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [139, 35, 50] },
      });

      doc.save(`communications_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success(`Exported ${filteredCommunications.length} communications`);
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
      <!DOCTYPE html><html><head><title>Communications Report</title>
      <style>
        body{font-family:Arial,sans-serif;margin:20px;font-size:11px}
        h1{color:#8B2332;font-size:18px;margin-bottom:5px}
        .meta{color:#666;margin-bottom:15px}
        table{width:100%;border-collapse:collapse}
        th{background:#8B2332;color:white;padding:6px;text-align:left}
        td{padding:6px;border-bottom:1px solid #ddd}
        tr:nth-child(even){background:#f9f9f9}
      </style></head><body>
      <h1>DLPP Legal Case Management - Communications</h1>
      <div class="meta">Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')} | Total: ${filteredCommunications.length}</div>
      <table><thead><tr><th>Subject</th><th>Direction</th><th>Party</th><th>Date</th><th>Response</th></tr></thead>
      <tbody>${filteredCommunications.map(c => `<tr><td>${c.subject}</td><td>${c.direction}</td><td>${getPartyTypeLabel(c.party_type)}</td><td>${format(new Date(c.communication_date), 'yyyy-MM-dd')}</td><td>${c.response_required ? 'Required' : '-'}</td></tr>`).join('')}</tbody></table>
      <script>window.onload=function(){window.print()}</script></body></html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto" />
            <p className="mt-4 text-slate-600">Loading communications...</p>
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
              <MessageSquare className="h-5 w-5 text-slate-600" />
              <div className="h-6 w-px bg-slate-300" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Communications</h1>
                <p className="text-xs text-slate-500">
                  {filteredCommunications.length} of {communications.length} records
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
                  <Button variant="outline" size="sm" disabled={exporting || filteredCommunications.length === 0}>
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

              <Button onClick={() => setShowAddDialog(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-1" />
                Log Communication
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="sticky top-[73px] z-10 bg-emerald-600 text-white px-6 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <span className="text-sm font-medium">{selectedIds.size} communication(s) selected</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => setSelectedIds(new Set())}>
                  Clear Selection
                </Button>
                <Button size="sm" variant="secondary" onClick={handleBulkMarkResponded}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark Responded
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
                      <AlertDialogTitle>Delete {selectedIds.size} Communications</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedIds.size} communications? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                        Delete {selectedIds.size} Communications
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
                  <span className="font-semibold text-slate-800">{totalCount}</span> Total
                </span>
                <span className="text-slate-600">
                  <span className="font-semibold text-green-600">{incomingCount}</span> Incoming
                </span>
                <span className="text-slate-600">
                  <span className="font-semibold text-blue-600">{outgoingCount}</span> Outgoing
                </span>
                <span className="text-slate-600">
                  <span className="font-semibold text-orange-600">{responseRequiredCount}</span> Pending Response
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
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {/* Search */}
                <div className="col-span-2">
                  <Label className="text-xs text-slate-600">Search</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Subject, party name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-9"
                    />
                  </div>
                </div>

                {/* Direction */}
                <div>
                  <Label className="text-xs text-slate-600">Direction</Label>
                  <Select value={directionFilter} onValueChange={(v) => setDirectionFilter(v as DirectionFilter)}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="incoming">Incoming</SelectItem>
                      <SelectItem value="outgoing">Outgoing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Response Status */}
                <div>
                  <Label className="text-xs text-slate-600">Response</Label>
                  <Select value={responseFilter} onValueChange={setResponseFilter}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="responded">Responded</SelectItem>
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
              </div>
            </div>

            {/* Communications Table */}
            <div className="overflow-x-auto">
              {paginatedCommunications.length === 0 ? (
                <div className="p-12 text-center">
                  <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">
                    {communications.length === 0 ? 'No communications logged yet' : 'No communications match your filters'}
                  </p>
                  {communications.length === 0 && (
                    <Button onClick={() => setShowAddDialog(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="h-4 w-4 mr-1" />Log First Communication
                    </Button>
                  )}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="py-3 px-4 w-10">
                        <Checkbox
                          checked={allOnPageSelected}
                          onCheckedChange={toggleSelectAll}
                          className="data-[state=checked]:bg-emerald-600"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Subject</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Direction</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Party</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Response</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCommunications.map((comm) => (
                      <tr
                        key={comm.id}
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${selectedIds.has(comm.id) ? 'bg-emerald-50' : ''}`}
                      >
                        <td className="py-3 px-4">
                          <Checkbox
                            checked={selectedIds.has(comm.id)}
                            onCheckedChange={() => toggleSelect(comm.id)}
                            className="data-[state=checked]:bg-emerald-600"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{comm.subject}</div>
                          {comm.party_name && (
                            <p className="text-xs text-slate-500">{comm.party_name}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {comm.direction === 'incoming' ? (
                              <ArrowDown className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
                            )}
                            <span className="text-xs capitalize">{comm.direction}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`${getPartyTypeBadge(comm.party_type)} text-xs`}>
                            {getPartyTypeLabel(comm.party_type)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-xs capitalize">{comm.communication_type}</td>
                        <td className="py-3 px-4 text-slate-600 text-xs">
                          {format(new Date(comm.communication_date), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-3 px-4">
                          {comm.response_required ? (
                            comm.response_status === 'pending' ? (
                              <Badge className="bg-orange-100 text-orange-800 text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Responded
                              </Badge>
                            )
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            {comm.response_required && comm.response_status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => markAsResponded(comm.id)}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                <span className="text-xs">Done</span>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteId(comm.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCommunications.length)} of {filteredCommunications.length}
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
            {filteredCommunications.length > 0 && totalPages <= 1 && (
              <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
                <span>Showing {filteredCommunications.length} of {communications.length} communications</span>
                <span>Track all correspondence with parties and legal representatives</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddDialog && (
        <AddCommunicationDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={() => {
            setShowAddDialog(false);
            void loadCommunications();
          }}
        />
      )}

      {/* Delete Single Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Communication</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this communication log? This action cannot be undone.
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
