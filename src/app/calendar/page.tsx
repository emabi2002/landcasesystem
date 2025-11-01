'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';

export default function CalendarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Array<{
    id: string;
    event_type: string;
    title: string;
    event_date: string;
    location?: string;
    cases?: { case_number: string; title: string };
  }>>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    checkAuth();
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
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
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    return events.filter(event =>
      isSameDay(new Date(event.event_date), date)
    );
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading calendar...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Calendar</h1>
            <p className="text-slate-600 mt-1">Events, hearings, and deadlines</p>
          </div>
          <Button className="gap-2 text-white hover:opacity-90" style={{ background: '#EF5A5A' }}>
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-slate-600 pb-2">
                    {day}
                  </div>
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
                        aspect-square p-2 rounded-lg text-sm transition-colors
                        ${isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}
                        ${isCurrentDay && !isSelected ? 'border-2 border-slate-900' : ''}
                        ${dayEvents.length > 0 ? 'font-semibold' : ''}
                      `}
                    >
                      <div>{format(day, 'd')}</div>
                      {dayEvents.length > 0 && (
                        <div className="flex justify-center gap-0.5 mt-1">
                          {dayEvents.slice(0, 3).map((_, i) => (
                            <div
                              key={i}
                              className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-600'}`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Events List for Selected Date */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {format(selectedDate, 'MMM dd, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">No events on this date</p>
                  <Button variant="outline" size="sm" className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Add Event
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateEvents.map((event) => (
                    <div key={event.id} className="p-3 border rounded-lg hover:bg-slate-50">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <Badge className={`text-xs ${getEventTypeBadge(event.event_type).className}`}>
                          {getEventTypeBadge(event.event_type).label}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mb-1">
                        {format(new Date(event.event_date), 'h:mm a')}
                      </p>
                      {event.location && (
                        <p className="text-xs text-slate-500">Location: {event.location}</p>
                      )}
                      {event.cases && (
                        <p className="text-xs text-slate-500 mt-1">
                          Case: {event.cases.case_number}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {events.filter(e => new Date(e.event_date) >= new Date()).length === 0 ? (
              <p className="text-center py-8 text-slate-500">No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {events
                  .filter(e => new Date(e.event_date) >= new Date())
                  .slice(0, 10)
                  .map((event) => (
                    <div key={event.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{event.title}</h4>
                          <Badge className={`text-xs ${getEventTypeBadge(event.event_type).className}`}>
                            {getEventTypeBadge(event.event_type).label}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-600">
                          {format(new Date(event.event_date), 'MMM dd, yyyy - h:mm a')}
                        </div>
                        {event.location && (
                          <div className="text-sm text-slate-500 mt-1">Location: {event.location}</div>
                        )}
                        {event.cases && (
                          <div className="text-xs text-slate-500 mt-1 font-mono">
                            {event.cases.case_number}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
