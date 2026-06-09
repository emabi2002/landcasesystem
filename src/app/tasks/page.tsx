'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckSquare,
  Plus,
  Clock,
  AlertCircle,
  Search,
  X,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Save,
  Bookmark,
} from 'lucide-react';
import { format, isPast, isToday, parseISO, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CaseSelector } from '@/components/forms/CaseSelector';

interface TaskType {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  status: string;
  priority?: string;
  assigned_to?: string;
  case_id?: string;
  cases?: { case_number: string; title: string };
}

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue';

interface SavedFilter {
  id: string;
  name: string;
  filters: {
    searchQuery: string;
    statusFilter: StatusFilter;
    dateFrom: string;
    dateTo: string;
    priorityFilter: string;
  };
}

const ITEMS_PER_PAGE_OPTIONS = [10, 15, 25, 50];
const DEFAULT_ITEMS_PER_PAGE = 15;

const STORAGE_KEY = 'tasks_saved_filters';
const ITEMS_PER_PAGE_KEY = 'tasks_items_per_page';

// Default saved filters
const DEFAULT_FILTERS: SavedFilter[] = [
  { id: 'overdue', name: 'Overdue Tasks', filters: { searchQuery: '', statusFilter: 'overdue', dateFrom: '', dateTo: '', priorityFilter: 'all' } },
  { id: 'pending', name: 'Pending Tasks', filters: { searchQuery: '', statusFilter: 'pending', dateFrom: '', dateTo: '', priorityFilter: 'all' } },
  { id: 'urgent', name: 'Urgent Priority', filters: { searchQuery: '', statusFilter: 'all', dateFrom: '', dateTo: '', priorityFilter: 'urgent' } },
  { id: 'completed', name: 'Completed Tasks', filters: { searchQuery: '', statusFilter: 'completed', dateFrom: '', dateTo: '', priorityFilter: 'all' } },
];

export default function TasksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

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

  // Task CRUD dialogs
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [savingTask, setSavingTask] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    status: 'pending',
    assigned_to: '',
    case_id: '',
  });

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
    loadTasks();
  }, []);

  useEffect(() => {
    filterTasks();
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [searchQuery, statusFilter, tasks, dateFrom, dateTo, priorityFilter]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('tasks_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [payload.new as TaskType, ...prev]);
            toast.info('New task created');
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new as TaskType : t));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
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

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, cases(title, case_number)')
        .order('due_date', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    toast.success('Tasks refreshed');
  };

  const getTaskStatus = (task: TaskType) => {
    if (task.status === 'completed') return 'completed';
    if (isPast(new Date(task.due_date)) && task.status !== 'completed') return 'overdue';
    if (task.status === 'in_progress') return 'in_progress';
    return 'pending';
  };

  const filterTasks = () => {
    let filtered = [...tasks];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.cases?.case_number.toLowerCase().includes(q) ||
        t.cases?.title.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => getTaskStatus(t) === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    if (dateFrom) {
      const fromDate = startOfDay(parseISO(dateFrom));
      filtered = filtered.filter(t => isAfter(new Date(t.due_date), fromDate) || new Date(t.due_date).getTime() === fromDate.getTime());
    }

    if (dateTo) {
      const toDate = endOfDay(parseISO(dateTo));
      filtered = filtered.filter(t => isBefore(new Date(t.due_date), toDate) || new Date(t.due_date).getTime() === toDate.getTime());
    }

    setFilteredTasks(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setPriorityFilter('all');
  };

  const applyPreset = (preset: SavedFilter) => {
    setSearchQuery(preset.filters.searchQuery);
    setStatusFilter(preset.filters.statusFilter);
    setDateFrom(preset.filters.dateFrom);
    setDateTo(preset.filters.dateTo);
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
      filters: { searchQuery, statusFilter, dateFrom, dateTo, priorityFilter },
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

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || dateFrom || dateTo || priorityFilter !== 'all';

  const handleDeleteTask = async (taskId: string) => {
    try {
      setDeletingTaskId(taskId);
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      toast.success('Task deleted successfully');
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      const { error } = await supabase.from('tasks').delete().in('id', Array.from(selectedIds));
      if (error) throw error;
      toast.success(`${selectedIds.size} tasks deleted successfully`);
      setTasks(prev => prev.filter(t => !selectedIds.has(t.id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Failed to delete tasks');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkComplete = async () => {
    if (selectedIds.size === 0) return;
    try {
      const { error } = await (supabase as any)
        .from('tasks')
        .update({ status: 'completed' })
        .in('id', Array.from(selectedIds));
      if (error) throw error;
      toast.success(`${selectedIds.size} tasks marked as completed`);
      setSelectedIds(new Set());
      loadTasks();
    } catch (error) {
      console.error('Error bulk completing:', error);
      toast.error('Failed to complete tasks');
    }
  };

  const handleMarkComplete = async (taskId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', taskId);
      if (error) throw error;
      toast.success('Task marked as completed');
      loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  // Task CRUD handlers
  const handleAddTask = async () => {
    if (!taskFormData.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }
    if (!taskFormData.due_date) {
      toast.error('Please select a due date');
      return;
    }

    setSavingTask(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const insertData = {
        title: taskFormData.title.trim(),
        description: taskFormData.description.trim() || null,
        due_date: taskFormData.due_date,
        priority: taskFormData.priority,
        status: taskFormData.status,
        assigned_to: taskFormData.assigned_to.trim() || null,
        case_id: taskFormData.case_id || null,
        created_by: user.id,
      };

      const { data, error } = await (supabase as any)
        .from('tasks')
        .insert([insertData])
        .select('*, cases(title, case_number)')
        .single();

      if (error) throw error;

      toast.success('Task created successfully!');
      setTasks(prev => [data as TaskType, ...prev]);
      setShowAddDialog(false);
      resetTaskForm();
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast.error(error.message || 'Failed to create task');
    } finally {
      setSavingTask(false);
    }
  };

  const handleEditTask = async () => {
    if (!selectedTask) return;
    if (!taskFormData.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    setSavingTask(true);
    try {
      const updateData = {
        title: taskFormData.title.trim(),
        description: taskFormData.description.trim() || null,
        due_date: taskFormData.due_date,
        priority: taskFormData.priority,
        status: taskFormData.status,
        assigned_to: taskFormData.assigned_to.trim() || null,
        case_id: taskFormData.case_id || null,
      };

      const { error } = await (supabase as any)
        .from('tasks')
        .update(updateData)
        .eq('id', selectedTask.id);

      if (error) throw error;

      toast.success('Task updated successfully!');
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, ...updateData } as TaskType : t));
      setShowEditDialog(false);
      setSelectedTask(null);
      resetTaskForm();
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error(error.message || 'Failed to update task');
    } finally {
      setSavingTask(false);
    }
  };

  const openViewDialog = (task: TaskType) => {
    setSelectedTask(task);
    setShowViewDialog(true);
  };

  const openEditDialog = (task: TaskType) => {
    setSelectedTask(task);
    setTaskFormData({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      assigned_to: task.assigned_to || '',
      case_id: task.case_id || '',
    });
    setShowEditDialog(true);
  };

  const resetTaskForm = () => {
    setTaskFormData({
      title: '',
      description: '',
      due_date: '',
      priority: 'medium',
      status: 'pending',
      assigned_to: '',
      case_id: '',
    });
  };

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Bulk selection helpers
  const allOnPageSelected = paginatedTasks.length > 0 && paginatedTasks.every(t => selectedIds.has(t.id));
  const someOnPageSelected = paginatedTasks.some(t => selectedIds.has(t.id));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        paginatedTasks.forEach(t => newSet.delete(t.id));
        return newSet;
      });
    } else {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        paginatedTasks.forEach(t => newSet.add(t.id));
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
  const pendingCount = tasks.filter(t => getTaskStatus(t) === 'pending').length;
  const inProgressCount = tasks.filter(t => getTaskStatus(t) === 'in_progress').length;
  const overdueCount = tasks.filter(t => getTaskStatus(t) === 'overdue').length;
  const completedCount = tasks.filter(t => getTaskStatus(t) === 'completed').length;

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', overdue: 'Overdue',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority?: string): string => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-blue-100 text-blue-700',
      low: 'bg-slate-100 text-slate-700',
    };
    return priority ? colors[priority] || 'bg-gray-100 text-gray-700' : '';
  };

  // Export functions
  const exportToExcel = () => {
    setExporting(true);
    try {
      const exportData = filteredTasks.map(t => ({
        'Title': t.title,
        'Description': t.description || '',
        'Status': getStatusLabel(getTaskStatus(t)),
        'Priority': t.priority || 'N/A',
        'Case': t.cases?.case_number || 'N/A',
        'Due Date': format(new Date(t.due_date), 'yyyy-MM-dd'),
        'Assigned To': t.assigned_to || 'N/A',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
      XLSX.writeFile(wb, `tasks_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast.success(`Exported ${filteredTasks.length} tasks`);
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
      doc.text('DLPP Legal Case Management - Tasks Report', 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')} | Total: ${filteredTasks.length} tasks`, 14, 22);

      const tableData = filteredTasks.map(t => [
        t.title.substring(0, 30),
        getStatusLabel(getTaskStatus(t)),
        t.priority || '-',
        t.cases?.case_number || '-',
        format(new Date(t.due_date), 'yyyy-MM-dd'),
        t.assigned_to || '-',
      ]);

      (autoTable as any)(doc, {
        startY: 28,
        head: [['Title', 'Status', 'Priority', 'Case', 'Due Date', 'Assigned To']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [139, 35, 50] },
      });

      doc.save(`tasks_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success(`Exported ${filteredTasks.length} tasks`);
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
      <!DOCTYPE html><html><head><title>Tasks Report</title>
      <style>
        body{font-family:Arial,sans-serif;margin:20px;font-size:11px}
        h1{color:#8B2332;font-size:18px;margin-bottom:5px}
        .meta{color:#666;margin-bottom:15px}
        table{width:100%;border-collapse:collapse}
        th{background:#8B2332;color:white;padding:6px;text-align:left}
        td{padding:6px;border-bottom:1px solid #ddd}
        tr:nth-child(even){background:#f9f9f9}
      </style></head><body>
      <h1>DLPP Legal Case Management - Tasks</h1>
      <div class="meta">Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')} | Total: ${filteredTasks.length} tasks</div>
      <table><thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Case</th><th>Due Date</th><th>Assigned To</th></tr></thead>
      <tbody>${filteredTasks.map(t => `<tr><td>${t.title}</td><td>${getStatusLabel(getTaskStatus(t))}</td><td>${t.priority || '-'}</td><td>${t.cases?.case_number || '-'}</td><td>${format(new Date(t.due_date), 'yyyy-MM-dd')}</td><td>${t.assigned_to || '-'}</td></tr>`).join('')}</tbody></table>
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
            <p className="mt-4 text-slate-600">Loading tasks...</p>
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
              <CheckSquare className="h-5 w-5 text-slate-600" />
              <div className="h-6 w-px bg-slate-300" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Tasks</h1>
                <p className="text-xs text-slate-500">
                  {filteredTasks.length} of {tasks.length} tasks
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
                  <Button variant="outline" size="sm" disabled={exporting || filteredTasks.length === 0}>
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

              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setShowAddDialog(true); resetTaskForm(); }}>
                <Plus className="h-4 w-4 mr-1" />
                New Task
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="sticky top-[73px] z-10 bg-emerald-600 text-white px-6 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <span className="text-sm font-medium">{selectedIds.size} task(s) selected</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => setSelectedIds(new Set())}>
                  Clear Selection
                </Button>
                <Button size="sm" variant="secondary" onClick={handleBulkComplete}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark Complete
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
                      <AlertDialogTitle>Delete {selectedIds.size} Tasks</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedIds.size} tasks? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                        Delete {selectedIds.size} Tasks
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
                  <span className="font-semibold text-yellow-600">{pendingCount}</span> Pending
                </span>
                <span className="text-slate-600">
                  <span className="font-semibold text-blue-600">{inProgressCount}</span> In Progress
                </span>
                <span className="text-slate-600">
                  <span className="font-semibold text-red-600">{overdueCount}</span> Overdue
                </span>
                <span className="text-slate-600">
                  <span className="font-semibold text-green-600">{completedCount}</span> Completed
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
                      placeholder="Task title, description, case..."
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
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div>
                  <Label className="text-xs text-slate-600">Priority</Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date From */}
                <div>
                  <Label className="text-xs text-slate-600">Due From</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1 h-9" />
                </div>

                {/* Date To */}
                <div>
                  <Label className="text-xs text-slate-600">Due To</Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1 h-9" />
                </div>
              </div>
            </div>

            {/* Tasks Table */}
            <div className="overflow-x-auto">
              {paginatedTasks.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">
                    {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
                  </p>
                  {tasks.length === 0 && (
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setShowAddDialog(true); resetTaskForm(); }}>
                      <Plus className="h-4 w-4 mr-1" />Create First Task
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
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Task</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Priority</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Case</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Due Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Assigned</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTasks.map((t) => {
                      const status = getTaskStatus(t);
                      const isDueToday = isToday(new Date(t.due_date));
                      return (
                        <tr
                          key={t.id}
                          className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${status === 'completed' ? 'bg-gray-50/50 text-slate-500' : ''} ${selectedIds.has(t.id) ? 'bg-emerald-50' : ''}`}
                        >
                          <td className="py-3 px-4">
                            <Checkbox
                              checked={selectedIds.has(t.id)}
                              onCheckedChange={() => toggleSelect(t.id)}
                              className="data-[state=checked]:bg-emerald-600"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">{t.title}</div>
                            {t.description && (
                              <p className="text-xs text-slate-500 truncate max-w-xs">{t.description}</p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={`${getStatusColor(status)} text-xs font-medium`}>
                              {getStatusLabel(status)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            {t.priority && (
                              <Badge variant="outline" className={`${getPriorityColor(t.priority)} text-xs`}>
                                {t.priority}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {t.cases ? (
                              <Link href={`/cases/${t.case_id}`} className="text-xs font-mono hover:text-emerald-600">
                                {t.cases.case_number}
                              </Link>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className={`text-xs ${isDueToday ? 'text-orange-600 font-medium' : status === 'overdue' ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                              {format(new Date(t.due_date), 'MMM dd, yyyy')}
                              {isDueToday && <span className="ml-1 text-orange-500">(Today)</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-xs">{t.assigned_to || '-'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1">
                              {status !== 'completed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleMarkComplete(t.id)}
                                  title="Mark Complete"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openViewDialog(t)}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditDialog(t)}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" disabled={deletingTaskId === t.id}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Delete <strong>{t.title}</strong>? This cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteTask(t.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-slate-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
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
            {filteredTasks.length > 0 && totalPages <= 1 && (
              <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
                <span>Showing {filteredTasks.length} of {tasks.length} tasks</span>
                <span>Click on a task to view details</span>
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

      {/* Add Task Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new task.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Title</Label>
            <Input
              value={taskFormData.title}
              onChange={e => setTaskFormData(f => ({ ...f, title: e.target.value }))}
              placeholder="Task title"
              required
            />
            <Label>Description</Label>
            <Textarea
              value={taskFormData.description}
              onChange={e => setTaskFormData(f => ({ ...f, description: e.target.value }))}
              placeholder="Task description"
              rows={3}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={taskFormData.due_date}
                  onChange={e => setTaskFormData(f => ({ ...f, due_date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={taskFormData.priority} onValueChange={v => setTaskFormData(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={taskFormData.status} onValueChange={v => setTaskFormData(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assigned To</Label>
                <Input
                  value={taskFormData.assigned_to}
                  onChange={e => setTaskFormData(f => ({ ...f, assigned_to: e.target.value }))}
                  placeholder="Assignee"
                />
              </div>
            </div>
            <div>
              <Label>Case</Label>
              <CaseSelector
                value={taskFormData.case_id}
                onValueChange={caseId => setTaskFormData(f => ({ ...f, case_id: caseId }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddTask} disabled={savingTask} className="bg-emerald-600 hover:bg-emerald-700">
              {savingTask ? 'Saving...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Task Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>
              View details for this task.
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-3">
              <div>
                <Label>Title</Label>
                <div className="font-semibold">{selectedTask.title}</div>
              </div>
              <div>
                <Label>Description</Label>
                <div className="whitespace-pre-line">{selectedTask.description || <span className="text-slate-400">No description</span>}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Due Date</Label>
                  <div>{format(new Date(selectedTask.due_date), 'yyyy-MM-dd')}</div>
                </div>
                <div>
                  <Label>Priority</Label>
                  <div>{selectedTask.priority}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Status</Label>
                  <div>{getStatusLabel(selectedTask.status)}</div>
                </div>
                <div>
                  <Label>Assigned To</Label>
                  <div>{selectedTask.assigned_to || '-'}</div>
                </div>
              </div>
              <div>
                <Label>Case</Label>
                <div>
                  {selectedTask.cases
                    ? <Link href={`/cases/${selectedTask.case_id}`} className="text-emerald-700 underline">{selectedTask.cases.case_number}</Link>
                    : <span className="text-slate-400">-</span>
                  }
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the details for this task.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Title</Label>
            <Input
              value={taskFormData.title}
              onChange={e => setTaskFormData(f => ({ ...f, title: e.target.value }))}
              placeholder="Task title"
              required
            />
            <Label>Description</Label>
            <Textarea
              value={taskFormData.description}
              onChange={e => setTaskFormData(f => ({ ...f, description: e.target.value }))}
              placeholder="Task description"
              rows={3}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={taskFormData.due_date}
                  onChange={e => setTaskFormData(f => ({ ...f, due_date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={taskFormData.priority} onValueChange={v => setTaskFormData(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={taskFormData.status} onValueChange={v => setTaskFormData(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assigned To</Label>
                <Input
                  value={taskFormData.assigned_to}
                  onChange={e => setTaskFormData(f => ({ ...f, assigned_to: e.target.value }))}
                  placeholder="Assignee"
                />
              </div>
            </div>
            <div>
              <Label>Case</Label>
              <CaseSelector
                value={taskFormData.case_id}
                onValueChange={caseId => setTaskFormData(f => ({ ...f, case_id: caseId }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditTask} disabled={savingTask} className="bg-emerald-600 hover:bg-emerald-700">
              {savingTask ? 'Saving...' : 'Update Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
