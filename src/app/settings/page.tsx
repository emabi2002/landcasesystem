'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  User,
  Bell,
  Palette,
  Keyboard,
  Download,
  Shield,
  Save,
  RefreshCw,
  Mail,
  CheckCircle,
  AlertCircle,
  Calendar,
  FileText,
  CheckSquare,
  FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';

interface UserPreferences {
  // Display settings
  itemsPerPage: number;
  defaultView: 'list' | 'grid';
  compactMode: boolean;

  // Notification settings
  emailNotifications: boolean;
  emailDigest: 'none' | 'daily' | 'weekly';
  notifyOnCaseAssignment: boolean;
  notifyOnTaskDue: boolean;
  notifyOnStatusChange: boolean;
  notifyOnAlerts: boolean;
  notifyOnDocuments: boolean;
  notifyOnEvents: boolean;

  // Dashboard settings
  showRecentCases: boolean;
  showUpcomingTasks: boolean;
  showCalendarWidget: boolean;
  showQuickStats: boolean;

  // Export settings
  defaultExportFormat: 'excel' | 'pdf' | 'csv';
  includeHeaderInExports: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  itemsPerPage: 15,
  defaultView: 'list',
  compactMode: false,
  emailNotifications: true,
  emailDigest: 'daily',
  notifyOnCaseAssignment: true,
  notifyOnTaskDue: true,
  notifyOnStatusChange: true,
  notifyOnAlerts: true,
  notifyOnDocuments: false,
  notifyOnEvents: true,
  showRecentCases: true,
  showUpcomingTasks: true,
  showCalendarWidget: true,
  showQuickStats: true,
  defaultExportFormat: 'excel',
  includeHeaderInExports: true,
};

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams?.get('tab') || 'profile';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setUserEmail(user.email || '');

      // Load profile
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || '');
      }

      // Load preferences from localStorage
      const stored = localStorage.getItem(`user_preferences_${user.id}`);
      if (stored) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save to localStorage
      localStorage.setItem(`user_preferences_${user.id}`, JSON.stringify(preferences));

      // Also update individual page preferences
      localStorage.setItem('cases_items_per_page', preferences.itemsPerPage.toString());
      localStorage.setItem('tasks_items_per_page', preferences.itemsPerPage.toString());
      localStorage.setItem('documents_items_per_page', preferences.itemsPerPage.toString());
      localStorage.setItem('communications_items_per_page', preferences.itemsPerPage.toString());
      localStorage.setItem('calendar_items_per_page', preferences.itemsPerPage.toString());

      toast.success('Preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    setPreferences(DEFAULT_PREFERENCES);
    toast.info('Preferences reset to defaults (save to apply)');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto" />
            <p className="mt-4 text-slate-600">Loading settings...</p>
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
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Settings className="h-5 w-5 text-slate-600" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
                <p className="text-xs text-slate-500">Manage your account and preferences</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetToDefaults}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button size="sm" onClick={savePreferences} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList className="bg-white border">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="display" className="gap-2">
                <Palette className="h-4 w-4" />
                Display
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="exports" className="gap-2">
                <Download className="h-4 w-4" />
                Exports
              </TabsTrigger>
              <TabsTrigger value="shortcuts" className="gap-2">
                <Keyboard className="h-4 w-4" />
                Shortcuts
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Your account details and personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        value={userEmail}
                        disabled
                        className="mt-1 bg-slate-50"
                      />
                      <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Security
                    </h4>
                    <Button variant="outline" size="sm">
                      Change Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose how and when you want to be notified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email Notifications */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Email Notifications</Label>
                        <p className="text-sm text-slate-500">Receive notifications via email</p>
                      </div>
                      <Switch
                        checked={preferences.emailNotifications}
                        onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
                      />
                    </div>

                    {preferences.emailNotifications && (
                      <div className="ml-6 space-y-4 p-4 bg-slate-50 rounded-lg">
                        <div>
                          <Label>Email Digest Frequency</Label>
                          <Select
                            value={preferences.emailDigest}
                            onValueChange={(value: 'none' | 'daily' | 'weekly') =>
                              updatePreference('emailDigest', value)
                            }
                          >
                            <SelectTrigger className="w-48 mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No digest</SelectItem>
                              <SelectItem value="daily">Daily summary</SelectItem>
                              <SelectItem value="weekly">Weekly summary</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Notification Types */}
                  <div>
                    <h4 className="text-sm font-medium mb-4">Notify me about:</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FolderOpen className="h-4 w-4 text-emerald-600" />
                          <div>
                            <p className="text-sm font-medium">Case Assignments</p>
                            <p className="text-xs text-slate-500">When a case is assigned to you</p>
                          </div>
                        </div>
                        <Switch
                          checked={preferences.notifyOnCaseAssignment}
                          onCheckedChange={(checked) => updatePreference('notifyOnCaseAssignment', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckSquare className="h-4 w-4 text-amber-600" />
                          <div>
                            <p className="text-sm font-medium">Task Due Dates</p>
                            <p className="text-xs text-slate-500">When tasks are due soon or overdue</p>
                          </div>
                        </div>
                        <Switch
                          checked={preferences.notifyOnTaskDue}
                          onCheckedChange={(checked) => updatePreference('notifyOnTaskDue', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <div>
                            <p className="text-sm font-medium">Alerts & Urgent Matters</p>
                            <p className="text-xs text-slate-500">Important alerts requiring attention</p>
                          </div>
                        </div>
                        <Switch
                          checked={preferences.notifyOnAlerts}
                          onCheckedChange={(checked) => updatePreference('notifyOnAlerts', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium">Case Status Changes</p>
                            <p className="text-xs text-slate-500">When case status is updated</p>
                          </div>
                        </div>
                        <Switch
                          checked={preferences.notifyOnStatusChange}
                          onCheckedChange={(checked) => updatePreference('notifyOnStatusChange', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-indigo-600" />
                          <div>
                            <p className="text-sm font-medium">Upcoming Events</p>
                            <p className="text-xs text-slate-500">Reminders for hearings and events</p>
                          </div>
                        </div>
                        <Switch
                          checked={preferences.notifyOnEvents}
                          onCheckedChange={(checked) => updatePreference('notifyOnEvents', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium">New Documents</p>
                            <p className="text-xs text-slate-500">When documents are uploaded</p>
                          </div>
                        </div>
                        <Switch
                          checked={preferences.notifyOnDocuments}
                          onCheckedChange={(checked) => updatePreference('notifyOnDocuments', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Display Tab */}
            <TabsContent value="display">
              <Card>
                <CardHeader>
                  <CardTitle>Display Settings</CardTitle>
                  <CardDescription>Customize how the application looks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Label>Items Per Page</Label>
                      <Select
                        value={preferences.itemsPerPage.toString()}
                        onValueChange={(value) => updatePreference('itemsPerPage', parseInt(value))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 items</SelectItem>
                          <SelectItem value="15">15 items</SelectItem>
                          <SelectItem value="25">25 items</SelectItem>
                          <SelectItem value="50">50 items</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500 mt-1">Default number of items shown in tables</p>
                    </div>

                    <div>
                      <Label>Default View</Label>
                      <Select
                        value={preferences.defaultView}
                        onValueChange={(value: 'list' | 'grid') => updatePreference('defaultView', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="list">List View</SelectItem>
                          <SelectItem value="grid">Grid View</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500 mt-1">Default layout for data views</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Compact Mode</Label>
                      <p className="text-sm text-slate-500">Reduce spacing for denser information display</p>
                    </div>
                    <Switch
                      checked={preferences.compactMode}
                      onCheckedChange={(checked) => updatePreference('compactMode', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard">
              <Card>
                <CardHeader>
                  <CardTitle>Dashboard Customization</CardTitle>
                  <CardDescription>Choose what widgets to show on your dashboard</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Recent Cases</p>
                      <p className="text-xs text-slate-500">Show recently accessed cases</p>
                    </div>
                    <Switch
                      checked={preferences.showRecentCases}
                      onCheckedChange={(checked) => updatePreference('showRecentCases', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Upcoming Tasks</p>
                      <p className="text-xs text-slate-500">Show tasks due soon</p>
                    </div>
                    <Switch
                      checked={preferences.showUpcomingTasks}
                      onCheckedChange={(checked) => updatePreference('showUpcomingTasks', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Calendar Widget</p>
                      <p className="text-xs text-slate-500">Show mini calendar with events</p>
                    </div>
                    <Switch
                      checked={preferences.showCalendarWidget}
                      onCheckedChange={(checked) => updatePreference('showCalendarWidget', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Quick Stats</p>
                      <p className="text-xs text-slate-500">Show key metrics overview</p>
                    </div>
                    <Switch
                      checked={preferences.showQuickStats}
                      onCheckedChange={(checked) => updatePreference('showQuickStats', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Exports Tab */}
            <TabsContent value="exports">
              <Card>
                <CardHeader>
                  <CardTitle>Export Settings</CardTitle>
                  <CardDescription>Configure default export options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Default Export Format</Label>
                    <Select
                      value={preferences.defaultExportFormat}
                      onValueChange={(value: 'excel' | 'pdf' | 'csv') =>
                        updatePreference('defaultExportFormat', value)
                      }
                    >
                      <SelectTrigger className="w-48 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Include Header in Exports</Label>
                      <p className="text-sm text-slate-500">Add report header with date and title</p>
                    </div>
                    <Switch
                      checked={preferences.includeHeaderInExports}
                      onCheckedChange={(checked) => updatePreference('includeHeaderInExports', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shortcuts Tab */}
            <TabsContent value="shortcuts">
              <Card>
                <CardHeader>
                  <CardTitle>Keyboard Shortcuts</CardTitle>
                  <CardDescription>Quick reference for keyboard shortcuts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Global</h4>
                      <div className="grid gap-2">
                        <ShortcutRow keys={['⌘', 'K']} description="Open search" />
                        <ShortcutRow keys={['?']} description="Show keyboard shortcuts" />
                        <ShortcutRow keys={['Esc']} description="Close dialogs" />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-semibold mb-3">Navigation (Press G then...)</h4>
                      <div className="grid gap-2 md:grid-cols-2">
                        <ShortcutRow keys={['G', 'H']} description="Go to Dashboard" />
                        <ShortcutRow keys={['G', 'C']} description="Go to Cases" />
                        <ShortcutRow keys={['G', 'T']} description="Go to Tasks" />
                        <ShortcutRow keys={['G', 'D']} description="Go to Documents" />
                        <ShortcutRow keys={['G', 'E']} description="Go to Calendar" />
                        <ShortcutRow keys={['G', 'M']} description="Go to Communications" />
                        <ShortcutRow keys={['G', 'S']} description="Go to Settings" />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-semibold mb-3">Actions</h4>
                      <div className="grid gap-2">
                        <ShortcutRow keys={['N']} description="Create new (context-aware)" />
                        <ShortcutRow keys={['R']} description="Refresh current page" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-slate-50">
      <span className="text-sm text-slate-700">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-600"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto" />
            <p className="mt-4 text-slate-600">Loading settings...</p>
          </div>
        </div>
      </AppLayout>
    }>
      <SettingsContent />
    </Suspense>
  );
}
