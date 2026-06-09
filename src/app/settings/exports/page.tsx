'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Download,
  Plus,
  Calendar,
  FileSpreadsheet,
  FileText,
  Clock,
  Mail,
  Trash2,
  Edit,
  Play,
  Pause,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';

interface ScheduledExport {
  id: string;
  name: string;
  dataType: 'cases' | 'tasks' | 'documents' | 'communications' | 'events' | 'all';
  format: 'excel' | 'pdf' | 'csv';
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:mm format
  emailDelivery: boolean;
  emailRecipients: string[];
  filters?: Record<string, unknown>;
  active: boolean;
  lastRun?: string;
  lastStatus?: 'success' | 'failed';
  createdAt: string;
}

const DATA_TYPES = [
  { value: 'cases', label: 'Cases', icon: '📁' },
  { value: 'tasks', label: 'Tasks', icon: '✅' },
  { value: 'documents', label: 'Documents', icon: '📄' },
  { value: 'communications', label: 'Communications', icon: '💬' },
  { value: 'events', label: 'Events/Calendar', icon: '📅' },
  { value: 'all', label: 'All Data', icon: '📊' },
];

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export default function ExportSchedulingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<ScheduledExport[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledExport | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<ScheduledExport>>({
    name: '',
    dataType: 'cases',
    format: 'excel',
    frequency: 'weekly',
    dayOfWeek: 1,
    dayOfMonth: 1,
    time: '09:00',
    emailDelivery: false,
    emailRecipients: [],
    active: true,
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Load from localStorage (in a real app, this would be from a database)
      const stored = localStorage.getItem(`export_schedules_${user.id}`);
      if (stored) {
        setSchedules(JSON.parse(stored));
      } else {
        // Sample schedules for demo
        const sampleSchedules: ScheduledExport[] = [
          {
            id: '1',
            name: 'Weekly Cases Report',
            dataType: 'cases',
            format: 'excel',
            frequency: 'weekly',
            dayOfWeek: 1, // Monday
            time: '09:00',
            emailDelivery: true,
            emailRecipients: ['admin@dlpp.gov.pg'],
            active: true,
            lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            lastStatus: 'success',
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '2',
            name: 'Monthly Compliance Report',
            dataType: 'all',
            format: 'pdf',
            frequency: 'monthly',
            dayOfMonth: 1,
            time: '08:00',
            emailDelivery: true,
            emailRecipients: ['director@dlpp.gov.pg', 'compliance@dlpp.gov.pg'],
            active: true,
            lastRun: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            lastStatus: 'success',
            createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
        setSchedules(sampleSchedules);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSchedules = async (newSchedules: ScheduledExport[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      localStorage.setItem(`export_schedules_${user.id}`, JSON.stringify(newSchedules));
      setSchedules(newSchedules);
    } catch (error) {
      console.error('Error saving schedules:', error);
    }
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error('Please enter a name for the schedule');
      return;
    }

    const newSchedule: ScheduledExport = {
      id: editingSchedule?.id || Date.now().toString(),
      name: formData.name || '',
      dataType: formData.dataType || 'cases',
      format: formData.format || 'excel',
      frequency: formData.frequency || 'weekly',
      dayOfWeek: formData.dayOfWeek,
      dayOfMonth: formData.dayOfMonth,
      time: formData.time || '09:00',
      emailDelivery: formData.emailDelivery || false,
      emailRecipients: formData.emailRecipients || [],
      active: formData.active !== false,
      createdAt: editingSchedule?.createdAt || new Date().toISOString(),
    };

    let updatedSchedules: ScheduledExport[];
    if (editingSchedule) {
      updatedSchedules = schedules.map(s => s.id === editingSchedule.id ? newSchedule : s);
      toast.success('Export schedule updated');
    } else {
      updatedSchedules = [...schedules, newSchedule];
      toast.success('Export schedule created');
    }

    saveSchedules(updatedSchedules);
    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      dataType: 'cases',
      format: 'excel',
      frequency: 'weekly',
      dayOfWeek: 1,
      dayOfMonth: 1,
      time: '09:00',
      emailDelivery: false,
      emailRecipients: [],
      active: true,
    });
    setEditingSchedule(null);
  };

  const handleEdit = (schedule: ScheduledExport) => {
    setEditingSchedule(schedule);
    setFormData(schedule);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const updatedSchedules = schedules.filter(s => s.id !== id);
    saveSchedules(updatedSchedules);
    toast.success('Export schedule deleted');
  };

  const toggleActive = (id: string) => {
    const updatedSchedules = schedules.map(s =>
      s.id === id ? { ...s, active: !s.active } : s
    );
    saveSchedules(updatedSchedules);
    const schedule = schedules.find(s => s.id === id);
    toast.success(`Schedule ${schedule?.active ? 'paused' : 'activated'}`);
  };

  const runNow = (schedule: ScheduledExport) => {
    toast.success(`Running export: ${schedule.name}`, {
      description: 'This would trigger the export immediately in production.',
    });

    // Update last run status
    const updatedSchedules = schedules.map(s =>
      s.id === schedule.id
        ? { ...s, lastRun: new Date().toISOString(), lastStatus: 'success' as const }
        : s
    );
    saveSchedules(updatedSchedules);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-blue-600" />;
    }
  };

  const getNextRunDate = (schedule: ScheduledExport): string => {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);

    const nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    if (schedule.frequency === 'daily') {
      if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 1);
    } else if (schedule.frequency === 'weekly') {
      const targetDay = schedule.dayOfWeek || 0;
      const daysUntil = (targetDay - now.getDay() + 7) % 7 || 7;
      nextRun.setDate(now.getDate() + daysUntil);
      if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 7);
    } else if (schedule.frequency === 'monthly') {
      nextRun.setDate(schedule.dayOfMonth || 1);
      if (nextRun <= now) nextRun.setMonth(nextRun.getMonth() + 1);
    }

    return format(nextRun, 'MMM dd, yyyy HH:mm');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto" />
            <p className="mt-4 text-slate-600">Loading export schedules...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-5xl mx-auto">
            <Link href="/settings?tab=exports">
              <Button variant="ghost" size="sm" className="mb-3">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Settings
              </Button>
            </Link>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 text-slate-600" />
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Scheduled Exports</h1>
                  <p className="text-xs text-slate-500">Automate recurring data exports</p>
                </div>
              </div>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-1" />
                    New Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {editingSchedule ? 'Edit Export Schedule' : 'Create Export Schedule'}
                    </DialogTitle>
                    <DialogDescription>
                      Set up automatic data exports on a recurring schedule
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Schedule Name</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Weekly Cases Report"
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Data Type</Label>
                        <Select
                          value={formData.dataType}
                          onValueChange={(value: ScheduledExport['dataType']) =>
                            setFormData({ ...formData, dataType: value })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DATA_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.icon} {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Format</Label>
                        <Select
                          value={formData.format}
                          onValueChange={(value: ScheduledExport['format']) =>
                            setFormData({ ...formData, format: value })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="csv">CSV</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Frequency</Label>
                        <Select
                          value={formData.frequency}
                          onValueChange={(value: ScheduledExport['frequency']) =>
                            setFormData({ ...formData, frequency: value })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.frequency === 'weekly' && (
                        <div>
                          <Label>Day of Week</Label>
                          <Select
                            value={formData.dayOfWeek?.toString()}
                            onValueChange={(value) =>
                              setFormData({ ...formData, dayOfWeek: parseInt(value) })
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS_OF_WEEK.map((day, i) => (
                                <SelectItem key={i} value={i.toString()}>{day}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {formData.frequency === 'monthly' && (
                        <div>
                          <Label>Day of Month</Label>
                          <Select
                            value={formData.dayOfMonth?.toString()}
                            onValueChange={(value) =>
                              setFormData({ ...formData, dayOfMonth: parseInt(value) })
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 28 }, (_, i) => (
                                <SelectItem key={i + 1} value={(i + 1).toString()}>
                                  {i + 1}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="mt-1 w-32"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-slate-500" />
                        <div>
                          <p className="text-sm font-medium">Email Delivery</p>
                          <p className="text-xs text-slate-500">Send export via email</p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.emailDelivery}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, emailDelivery: checked })
                        }
                      />
                    </div>

                    {formData.emailDelivery && (
                      <div>
                        <Label>Email Recipients (comma-separated)</Label>
                        <Input
                          value={formData.emailRecipients?.join(', ')}
                          onChange={(e) => setFormData({
                            ...formData,
                            emailRecipients: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          })}
                          placeholder="email1@example.com, email2@example.com"
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700">
                      {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-6 py-6">
          {schedules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Scheduled Exports</h3>
                <p className="text-slate-500 text-center mb-6">
                  Create automated export schedules to receive regular data reports
                </p>
                <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-1" />
                  Create First Schedule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <Card key={schedule.id} className={!schedule.active ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          {getFormatIcon(schedule.format)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900">{schedule.name}</h3>
                            <Badge variant={schedule.active ? 'default' : 'secondary'} className="text-xs">
                              {schedule.active ? 'Active' : 'Paused'}
                            </Badge>
                            {schedule.lastStatus && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  schedule.lastStatus === 'success'
                                    ? 'border-green-300 text-green-700'
                                    : 'border-red-300 text-red-700'
                                }`}
                              >
                                {schedule.lastStatus === 'success' ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                                Last run: {schedule.lastStatus}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Download className="h-3.5 w-3.5" />
                              {DATA_TYPES.find(t => t.value === schedule.dataType)?.label}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {schedule.frequency === 'daily' && `Daily at ${schedule.time}`}
                              {schedule.frequency === 'weekly' && `${DAYS_OF_WEEK[schedule.dayOfWeek || 0]}s at ${schedule.time}`}
                              {schedule.frequency === 'monthly' && `Day ${schedule.dayOfMonth} at ${schedule.time}`}
                            </span>
                            {schedule.emailDelivery && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" />
                                {schedule.emailRecipients?.length || 0} recipient(s)
                              </span>
                            )}
                          </div>
                          {schedule.active && (
                            <p className="text-xs text-slate-400 mt-1">
                              Next run: {getNextRunDate(schedule)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => runNow(schedule)}
                          className="h-8 w-8"
                          title="Run now"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActive(schedule.id)}
                          className="h-8 w-8"
                          title={schedule.active ? 'Pause' : 'Activate'}
                        >
                          {schedule.active ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(schedule)}
                          className="h-8 w-8"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Export Schedule</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{schedule.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(schedule.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Info Card */}
          <Card className="mt-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">About Scheduled Exports</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Scheduled exports run automatically at the specified times. Exports are generated
                    based on the data available at the time of execution. Email delivery requires
                    Supabase Edge Functions to be configured.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
