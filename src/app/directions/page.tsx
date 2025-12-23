'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Plus, Search, AlertCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog } from '@/components/forms/AlertDialog';
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
  const [directions, setDirections] = useState<Direction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    case_id: '',
    source: 'secretary_lands',
    subject: '',
    content: '',
    priority: 'medium',
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
          cases!inner(case_number, title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = ((data as any) || []).map((d: any) => ({
        id: d.id,
        case_id: d.case_id,
        case_number: d.cases?.case_number || '',
        case_title: d.cases?.title || '',
        source: d.source,
        subject: d.subject,
        content: d.content,
        priority: d.priority,
        due_date: d.due_date,
        assigned_to: d.assigned_to,
        created_at: d.created_at,
      }));

      setDirections(formatted);
    } catch (error) {
      console.error('Error loading directions:', error);
      toast.error('Failed to load directions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Auto-generate direction number
      const timestamp = Date.now().toString().slice(-6);
      const direction_number = `DIR-${new Date().getFullYear()}-${timestamp}`;

      const { error } = await (supabase as any)
        .from('directions')
        .insert([{
          ...formData,
          direction_number,
          issued_by: user.id,
          issued_date: new Date().toISOString(),
          status: 'pending',
        }]);

      if (error) throw error;

      toast.success('Direction issued successfully!');
      setShowForm(false);
      setFormData({
        case_id: '',
        source: 'secretary_lands',
        subject: '',
        content: '',
        priority: 'medium',
        due_date: '',
        assigned_to: '',
      });
      loadDirections();
    } catch (error) {
      console.error('Error creating direction:', error);
      toast.error('Failed to issue direction');
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
    return <Badge className={`${badge.color} border`}>{badge.label}</Badge>;
  };

  const filteredDirections = directions.filter(d =>
    d.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.case_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardNav />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Step 2: Directions</h1>
              <p className="text-slate-600 mt-1">Secretary / Director / Manager instructions</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowForm(!showForm)}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Issue New Direction
            </Button>

            {formData.case_id && (
              <AlertDialog
                caseId={formData.case_id}
                currentStep="Step 2: Directions"
              />
            )}
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">How This Module Works</h3>
                <ul className="text-sm text-blue-800 space-y-1.5">
                  <li>• <strong>Repeatable:</strong> Directions can be issued multiple times throughout case lifecycle</li>
                  <li>• <strong>Hierarchical:</strong> Secretary, Director, or Manager can issue directions</li>
                  <li>• <strong>Actionable:</strong> Each direction specifies action required and can be assigned</li>
                  <li>• <strong>Linked:</strong> All directions reference the original Case ID from Step 1</li>
                  <li>• <strong>Iterative:</strong> Cases return here from Compliance (Step 5) for updated directions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Issue Direction Form */}
        {showForm && (
          <Card className="border-2 border-blue-300">
            <CardHeader>
              <CardTitle>Issue New Direction</CardTitle>
              <CardDescription>
                Issue formal instructions for a case
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
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
                    <Label htmlFor="source">Issued By *</Label>
                    <Select
                      value={formData.source}
                      onValueChange={(value) => setFormData({ ...formData, source: value })}
                    >
                      <SelectTrigger id="source">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="secretary_lands">Secretary Lands</SelectItem>
                        <SelectItem value="director_legal_services">Director Legal Services</SelectItem>
                        <SelectItem value="manager_legal_services">Manager Legal Services</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      placeholder="e.g., Prepare response, Request compliance, Assign officer, etc."
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority *</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
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
                  <Label htmlFor="content">Direction Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="Detailed instructions and directives..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                    rows={6}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assigned_to">Assign To</Label>
                    <Input
                      id="assigned_to"
                      placeholder="Officer name (triggers Step 3)"
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Issue Direction
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search directions by case number, title, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Directions List */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-slate-500">Loading directions...</div>
              </CardContent>
            </Card>
          ) : filteredDirections.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No directions found</h3>
                <p className="text-slate-600 mb-6">
                  {directions.length === 0
                    ? 'Issue your first direction to get started'
                    : 'Try adjusting your search criteria'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredDirections.map((direction) => (
              <Card key={direction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {direction.subject}
                        </h3>
                        {getSourceBadge(direction.source)}
                        <Badge className={
                          direction.priority === 'urgent' ? 'bg-red-100 text-red-800 border-red-300 border' :
                          direction.priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-300 border' :
                          direction.priority === 'medium' ? 'bg-blue-100 text-blue-800 border-blue-300 border' :
                          'bg-gray-100 text-gray-800 border-gray-300 border'
                        }>
                          {direction.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 font-mono">
                        Case: {direction.case_number} - {direction.case_title}
                      </p>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                      {format(new Date(direction.created_at), 'MMM dd, yyyy')}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-1">Direction:</h4>
                      <p className="text-sm text-slate-600 whitespace-pre-line">{direction.content}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {direction.due_date && (
                      <span>Due Date: {format(new Date(direction.due_date), 'MMM dd, yyyy')}</span>
                    )}
                    {direction.assigned_to && (
                      <span>Assigned to: {direction.assigned_to}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {filteredDirections.length > 0 && (
          <p className="text-sm text-slate-600 text-center">
            Showing {filteredDirections.length} of {directions.length} directions
          </p>
        )}
      </div>
    </div>
  );
}
