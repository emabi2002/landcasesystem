'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SelectWithAdd } from '@/components/ui/select-with-add';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Plus, Search, AlertCircle, RefreshCw, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CaseSelector } from '@/components/forms/CaseSelector';

interface Direction {
  id: string;
  case_id: string;
  case_number: string;
  case_title: string;
  source: string;
  subject: string;
  content: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  created_at: string;
}

export default function DirectionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tableExists, setTableExists] = useState(true);
  const [formData, setFormData] = useState({
    case_id: '',
    source: 'secretary_lands',
    subject: '',
    content: '',
    priority: '',
    due_date: '',
    assigned_to: '',
  });

  useEffect(() => {
    checkAuth();
    loadDirections();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
  };

  const loadDirections = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('directions')
        .select(`
          *,
          cases(case_number, title)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        // Check if it's a "relation does not exist" error
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          console.warn('Directions table does not exist. Please run the database migration.');
          setTableExists(false);
          setDirections([]);
        } else {
          throw error;
        }
        return;
      }

      setTableExists(true);
      const formatted = ((data as any) || []).map((d: any) => ({
        id: d.id,
        case_id: d.case_id,
        case_number: d.cases?.case_number || '',
        case_title: d.cases?.title || '',
        source: d.source || '',
        subject: d.subject || '',
        content: d.content || '',
        priority: d.priority || 'medium',
        due_date: d.due_date,
        assigned_to: d.assigned_to,
        created_at: d.created_at,
      }));

      setDirections(formatted);
    } catch (error) {
      console.error('Error loading directions:', error);
      toast.error('Failed to load directions');
      setDirections([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDirections();
    toast.success('Data refreshed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.case_id) {
      toast.error('Please select a case');
      return;
    }

    if (!formData.subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Please enter direction content');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const timestamp = Date.now().toString().slice(-6);
      const direction_number = `DIR-${new Date().getFullYear()}-${timestamp}`;

      // Convert empty strings to null for optional fields
      const insertData = {
        case_id: formData.case_id,
        source: formData.source || 'secretary_lands',
        subject: formData.subject.trim(),
        content: formData.content.trim(),
        priority: formData.priority || 'medium',
        due_date: formData.due_date ? formData.due_date : null,
        assigned_to: formData.assigned_to ? formData.assigned_to : null,
        direction_number,
        issued_by: user.id,
        issued_date: new Date().toISOString(),
        status: 'pending',
      };

      const { error } = await (supabase as any)
        .from('directions')
        .insert([insertData]);

      if (error) throw error;

      toast.success('Direction issued successfully!');
      setShowForm(false);
      setFormData({
        case_id: '',
        source: 'secretary_lands',
        subject: '',
        content: '',
        priority: '',
        due_date: '',
        assigned_to: '',
      });
      loadDirections();
    } catch (error: any) {
      console.error('Error creating direction:', error);
      if (error.message?.includes('does not exist')) {
        toast.error('Directions table not found. Please contact your administrator.');
      } else {
        toast.error('Failed to issue direction');
      }
    } finally {
      setLoading(false);
    }
  };

  const getSourceBadge = (source: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      secretary_lands: { label: 'Secretary Lands', color: 'bg-purple-100 text-purple-800 border-purple-300' },
      director_legal_services: { label: 'Director Legal Services', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      manager_legal_services: { label: 'Manager Legal Services', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    };
    const badge = badges[source] || { label: source, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={`${badge.color} border text-xs`}>{badge.label}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const filteredDirections = directions.filter(d =>
    (d.case_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.case_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const urgentCount = directions.filter(d => d.priority === 'urgent' || d.priority === 'high').length;

  if (loading && directions.length === 0) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto" />
            <p className="mt-4 text-slate-600">Loading directions...</p>
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
              <ClipboardList className="h-5 w-5 text-slate-600" />
              <div className="h-6 w-px bg-slate-300" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Directions</h1>
                <p className="text-xs text-slate-500">Step 2: Secretary / Director / Manager instructions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={() => setShowForm(!showForm)}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={!tableExists}
              >
                {showForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                {showForm ? 'Cancel' : 'Issue Direction'}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Table Not Exists Warning */}
          {!tableExists && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-900 text-sm mb-2">Database Setup Required</h3>
                  <p className="text-xs text-amber-800">
                    The directions table does not exist in the database. Please run the database migration
                    script <code className="bg-amber-100 px-1 rounded">database-workflow-extensions.sql</code> in
                    your Supabase SQL Editor to enable this feature.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 text-sm mb-2">How This Module Works</h3>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• <strong>Repeatable:</strong> Directions can be issued multiple times throughout case lifecycle</li>
                  <li>• <strong>Hierarchical:</strong> Secretary, Director, or Manager can issue directions</li>
                  <li>• <strong>Actionable:</strong> Each direction specifies action required and can be assigned</li>
                  <li>• <strong>Iterative:</strong> Cases return here from Compliance (Step 5) for updated directions</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Issue Direction Form */}
          {showForm && tableExists && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Issue New Direction</h2>
                <p className="text-xs text-slate-500 mt-1">Issue formal instructions for a case</p>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <CaseSelector
                      value={formData.case_id}
                      onValueChange={(value) => setFormData({ ...formData, case_id: value })}
                      label="Case ID"
                      placeholder="Search and select case..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Issued By *</Label>
                    <Select
                      value={formData.source}
                      onValueChange={(value) => setFormData({ ...formData, source: value })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select issuer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="secretary_lands">Secretary Lands</SelectItem>
                        <SelectItem value="director_legal_services">Director Legal Services</SelectItem>
                        <SelectItem value="manager_legal_services">Manager Legal Services</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Subject *</Label>
                    <Input
                      placeholder="e.g., Prepare response, Request compliance, Assign officer, etc."
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-600">Direction Content *</Label>
                  <Textarea
                    placeholder="Detailed instructions and directives..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Due Date</Label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="h-9"
                    />
                  </div>

                  <SelectWithAdd
                    value={formData.assigned_to}
                    onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                    tableName="action_officers"
                    label="Assign To"
                    placeholder="Officer name (triggers Step 3)"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Issue Direction
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Main Content Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            {/* Summary Bar */}
            <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm">
                <span className="text-slate-600">
                  <span className="font-semibold text-blue-600">{directions.length}</span> Total
                </span>
                <span className="text-slate-600">
                  <span className="font-semibold text-red-600">{urgentCount}</span> Urgent/High
                </span>
              </div>
            </div>

            {/* Search */}
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Search</h2>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search directions by case number, title, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>

            {/* Directions List */}
            <div className="p-6">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Directions List</h2>

              {filteredDirections.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No directions found</h3>
                  <p className="text-slate-600 text-sm">
                    {directions.length === 0
                      ? 'Issue your first direction to get started'
                      : 'Try adjusting your search criteria'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDirections.map((direction) => (
                    <div key={direction.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-slate-900">
                              {direction.subject}
                            </h3>
                            {getSourceBadge(direction.source)}
                            <Badge className={`text-xs ${
                              direction.priority === 'urgent' ? 'bg-red-100 text-red-800 border-red-300 border' :
                              direction.priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-300 border' :
                              direction.priority === 'medium' ? 'bg-blue-100 text-blue-800 border-blue-300 border' :
                              'bg-gray-100 text-gray-800 border-gray-300 border'
                            }`}>
                              {direction.priority || 'medium'}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 font-mono">
                            Case: {direction.case_number} - {direction.case_title}
                          </p>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          {formatDate(direction.created_at)}
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-slate-600 whitespace-pre-line">{direction.content}</p>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {direction.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {formatDate(direction.due_date)}
                          </span>
                        )}
                        {direction.assigned_to && (
                          <span>Assigned to: {direction.assigned_to}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {filteredDirections.length > 0 && (
              <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
                Showing {filteredDirections.length} of {directions.length} directions
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
