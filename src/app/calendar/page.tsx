'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  Calendar as CalendarIcon,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Trash2,
  Search,
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isFuture, addMonths, subMonths, parseISO, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CaseSelector } from '@/components/forms/CaseSelector';

interface EventItem {
  id: string;
  event_type: string;
  title: string;
  event_date: string;
  location?: string;
  case_id?: string;
  cases?: { case_number: string; title: string };
}

type EventTypeFilter = 'all' | 'hearing' | 'filing_deadline' | 'response_deadline' | 'meeting' | 'other';

const ITEMS_PER_PAGE_OPTIONS = [10, 15, 25, 50];
const DEFAULT_ITEMS_PER_PAGE = 15;
const ITEMS_PER_PAGE_KEY = 'calendar_items_per_page';

export default function CalendarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Add Event Dialog
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [addingEvent, setAddingEvent] = useState(false);
  const [newEventData, setNewEventData] = useState({
    title: '',
    event_type: 'hearing',
    event_date: '',
    event_time: '09:00',
    location: '',
    description: '',
    case_id: '',
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showPastEvents, setShowPastEvents] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);

  const [exporting, setExporting] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    const storedItemsPerPage = localStorage.getItem(ITEMS_PER_PAGE_KEY);
    if (storedItemsPerPage) {
      setItemsPerPage(parseInt(storedItemsPerPage, 10));
    }
  }, []);

  useEffect(() => {
    checkAuth();
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [searchQuery, eventTypeFilter, events, dateFrom, dateTo, showPastEvents]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('events_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEvents(prev => [payload.new as EventItem, ...prev]);
            toast.info('New event added');
          } else if (payload.eventType === 'UPDATE') {
            setEvents(prev => prev.map(e => e.id === payload.new.id ? payload.new as EventItem : e));
          } else if (payload.eventType === 'DELETE') {
            setEvents(prev => prev.filter(e => e.id !== payload.old.id));
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

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*, cases(title, case_number)')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    toast.success('Calendar refreshed');
  };

  const filterEvents = () => {
    let filtered = [...events];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.cases?.case_number.toLowerCase().includes(q)
      );
    }

    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter(e => e.event_type === eventTypeFilter);
    }

    if (!showPastEvents) {
      filtered = filtered.filter(e => isFuture(new Date(e.event_date)) || isToday(new Date(e.event_date)));
    }

    if (dateFrom) {
      const fromDate = startOfDay(parseISO(dateFrom));
      filtered = filtered.filter(e => isAfter(new Date(e.event_date), fromDate) || new Date(e.event_date).getTime() === fromDate.getTime());
    }

    if (dateTo) {
      const toDate = endOfDay(parseISO(dateTo));
      filtered = filtered.filter(e => isBefore(new Date(e.event_date), toDate) || new Date(e.event_date).getTime() === toDate.getTime());
    }

    setFilteredEvents(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setEventTypeFilter('all');
    setDateFrom('');
    setDateTo('');
    setShowPastEvents(false);
  };

  const hasActiveFilters = searchQuery || eventTypeFilter !== 'all' || dateFrom || dateTo || showPastEvents;

  const handleAddEvent = async () => {
    if (!newEventData.title.trim()) {
      toast.error('Please enter an event title');
      return;
    }
    if (!newEventData.event_date) {
      toast.error('Please select an event date');
      return;
    }

    setAddingEvent(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Combine date and time
      const eventDateTime = `${newEventData.event_date}T${newEventData.event_time}:00`;

      const insertData = {
        title: newEventData.title.trim(),
        event_type: newEventData.event_type,
        event_date: eventDateTime,
        location: newEventData.location.trim() || null,
        description: newEventData.description.trim() || null,
        case_id: newEventData.case_id || null,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('events')
        .insert([insertData] as any)
        .select('*, cases(title, case_number)')
        .single();

      if (error) throw error;

      toast.success('Event added successfully!');
      setEvents(prev => [data, ...prev]);
      setShowAddEventDialog(false);
      setNewEventData({
        title: '',
        event_type: 'hearing',
        event_date: '',
        event_time: '09:00',
        location: '',
        description: '',
        case_id: '',
      });
    } catch (error: any) {
      console.error('Error adding event:', error);
      if (error.message?.includes('does not exist')) {
        toast.error('Events table not found. Please run database migration.');
      } else {
        toast.error('Failed to add event');
      }
    } finally {
      setAddingEvent(false);
    }
  };

  const openAddEventForDate = (date?: Date) => {
    if (date) {
      setNewEventData(prev => ({
        ...prev,
        event_date: format(date, 'yyyy-MM-dd'),
      }));
    }
    setShowAddEventDialog(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;
      toast.success('Event deleted successfully');
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      const { error } = await supabase.from('events').delete().in('id', Array.from(selectedIds));
      if (error) throw error;
      toast.success(`${selectedIds.size} events deleted successfully`);
      setEvents(prev => prev.filter(e => !selectedIds.has(e.id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Failed to delete events');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    const newValue = parseInt(value, 10);
    setItemsPerPage(newValue);
    setCurrentPage(1);
    localStorage.setItem(ITEMS_PER_PAGE_KEY, value);
  };

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Bulk selection helpers
  const allOnPageSelected = paginatedEvents.length > 0 && paginatedEvents.every(e => selectedIds.has(e.id));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        paginatedEvents.forEach(e => newSet.delete(e.id));
        return newSet;
      });
    } else {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        paginatedEvents.forEach(e => newSet.add(e.id));
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

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOffset = monthStart.getDay();
  const emptyDays = Array(startDayOffset).fill(null);

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.event_date), date));
  };

  const selectedDateEvents = getEventsForDate(selectedDate);

  const getEventTypeBadge = (type: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      hearing: { className: 'bg-blue-100 text-blue-800', label: 'Hearing' },
      filing_deadline: { className: 'bg-red-100 text-red-800', label: 'Deadline' },
      response_deadline: { className: 'bg-orange-100 text-orange-800', label: 'Response Due' },
      meeting: { className: 'bg-purple-100 text-purple-800', label: 'Meeting' },
      other: { className: 'bg-gray-100 text-gray-800', label: 'Other' },
    };
    return variants[type] || variants.other;
  };

  const isAutoCreated = (eventTitle: string) => {
    return eventTitle.startsWith('Case Registered:') ||
           eventTitle.startsWith('First Hearing:') ||
           eventTitle.startsWith('Status Changed:');
  };

  // Stats
  const upcomingCount = events.filter(e => isFuture(new Date(e.event_date))).length;
  const hearingsCount = events.filter(e => e.event_type === 'hearing' && isFuture(new Date(e.event_date))).length;
  const deadlinesCount = events.filter(e => (e.event_type === 'filing_deadline' || e.event_type === 'response_deadline') && isFuture(new Date(e.event_date))).length;
  const todayCount = events.filter(e => isToday(new Date(e.event_date))).length;

  // Export functions
  const exportToExcel = () => {
    setExporting(true);
    try {
      const exportData = filteredEvents.map(e => ({
        'Title': e.title,
        'Type': getEventTypeBadge(e.event_type).label,
        'Date': format(new Date(e.event_date), 'yyyy-MM-dd HH:mm'),
        'Location': e.location || 'N/A',
        'Case': e.cases?.case_number || 'N/A',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Events');
      XLSX.writeFile(wb, `calendar_events_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast.success(`Exported ${filteredEvents.length} events`);
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
      doc.text('DLPP Legal Case Management - Calendar Events', 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')} | Total: ${filteredEvents.length} events`, 14, 22);

      const tableData = filteredEvents.map(e => [
        e.title.substring(0, 30),
        getEventTypeBadge(e.event_type).label,
        format(new Date(e.event_date), 'yyyy-MM-dd HH:mm'),
        e.location || '-',
        e.cases?.case_number || '-',
      ]);

      (autoTable as any)(doc, {
        startY: 28,
        head: [['Title', 'Type', 'Date & Time', 'Location', 'Case']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [139, 35, 50] },
      });

      doc.save(`calendar_events_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success(`Exported ${filteredEvents.length} events`);
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
      <!DOCTYPE html><html><head><title>Calendar Events</title>
      <style>
        body{font-family:Arial,sans-serif;margin:20px;font-size:11px}
        h1{color:#8B2332;font-size:18px;margin-bottom:5px}
        .meta{color:#666;margin-bottom:15px}
        table{width:100%;border-collapse:collapse}
        th{background:#8B2332;color:white;padding:6px;text-align:left}
        td{padding:6px;border-bottom:1px solid #ddd}
        tr:nth-child(even){background:#f9f9f9}
      </style></head><body>
      <h1>DLPP Legal Case Management - Calendar Events</h1>
      <div class="meta">Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')} | Total: ${filteredEvents.length} events</div>
      <table><thead><tr><th>Title</th><th>Type</th><th>Date & Time</th><th>Location</th><th>Case</th></tr></thead>
      <tbody>${filteredEvents.map(e => `<tr><td>${e.title}</td><td>${getEventTypeBadge(e.event_type).label}</td><td>${format(new Date(e.event_date), 'yyyy-MM-dd HH:mm')}</td><td>${e.location || '-'}</td><td>${e.cases?.case_number || '-'}</td></tr>`).join('')}</tbody></table>
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
            <p className="mt-4 text-slate-600">Loading calendar...</p>
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
              <CalendarIcon className="h-5 w-5 text-slate-600" />
              <div className="h-6 w-px bg-slate-300" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Calendar</h1>
                <p className="text-xs text-slate-500">
                  {filteredEvents.length} of {events.length} events
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={exporting || filteredEvents.length === 0}>
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
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => openAddEventForDate()}>
                <Plus className="h-4 w-4 mr-1" />
                Add Event
              </Button>
            </div>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="sticky top-[73px] z-10 bg-emerald-600 text-white px-6 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <span className="text-sm font-medium">{selectedIds.size} event(s) selected</span>
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
                      <AlertDialogTitle>Delete {selectedIds.size} Events</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedIds.size} events? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                        Delete {selectedIds.size} Events
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

          {/* Summary Bar */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm">
                <span className="text-slate-600">
                  <span className="font-semibold text-emerald-600">{upcomingCount}</span> Upcoming
                </span>
                <span className="text-slate-600">
                  <span className="font-semibold text-blue-600">{hearingsCount}</span> Hearings
                </span>
                <span className="text-slate-600">
                  <span className="font-semibold text-red-600">{deadlinesCount}</span> Deadlines
                </span>
                <span className="text-slate-600">
                  <span className="font-semibold text-orange-600">{todayCount}</span> Today
                </span>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 hover:text-slate-700 h-7">
                  <X className="h-3 w-3 mr-1" />Clear Filters
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Calendar */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm">
              {/* Calendar Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">{format(currentMonth, 'MMMM yyyy')}</h2>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date())}
                    className="h-8 px-3"
                  >
                    Today
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="p-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {emptyDays.map((_, idx) => (
                    <div key={`empty-${idx}`} className="aspect-square" />
                  ))}
                  {daysInMonth.map((day, idx) => {
                    const dayEvents = getEventsForDate(day);
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentDay = isToday(day);

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          aspect-square p-1 rounded-lg text-sm transition-all relative
                          ${isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}
                          ${isCurrentDay && !isSelected ? 'ring-2 ring-emerald-500 ring-inset' : ''}
                          ${dayEvents.length > 0 ? 'font-semibold' : ''}
                        `}
                      >
                        <div className="text-xs">{format(day, 'd')}</div>
                        {dayEvents.length > 0 && (
                          <div className="flex justify-center gap-0.5 mt-0.5">
                            {dayEvents.slice(0, 3).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Events for Selected Date */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(selectedDate, 'EEEE, MMM dd')}
                </h2>
              </div>
              <div className="p-4">
                {selectedDateEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No events</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 gap-1"
                      onClick={() => openAddEventForDate(selectedDate)}
                    >
                      <Plus className="h-3 w-3" />
                      Add Event
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateEvents.map((event) => (
                      <div key={event.id} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm text-slate-900">{event.title}</h4>
                          <Badge className={`text-xs ${getEventTypeBadge(event.event_type).className}`}>
                            {getEventTypeBadge(event.event_type).label}
                          </Badge>
                        </div>
                        {isAutoCreated(event.title) && (
                          <p className="text-xs text-slate-400 mb-1">Auto-created</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(event.event_date), 'h:mm a')}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          )}
                        </div>
                        {event.cases && (
                          <Link href={`/cases/${event.case_id}`} className="text-xs text-emerald-600 hover:underline mt-2 block">
                            {event.cases.case_number}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Events List with Filters */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">All Events</h2>
            </div>

            {/* Filters Section */}
            <div className="p-6 border-b border-slate-200">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {/* Search */}
                <div className="col-span-2">
                  <Label className="text-xs text-slate-600">Search</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Title, location, case..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-9"
                    />
                  </div>
                </div>

                {/* Event Type */}
                <div>
                  <Label className="text-xs text-slate-600">Event Type</Label>
                  <Select value={eventTypeFilter} onValueChange={(v) => setEventTypeFilter(v as EventTypeFilter)}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="hearing">Hearing</SelectItem>
                      <SelectItem value="filing_deadline">Filing Deadline</SelectItem>
                      <SelectItem value="response_deadline">Response Deadline</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
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

                {/* Show Past Events */}
                <div className="flex items-end">
                  <div className="flex items-center gap-2 h-9">
                    <Checkbox
                      id="showPast"
                      checked={showPastEvents}
                      onCheckedChange={(c) => setShowPastEvents(c === true)}
                    />
                    <Label htmlFor="showPast" className="text-xs text-slate-600 cursor-pointer">Include past</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Events Table */}
            <div className="overflow-x-auto">
              {paginatedEvents.length === 0 ? (
                <div className="p-12 text-center">
                  <CalendarIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">
                    {events.length === 0 ? 'No events scheduled' : 'No events match your filters'}
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
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Event</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Date & Time</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Location</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Case</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEvents.map((event) => (
                      <tr
                        key={event.id}
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${selectedIds.has(event.id) ? 'bg-emerald-50' : ''}`}
                      >
                        <td className="py-3 px-4">
                          <Checkbox
                            checked={selectedIds.has(event.id)}
                            onCheckedChange={() => toggleSelect(event.id)}
                            className="data-[state=checked]:bg-emerald-600"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{event.title}</div>
                          {isAutoCreated(event.title) && (
                            <span className="text-xs text-slate-400">Auto-created</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`${getEventTypeBadge(event.event_type).className} text-xs`}>
                            {getEventTypeBadge(event.event_type).label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {format(new Date(event.event_date), 'MMM dd, yyyy - h:mm a')}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{event.location || '-'}</td>
                        <td className="py-3 px-4">
                          {event.cases ? (
                            <Link href={`/cases/${event.case_id}`} className="text-xs font-mono hover:text-emerald-600">
                              {event.cases.case_number}
                            </Link>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Event</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Delete <strong>{event.title}</strong>? This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteEvent(event.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
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
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredEvents.length)} of {filteredEvents.length} events
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
            {filteredEvents.length > 0 && totalPages <= 1 && (
              <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
                Showing {filteredEvents.length} events
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>
              Create a new calendar event. Fill in the details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Event Title *</Label>
              <Input
                id="event-title"
                placeholder="e.g., Court Hearing, Filing Deadline..."
                value={newEventData.title}
                onChange={(e) => setNewEventData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-type">Event Type *</Label>
                <Select
                  value={newEventData.event_type}
                  onValueChange={(value) => setNewEventData(prev => ({ ...prev, event_type: value }))}
                >
                  <SelectTrigger id="event-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hearing">Hearing</SelectItem>
                    <SelectItem value="filing_deadline">Filing Deadline</SelectItem>
                    <SelectItem value="response_deadline">Response Deadline</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-location">Location</Label>
                <Input
                  id="event-location"
                  placeholder="e.g., Court Room 1..."
                  value={newEventData.location}
                  onChange={(e) => setNewEventData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-date">Date *</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={newEventData.event_date}
                  onChange={(e) => setNewEventData(prev => ({ ...prev, event_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-time">Time *</Label>
                <Input
                  id="event-time"
                  type="time"
                  value={newEventData.event_time}
                  onChange={(e) => setNewEventData(prev => ({ ...prev, event_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <CaseSelector
                value={newEventData.case_id}
                onValueChange={(value) => setNewEventData(prev => ({ ...prev, case_id: value }))}
                label="Link to Case (Optional)"
                placeholder="Search and select case..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">Description (Optional)</Label>
              <Textarea
                id="event-description"
                placeholder="Additional details about the event..."
                value={newEventData.description}
                onChange={(e) => setNewEventData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddEventDialog(false)}
              disabled={addingEvent}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddEvent}
              disabled={addingEvent}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {addingEvent ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
