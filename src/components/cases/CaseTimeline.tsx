'use client';

import { useEffect, useState } from 'react';
import { format, formatDistanceToNow, isAfter, isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  FolderOpen,
  FileText,
  Users,
  Calendar,
  CheckSquare,
  Gavel,
  MapPin,
  MessageSquare,
  ArrowRight,
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
  X,
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  type:
    | 'case_created'
    | 'status_change'
    | 'document_added'
    | 'party_added'
    | 'task_created'
    | 'task_completed'
    | 'event_created'
    | 'court_order'
    | 'parcel_added'
    | 'communication'
    | 'assignment'
    | 'closure'
    | 'case_update';
  title: string;
  description?: string;
  date: string;
  metadata?: Record<string, unknown>;
}

interface CaseTimelineProps {
  caseId: string;
  caseCreatedAt: string;
  /** Bump this value to force the timeline to reload (e.g. after a new action is recorded). */
  refreshKey?: number;
}

const eventIcons: Record<string, React.ElementType> = {
  case_created: FolderOpen,
  status_change: ArrowRight,
  document_added: FileText,
  party_added: Users,
  task_created: CheckSquare,
  task_completed: CheckSquare,
  event_created: Calendar,
  court_order: Gavel,
  parcel_added: MapPin,
  communication: MessageSquare,
  assignment: Users,
  closure: FolderOpen,
  case_update: ArrowRight,
};

const eventColors: Record<string, string> = {
  case_created: 'bg-emerald-500',
  status_change: 'bg-blue-500',
  document_added: 'bg-purple-500',
  party_added: 'bg-pink-500',
  task_created: 'bg-amber-500',
  task_completed: 'bg-green-500',
  event_created: 'bg-indigo-500',
  court_order: 'bg-red-500',
  parcel_added: 'bg-orange-500',
  communication: 'bg-cyan-500',
  assignment: 'bg-emerald-600',
  closure: 'bg-slate-700',
  case_update: 'bg-blue-600',
};

const eventTypeLabels: Record<string, string> = {
  case_created: 'Case Created',
  status_change: 'Status Changes',
  document_added: 'Documents',
  party_added: 'Parties',
  task_created: 'Tasks Created',
  task_completed: 'Tasks Completed',
  event_created: 'Events',
  court_order: 'Court Orders',
  parcel_added: 'Land Parcels',
  communication: 'Communications',
  assignment: 'Assignments',
  closure: 'Closures',
  case_update: 'Case Updates',
};

export function CaseTimeline({ caseId, caseCreatedAt, refreshKey }: CaseTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set([
    'case_created',
    'status_change',
    'document_added',
    'party_added',
    'task_created',
    'task_completed',
    'event_created',
    'court_order',
    'parcel_added',
    'communication',
    'assignment',
    'closure',
    'case_update',
  ]));

  useEffect(() => {
    loadTimelineEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, refreshKey]);

  useEffect(() => {
    applyFilters();
  }, [events, selectedTypes, dateFrom, dateTo]);

  const applyFilters = () => {
    let filtered = [...events];

    filtered = filtered.filter(e => selectedTypes.has(e.type));

    if (dateFrom) {
      const fromDate = startOfDay(parseISO(dateFrom));
      filtered = filtered.filter(e =>
        isAfter(new Date(e.date), fromDate) || new Date(e.date).getTime() === fromDate.getTime()
      );
    }

    if (dateTo) {
      const toDate = endOfDay(parseISO(dateTo));
      filtered = filtered.filter(e =>
        isBefore(new Date(e.date), toDate) || new Date(e.date).getTime() === toDate.getTime()
      );
    }

    setFilteredEvents(filtered);
  };

  const toggleEventType = (type: string) => {
    setSelectedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const selectAllTypes = () => {
    setSelectedTypes(new Set(Object.keys(eventTypeLabels)));
  };

  const clearAllTypes = () => {
    setSelectedTypes(new Set());
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    selectAllTypes();
  };

  const hasActiveFilters =
    dateFrom || dateTo || selectedTypes.size !== Object.keys(eventTypeLabels).length;

  const loadTimelineEvents = async () => {
    try {
      const timelineEvents: TimelineEvent[] = [];

      timelineEvents.push({
        id: 'case_created',
        type: 'case_created',
        title: 'Case Created',
        description: 'Case was registered in the system',
        date: caseCreatedAt,
      });

      const { data: historyData } = await supabase
        .from('case_history')
        .select('id, action, description, activity_type, entity_type, created_at')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      (historyData as any[] | null)?.forEach((history: any) => {
        const normalized = `${history.activity_type || history.action || ''} ${history.entity_type || ''}`.toLowerCase();
        let type: TimelineEvent['type'] = 'case_update';

        if (normalized.includes('assign')) type = 'assignment';
        else if (normalized.includes('close') || normalized.includes('closure')) type = 'closure';
        else if (normalized.includes('status') || normalized.includes('stage') || normalized.includes('workflow')) type = 'status_change';
        else if (normalized.includes('document')) type = 'document_added';
        else if (normalized.includes('party')) type = 'party_added';
        else if (normalized.includes('event') || normalized.includes('hearing')) type = 'event_created';
        else if (normalized.includes('court')) type = 'court_order';
        else if (normalized.includes('communication') || normalized.includes('correspondence')) type = 'communication';
        else if (normalized.includes('created') || normalized.includes('registered')) type = 'case_created';

        timelineEvents.push({
          id: `history_${history.id}`,
          type,
          title: history.action || 'Case Activity',
          description: history.description || undefined,
          date: history.created_at,
        });
      });

      const { data: docs } = await supabase
        .from('documents')
        .select('id, title, uploaded_at')
        .eq('case_id', caseId)
        .order('uploaded_at', { ascending: false });

      (docs as any[] | null)?.forEach((doc: any) => {
        timelineEvents.push({
          id: `doc_${doc.id}`,
          type: 'document_added',
          title: 'Document Added',
          description: doc.title,
          date: doc.uploaded_at,
        });
      });

      const { data: parties } = await supabase
        .from('parties')
        .select('id, name, party_type, created_at')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      (parties as any[] | null)?.forEach((party: any) => {
        timelineEvents.push({
          id: `party_${party.id}`,
          type: 'party_added',
          title: 'Party Added',
          description: `${party.name} (${party.party_type})`,
          date: party.created_at,
        });
      });

      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, status, created_at')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      (tasks as any[] | null)?.forEach((task: any) => {
        timelineEvents.push({
          id: `task_${task.id}`,
          type: task.status === 'completed' ? 'task_completed' : 'task_created',
          title: task.status === 'completed' ? 'Task Completed' : 'Task Created',
          description: task.title,
          date: task.created_at,
        });
      });

      const { data: caseEvents } = await supabase
        .from('events')
        .select('id, title, event_type, event_date')
        .eq('case_id', caseId)
        .order('event_date', { ascending: false });

      (caseEvents as any[] | null)?.forEach((event: any) => {
        timelineEvents.push({
          id: `event_${event.id}`,
          type: 'event_created',
          title: event.event_type === 'hearing' ? 'Hearing Scheduled' : 'Event Created',
          description: event.title,
          date: event.event_date,
        });
      });

      const { data: parcels } = await supabase
        .from('land_parcels')
        .select('id, parcel_number, created_at')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      (parcels as any[] | null)?.forEach((parcel: any) => {
        timelineEvents.push({
          id: `parcel_${parcel.id}`,
          type: 'parcel_added',
          title: 'Land Parcel Added',
          description: `Parcel: ${parcel.parcel_number}`,
          date: parcel.created_at,
        });
      });

      const { data: courtOrders } = await (supabase as any)
        .from('court_orders')
        .select('id, court_reference, order_type, order_date')
        .eq('case_id', caseId)
        .order('order_date', { ascending: false });

      (courtOrders as any[] | null)?.forEach((order: any) => {
        timelineEvents.push({
          id: `court_order_${order.id}`,
          type: 'court_order',
          title: 'Court Order Registered',
          description: `${order.court_reference} - ${order.order_type}`,
          date: order.order_date,
        });
      });

      const { data: communications } = await supabase
        .from('communications')
        .select('id, subject, direction, communication_date')
        .eq('case_id', caseId)
        .order('communication_date', { ascending: false });

      (communications as any[] | null)?.forEach((comm: any) => {
        timelineEvents.push({
          id: `comm_${comm.id}`,
          type: 'communication',
          title: `Communication (${comm.direction})`,
          description: comm.subject,
          date: comm.communication_date,
        });
      });

      timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setEvents(timelineEvents);
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTimelineEvents();
  };

  const displayEvents = expanded ? filteredEvents : filteredEvents.slice(0, 5);
  const presentEventTypes = [...new Set(events.map(e => e.type))] as string[];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300" />
        <p className="text-sm">No timeline events yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Case Timeline
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {filteredEvents.length} of {events.length} events
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button
                variant={hasActiveFilters ? 'default' : 'outline'}
                size="sm"
                className={`h-7 gap-1 ${hasActiveFilters ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
              >
                <Filter className="h-3.5 w-3.5" />
                Filter
                {hasActiveFilters && (
                  <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-white/20 text-white">
                    {Object.keys(eventTypeLabels).length - selectedTypes.size + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Filter Timeline</h4>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
                      <X className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-600">Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-slate-500">From</Label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-slate-500">To</Label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-600">Event Types</Label>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={selectAllTypes} className="h-5 text-[10px] px-1.5">
                        All
                      </Button>
                      <Button variant="ghost" size="sm" onClick={clearAllTypes} className="h-5 text-[10px] px-1.5">
                        None
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {Object.entries(eventTypeLabels).map(([type, label]) => {
                      const Icon = eventIcons[type] || Clock;
                      const colorClass = eventColors[type] || 'bg-slate-500';
                      const count = events.filter(e => e.type === type).length;
                      const isPresent = presentEventTypes.includes(type);

                      return (
                        <div
                          key={type}
                          className={`flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 ${!isPresent ? 'opacity-50' : ''}`}
                        >
                          <Checkbox
                            id={`filter-${type}`}
                            checked={selectedTypes.has(type)}
                            onCheckedChange={() => toggleEventType(type)}
                            disabled={!isPresent}
                            className="h-3.5 w-3.5"
                          />
                          <div className={`p-1 rounded ${colorClass}`}>
                            <Icon className="h-2.5 w-2.5 text-white" />
                          </div>
                          <Label
                            htmlFor={`filter-${type}`}
                            className="text-xs text-slate-700 flex-1 cursor-pointer"
                          >
                            {label}
                          </Label>
                          <Badge variant="outline" className="text-[10px] h-4 px-1">
                            {count}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5">
          {dateFrom && (
            <Badge variant="secondary" className="text-xs gap-1">
              From: {format(parseISO(dateFrom), 'MMM dd')}
              <button onClick={() => setDateFrom('')} className="hover:text-red-600">
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          )}
          {dateTo && (
            <Badge variant="secondary" className="text-xs gap-1">
              To: {format(parseISO(dateTo), 'MMM dd')}
              <button onClick={() => setDateTo('')} className="hover:text-red-600">
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          )}
          {selectedTypes.size < Object.keys(eventTypeLabels).length && (
            <Badge variant="secondary" className="text-xs">
              {selectedTypes.size} types selected
            </Badge>
          )}
        </div>
      )}

      {filteredEvents.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Filter className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No events match your filters</p>
          <Button variant="link" size="sm" onClick={clearFilters} className="text-emerald-600">
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />

          <div className="space-y-4">
            {displayEvents.map(event => {
              const Icon = eventIcons[event.type] || Clock;
              const colorClass = eventColors[event.type] || 'bg-slate-500';

              return (
                <div key={event.id} className="relative flex gap-4 pl-10">
                  <div className={`absolute left-0 p-2 rounded-full ${colorClass} shadow-sm`}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>

                  <div className="flex-1 bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900 text-sm">{event.title}</p>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {eventTypeLabels[event.type]}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-xs text-slate-600 mt-0.5">{event.description}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-slate-500">
                          {format(new Date(event.date), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filteredEvents.length > 5 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full text-slate-600 hover:text-slate-900"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Show {filteredEvents.length - 5} More Events
            </>
          )}
        </Button>
      )}
    </div>
  );
}
