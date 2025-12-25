'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { CheckSquare, Plus, Clock, AlertCircle, Search, X } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

export default function TasksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  interface TaskType {
    id: string;
    title: string;
    description?: string;
    due_date: string;
    status: string;
    cases?: { case_number: string; title: string };
  }
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkAuth();
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
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
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatus = (task: TaskType) => {
    if (task.status === 'completed') return 'completed';
    if (isPast(new Date(task.due_date)) && task.status !== 'completed') return 'overdue';
    if (task.status === 'in_progress') return 'in_progress';
    return 'pending';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string; icon: typeof Clock }> = {
      pending: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock },
      in_progress: { className: 'bg-blue-100 text-blue-800', label: 'In Progress', icon: Clock },
      completed: { className: 'bg-green-100 text-green-800', label: 'Completed', icon: CheckSquare },
      overdue: { className: 'bg-red-100 text-red-800', label: 'Overdue', icon: AlertCircle },
    };
    return variants[status] || variants.pending;
  };

  // Filter tasks based on search query
  const filteredTasks = tasks.filter(task => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.cases?.case_number.toLowerCase().includes(query) ||
      task.cases?.title.toLowerCase().includes(query)
    );
  });

  const pendingTasks = filteredTasks.filter(t => getTaskStatus(t) === 'pending');
  const inProgressTasks = filteredTasks.filter(t => getTaskStatus(t) === 'in_progress');
  const overdueTasks = filteredTasks.filter(t => getTaskStatus(t) === 'overdue');
  const completedTasks = filteredTasks.filter(t => getTaskStatus(t) === 'completed');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  const TaskCard = ({ task }: { task: TaskType }) => {
    const status = getTaskStatus(task);
    const statusInfo = getStatusBadge(status);
    const Icon = statusInfo.icon;
    const isDueToday = isToday(new Date(task.due_date));

    return (
      <div className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium flex-1">{task.title}</h3>
          <Badge className={`ml-2 ${statusInfo.className}`}>
            <Icon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>

        {task.description && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{task.description}</p>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="space-y-1">
            <div className={`flex items-center gap-2 ${isDueToday ? 'text-orange-600 font-medium' : 'text-slate-600'}`}>
              <Clock className="h-4 w-4" />
              <span>Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
              {isDueToday && <Badge variant="outline" className="text-xs">Today</Badge>}
            </div>
            {task.cases && (
              <div className="text-xs text-slate-500 font-mono">
                Case: {task.cases.case_number}
              </div>
            )}
          </div>
          <Button variant="outline" size="sm">View</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tasks</h1>
            <p className="text-slate-600 mt-1">Manage assignments and action items</p>
          </div>
          <Button className="gap-2 text-white hover:opacity-90" style={{ background: '#EF5A5A' }}>
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pending</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: '#D4A574' }}>{pendingTasks.length}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: '#FEF9F3' }}>
                  <Clock className="h-5 w-5" style={{ color: '#D4A574' }} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">In Progress</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: '#4A4284' }}>{inProgressTasks.length}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: '#F3F2F7' }}>
                  <Clock className="h-5 w-5" style={{ color: '#4A4284' }} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Overdue</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: '#EF5A5A' }}>{overdueTasks.length}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: '#FEF2F2' }}>
                  <AlertCircle className="h-5 w-5" style={{ color: '#EF5A5A' }} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Completed</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: '#10B981' }}>{completedTasks.length}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: '#ECFDF5' }}>
                  <CheckSquare className="h-5 w-5" style={{ color: '#10B981' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search tasks by title, description, or case number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-slate-600 mt-2">
                Found {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Tasks ({filteredTasks.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress ({inProgressTasks.length})</TabsTrigger>
            <TabsTrigger value="overdue">Overdue ({overdueTasks.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No tasks yet</h3>
                  <p className="text-slate-600 mb-6">Create your first task to get started</p>
                  <Button className="gap-2 text-white hover:opacity-90" style={{ background: '#EF5A5A' }}>
                    <Plus className="h-4 w-4" />
                    Create First Task
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredTasks.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {pendingTasks.map(task => <TaskCard key={task.id} task={task} />)}
            </div>
          </TabsContent>

          <TabsContent value="in_progress" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {inProgressTasks.map(task => <TaskCard key={task.id} task={task} />)}
            </div>
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4">
            {overdueTasks.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckSquare className="h-12 w-12 text-green-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No overdue tasks</h3>
                  <p className="text-slate-600">Great job staying on top of your work!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {overdueTasks.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {completedTasks.map(task => <TaskCard key={task.id} task={task} />)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
