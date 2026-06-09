'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Bell,
  Check,
  CheckCheck,
  AlertCircle,
  FileText,
  Calendar,
  CheckSquare,
  FolderOpen,
  MessageSquare,
  Clock,
  X,
  Settings,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'alert' | 'task' | 'case' | 'document' | 'event' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  link?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, unknown>;
}

const typeIcons: Record<string, React.ElementType> = {
  alert: AlertCircle,
  task: CheckSquare,
  case: FolderOpen,
  document: FileText,
  event: Calendar,
  system: Bell,
};

const typeColors: Record<string, string> = {
  alert: 'text-red-500',
  task: 'text-amber-500',
  case: 'text-emerald-500',
  document: 'text-purple-500',
  event: 'text-indigo-500',
  system: 'text-slate-500',
};

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-slate-100 text-slate-800 border-slate-300',
};

export function NotificationCenter() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    loadNotifications();

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            // Show toast for new notification
            toast.info(newNotification.title, {
              description: newNotification.message,
            });
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev =>
              prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to load from notifications table, fall back to localStorage
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        // If table doesn't exist, load from localStorage
        const stored = localStorage.getItem(`notifications_${user.id}`);
        if (stored) {
          setNotifications(JSON.parse(stored));
        } else {
          // Create sample notifications for demo
          setNotifications(getSampleNotifications());
        }
      } else {
        setNotifications(data || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Fall back to sample notifications
      setNotifications(getSampleNotifications());
    } finally {
      setLoading(false);
    }
  };

  const getSampleNotifications = (): Notification[] => {
    const now = new Date();
    return [
      {
        id: '1',
        type: 'task',
        title: 'Task Due Soon',
        message: 'Review case documents for Case #2024-001 is due in 2 hours',
        read: false,
        created_at: new Date(now.getTime() - 30 * 60000).toISOString(),
        link: '/tasks',
        priority: 'high',
      },
      {
        id: '2',
        type: 'case',
        title: 'Case Status Updated',
        message: 'Case #2024-005 has been moved to "In Court" status',
        read: false,
        created_at: new Date(now.getTime() - 2 * 3600000).toISOString(),
        link: '/cases',
        priority: 'medium',
      },
      {
        id: '3',
        type: 'alert',
        title: 'Response Required',
        message: 'Director has requested your input on Case #2024-003',
        read: false,
        created_at: new Date(now.getTime() - 4 * 3600000).toISOString(),
        link: '/cases',
        priority: 'urgent',
      },
      {
        id: '4',
        type: 'event',
        title: 'Upcoming Hearing',
        message: 'Court hearing for Case #2024-002 scheduled for tomorrow at 10:00 AM',
        read: true,
        created_at: new Date(now.getTime() - 24 * 3600000).toISOString(),
        link: '/calendar',
        priority: 'high',
      },
      {
        id: '5',
        type: 'document',
        title: 'New Document Uploaded',
        message: 'Evidence documents have been uploaded to Case #2024-004',
        read: true,
        created_at: new Date(now.getTime() - 48 * 3600000).toISOString(),
        link: '/documents',
        priority: 'low',
      },
    ];
  };

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );

    // Try to update in database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await (supabase as any)
          .from('notifications')
          .update({ read: true })
          .eq('id', id);

        // Also update localStorage
        const stored = localStorage.getItem(`notifications_${user.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          const updated = parsed.map((n: Notification) =>
            n.id === id ? { ...n, read: true } : n
          );
          localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await (supabase as any)
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user.id);

        const stored = localStorage.getItem(`notifications_${user.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          const updated = parsed.map((n: Notification) => ({ ...n, read: true }));
          localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
        }
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await (supabase as any)
          .from('notifications')
          .delete()
          .eq('id', id);

        const stored = localStorage.getItem(`notifications_${user.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          const updated = parsed.filter((n: Notification) => n.id !== id);
          localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    toast.success('All notifications cleared');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await (supabase as any)
          .from('notifications')
          .delete()
          .eq('user_id', user.id);

        localStorage.removeItem(`notifications_${user.id}`);
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      router.push(notification.link);
      setOpen(false);
    }
  };

  const filteredNotifications = activeTab === 'all'
    ? notifications
    : activeTab === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.type === activeTab);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-600 hover:text-slate-900"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <div className="border-b px-4 py-3 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-600" />
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-7 px-2 text-xs"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/settings')}
                className="h-7 w-7"
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-9 p-0">
            <TabsTrigger
              value="all"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent text-xs px-3"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent text-xs px-3"
            >
              Unread
            </TabsTrigger>
            <TabsTrigger
              value="alert"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent text-xs px-3"
            >
              Alerts
            </TabsTrigger>
            <TabsTrigger
              value="task"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent text-xs px-3"
            >
              Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <ScrollArea className="h-[350px]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Bell className="h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-sm font-medium">No notifications</p>
                  <p className="text-xs text-slate-400">
                    {activeTab === 'unread' ? 'All caught up!' : 'Nothing to show here'}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => {
                    const Icon = typeIcons[notification.type] || Bell;
                    const iconColor = typeColors[notification.type] || 'text-slate-500';

                    return (
                      <div
                        key={notification.id}
                        className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors relative group ${
                          !notification.read ? 'bg-blue-50/50' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex gap-3">
                          <div className={`mt-0.5 ${iconColor}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${!notification.read ? 'text-slate-900' : 'text-slate-600'}`}>
                                  {notification.title}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
                              </div>
                              {notification.priority && notification.priority !== 'low' && (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 shrink-0 ${priorityColors[notification.priority]}`}
                                >
                                  {notification.priority}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                    }}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {notifications.length > 0 && (
          <div className="border-t px-4 py-2 bg-slate-50 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear all
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                router.push('/settings?tab=notifications');
                setOpen(false);
              }}
              className="h-7 px-2 text-xs"
            >
              View settings
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
