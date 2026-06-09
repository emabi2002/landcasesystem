'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  FileText,
  Download,
  Search,
  X,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  Eye,
  Trash2,
  FolderOpen,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Save,
  Bookmark,
} from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Document {
  id: string;
  title: string;
  description: string | null;
  document_type: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_at: string;
  file_url: string | null;
  file_path: string | null;
  case_id: string;
  cases?: { case_number: string; title: string | null };
}

type TypeFilter = 'all' | string;

interface SavedFilter {
  id: string;
  name: string;
  filters: {
    searchQuery: string;
    typeFilter: TypeFilter;
    dateFrom: string;
    dateTo: string;
  };
}

const ITEMS_PER_PAGE_OPTIONS = [10, 15, 25, 50];
const DEFAULT_ITEMS_PER_PAGE = 15;

const STORAGE_KEY = 'documents_saved_filters';
const ITEMS_PER_PAGE_KEY = 'documents_items_per_page';

// Default saved filters
const DEFAULT_FILTERS: SavedFilter[] = [
  { id: 'pleadings', name: 'Pleadings Only', filters: { searchQuery: '', typeFilter: 'pleading', dateFrom: '', dateTo: '' } },
  { id: 'evidence', name: 'Evidence Only', filters: { searchQuery: '', typeFilter: 'evidence', dateFrom: '', dateTo: '' } },
  { id: 'court_orders', name: 'Court Orders', filters: { searchQuery: '', typeFilter: 'court_order', dateFrom: '', dateTo: '' } },
  { id: 'recent', name: 'Recent (This Month)', filters: { searchQuery: '', typeFilter: 'all', dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], dateTo: '' } },
];

export default function DocumentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

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
    checkAuth();
    loadDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [searchQuery, typeFilter, documents, dateFrom, dateTo]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('documents_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDocuments(prev => [payload.new as Document, ...prev]);
            toast.info('New document uploaded');
          } else if (payload.eventType === 'UPDATE') {
            setDocuments(prev => prev.map(d => d.id === payload.new.id ? payload.new as Document : d));
          } else if (payload.eventType === 'DELETE') {
            setDocuments(prev => prev.filter(d => d.id !== payload.old.id));
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

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*, cases(case_number, title)')
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    toast.success('Documents refreshed');
  };

  const filterDocuments = () => {
    let filtered = [...documents];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.cases?.case_number.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(d => d.document_type === typeFilter);
    }

    if (dateFrom) {
      const fromDate = startOfDay(parseISO(dateFrom));
      filtered = filtered.filter(d => isAfter(new Date(d.uploaded_at), fromDate) || new Date(d.uploaded_at).getTime() === fromDate.getTime());
    }

    if (dateTo) {
      const toDate = endOfDay(parseISO(dateTo));
      filtered = filtered.filter(d => isBefore(new Date(d.uploaded_at), toDate) || new Date(d.uploaded_at).getTime() === toDate.getTime());
    }

    setFilteredDocuments(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const applyPreset = (preset: SavedFilter) => {
    setSearchQuery(preset.filters.searchQuery);
    setTypeFilter(preset.filters.typeFilter);
    setDateFrom(preset.filters.dateFrom);
    setDateTo(preset.filters.dateTo);
  };

  const saveCurrentFilter = () => {
    if (!filterName.trim()) {
      toast.error('Please enter a filter name');
      return;
    }
    const newFilter: SavedFilter = {
      id: `custom_${Date.now()}`,
      name: filterName,
      filters: { searchQuery, typeFilter, dateFrom, dateTo },
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

  const hasActiveFilters = searchQuery || typeFilter !== 'all' || dateFrom || dateTo;

  const handleDeleteDocument = async (doc: Document) => {
    try {
      setDeletingDocId(doc.id);
      // Delete from storage if file_path exists
      if (doc.file_path) {
        await supabase.storage.from('case-documents').remove([doc.file_path]);
      }
      const { error } = await supabase.from('documents').delete().eq('id', doc.id);
      if (error) throw error;
      toast.success('Document deleted successfully');
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(doc.id);
        return newSet;
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      // Delete files from storage first
      const docsToDelete = documents.filter(d => selectedIds.has(d.id) && d.file_path);
      if (docsToDelete.length > 0) {
        await supabase.storage.from('case-documents').remove(docsToDelete.map(d => d.file_path!));
      }

      const { error } = await supabase.from('documents').delete().in('id', Array.from(selectedIds));
      if (error) throw error;
      toast.success(`${selectedIds.size} documents deleted successfully`);
      setDocuments(prev => prev.filter(d => !selectedIds.has(d.id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Failed to delete documents');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    if (doc.file_path) {
      const { data } = supabase.storage.from('case-documents').getPublicUrl(doc.file_path);
      if (data?.publicUrl) {
        window.open(data.publicUrl, '_blank');
        toast.success('Opening document...');
      }
    } else if (doc.file_url) {
      window.open(doc.file_url, '_blank');
    } else {
      toast.error('No file available');
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const paginatedDocuments = filteredDocuments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Bulk selection helpers
  const allOnPageSelected = paginatedDocuments.length > 0 && paginatedDocuments.every(d => selectedIds.has(d.id));
  const someOnPageSelected = paginatedDocuments.some(d => selectedIds.has(d.id));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        paginatedDocuments.forEach(d => newSet.delete(d.id));
        return newSet;
      });
    } else {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        paginatedDocuments.forEach(d => newSet.add(d.id));
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

  // Type counts
  const typeCounts = documents.reduce((acc, doc) => {
    acc[doc.document_type] = (acc[doc.document_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      pleading: 'Pleading', evidence: 'Evidence', survey_report: 'Survey Report',
      title_document: 'Title Document', correspondence: 'Correspondence',
      court_order: 'Court Order', photo: 'Photo', other: 'Other'
    };
    return types[type] || type;
  };

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      pleading: 'bg-blue-100 text-blue-800', evidence: 'bg-purple-100 text-purple-800',
      survey_report: 'bg-green-100 text-green-800', title_document: 'bg-orange-100 text-orange-800',
      correspondence: 'bg-yellow-100 text-yellow-800', court_order: 'bg-red-100 text-red-800',
      photo: 'bg-pink-100 text-pink-800', other: 'bg-slate-100 text-slate-800'
    };
    return colors[type] || colors.other;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
  };

  // Export functions
  const exportToExcel = () => {
    setExporting(true);
    try {
      const exportData = filteredDocuments.map(d => ({
        'Title': d.title,
        'Description': d.description || '',
        'Type': getDocumentTypeLabel(d.document_type),
        'Case': d.cases?.case_number || 'N/A',
        'File Type': d.file_type || 'N/A',
        'Size': formatFileSize(d.file_size),
        'Uploaded': format(new Date(d.uploaded_at), 'yyyy-MM-dd'),
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Documents');
      XLSX.writeFile(wb, `documents_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast.success(`Exported ${filteredDocuments.length} documents`);
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
      doc.text('DLPP Legal Case Management - Documents Report', 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')} | Total: ${filteredDocuments.length} documents`, 14, 22);

      const tableData = filteredDocuments.map(d => [
        d.title.substring(0, 30),
        getDocumentTypeLabel(d.document_type),
        d.cases?.case_number || '-',
        d.file_type || '-',
        formatFileSize(d.file_size),
        format(new Date(d.uploaded_at), 'yyyy-MM-dd'),
      ]);

      (autoTable as any)(doc, {
        startY: 28,
        head: [['Title', 'Type', 'Case', 'File Type', 'Size', 'Uploaded']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [139, 35, 50] },
      });

      doc.save(`documents_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success(`Exported ${filteredDocuments.length} documents`);
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
      <!DOCTYPE html><html><head><title>Documents Report</title>
      <style>
        body{font-family:Arial,sans-serif;margin:20px;font-size:11px}
        h1{color:#8B2332;font-size:18px;margin-bottom:5px}
        .meta{color:#666;margin-bottom:15px}
        table{width:100%;border-collapse:collapse}
        th{background:#8B2332;color:white;padding:6px;text-align:left}
        td{padding:6px;border-bottom:1px solid #ddd}
        tr:nth-child(even){background:#f9f9f9}
      </style></head><body>
      <h1>DLPP Legal Case Management - Documents</h1>
      <div class="meta">Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')} | Total: ${filteredDocuments.length} documents</div>
      <table><thead><tr><th>Title</th><th>Type</th><th>Case</th><th>File Type</th><th>Uploaded</th></tr></thead>
      <tbody>${filteredDocuments.map(d => `<tr><td>${d.title}</td><td>${getDocumentTypeLabel(d.document_type)}</td><td>${d.cases?.case_number || '-'}</td><td>${d.file_type || '-'}</td><td>${format(new Date(d.uploaded_at), 'yyyy-MM-dd')}</td></tr>`).join('')}</tbody></table>
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
            <p className="mt-4 text-slate-600">Loading documents...</p>
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
              <FileText className="h-5 w-5 text-slate-600" />
              <div className="h-6 w-px bg-slate-300" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Documents</h1>
                <p className="text-xs text-slate-500">
                  {filteredDocuments.length} of {documents.length} documents
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
                  <Button variant="outline" size="sm" disabled={exporting || filteredDocuments.length === 0}>
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
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="sticky top-[73px] z-10 bg-emerald-600 text-white px-6 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <span className="text-sm font-medium">{selectedIds.size} document(s) selected</span>
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
                      <AlertDialogTitle>Delete {selectedIds.size} Documents</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedIds.size} documents? This will also remove the files from storage. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                        Delete {selectedIds.size} Documents
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
                  <span className="font-semibold text-slate-800">{documents.length}</span> Total
                </span>
                <span className="text-slate-600">
                  <span className="font-semibold text-blue-600">{typeCounts.pleading || 0}</span> Pleadings
                </span>
                <span className="text-slate-600">
                  <span className="font-semibold text-purple-600">{typeCounts.evidence || 0}</span> Evidence
                </span>
                <span className="text-slate-600">
                  <span className="font-semibold text-red-600">{typeCounts.court_order || 0}</span> Court Orders
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
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {/* Search */}
                <div className="col-span-2">
                  <Label className="text-xs text-slate-600">Search</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Title, description, case number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-9"
                    />
                  </div>
                </div>

                {/* Type */}
                <div>
                  <Label className="text-xs text-slate-600">Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="pleading">Pleading</SelectItem>
                      <SelectItem value="evidence">Evidence</SelectItem>
                      <SelectItem value="survey_report">Survey Report</SelectItem>
                      <SelectItem value="title_document">Title Document</SelectItem>
                      <SelectItem value="correspondence">Correspondence</SelectItem>
                      <SelectItem value="court_order">Court Order</SelectItem>
                      <SelectItem value="photo">Photo</SelectItem>
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
              </div>
            </div>

            {/* Documents Table */}
            <div className="overflow-x-auto">
              {paginatedDocuments.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">
                    {documents.length === 0 ? 'No documents uploaded yet' : 'No documents match your filters'}
                  </p>
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
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Document</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Case</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">File</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Uploaded</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDocuments.map((doc) => (
                      <tr
                        key={doc.id}
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${selectedIds.has(doc.id) ? 'bg-emerald-50' : ''}`}
                      >
                        <td className="py-3 px-4">
                          <Checkbox
                            checked={selectedIds.has(doc.id)}
                            onCheckedChange={() => toggleSelect(doc.id)}
                            className="data-[state=checked]:bg-emerald-600"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded bg-blue-50">
                              <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">{doc.title}</div>
                              {doc.description && (
                                <p className="text-xs text-slate-500 truncate max-w-xs">{doc.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`${getDocumentTypeColor(doc.document_type)} text-xs font-medium`}>
                            {getDocumentTypeLabel(doc.document_type)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {doc.cases ? (
                            <Link href={`/cases/${doc.case_id}`} className="text-xs font-mono hover:text-emerald-600">
                              {doc.cases.case_number}
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          <div>{doc.file_type || '-'}</div>
                          <div className="text-slate-400">{formatFileSize(doc.file_size)}</div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          {format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleDownload(doc)}
                              title="Download"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Link href={`/cases/${doc.case_id}?tab=documents`}>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="View Case">
                                <FolderOpen className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" disabled={deletingDocId === doc.id}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Delete <strong>{doc.title}</strong>? This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteDocument(doc)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
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
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredDocuments.length)} of {filteredDocuments.length} documents
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
            {filteredDocuments.length > 0 && totalPages <= 1 && (
              <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
                <span>Showing {filteredDocuments.length} of {documents.length} documents</span>
                <span>Upload documents from case pages</span>
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
