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
import { Users, Plus, Search, AlertCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog } from '@/components/forms/AlertDialog';
import { format } from 'date-fns';
import { CaseSelector } from '@/components/forms/CaseSelector';

interface Allocation {
  id: string;
  case_id: string;
  case_number: string;
  case_title: string;
  assigned_to: string;
  assigned_by: string;
  direction_reference: string | null;
  assignment_date: string;
  assignment_reason: string;
  instructions: string | null;
  priority: string;
  created_at: string;
}

export default function AllocationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    case_id: '',
    assigned_to: '',
    direction_reference: '',
    assignment_reason: '',
    instructions: '',
    priority: 'medium',
  });

  useEffect(() => {
    checkAuth();
    loadAllocations();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
  };

  const loadAllocations = async () => {
    try {
      const { data, error} = await (supabase as any)
        .from('case_delegations')
        .select(`
          *,
          cases!inner(case_number, title)
        `)
        .order('delegation_date', { ascending: false });

      if (error) throw error;

      const formatted = ((data as any) || []).map((a: any) => ({
        id: a.id,
        case_id: a.case_id,
        case_number: a.cases?.case_number || '',
        case_title: a.cases?.title || '',
        assigned_to: a.delegated_to,
        assigned_by: a.delegated_by,
        direction_reference: null,
        assignment_date: a.delegation_date,
        assignment_reason: a.instructions || '',
        instructions: a.instructions,
        priority: 'medium',
        created_at: a.delegation_date,
      }));

      setAllocations(formatted);
    } catch (error) {
      console.error('Error loading allocations:', error);
      toast.error('Failed to load allocations');
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

      const { error } = await (supabase as any)
        .from('case_delegations')
        .insert([{
          case_id: formData.case_id,
          delegated_by: user.id,
          delegated_to: formData.assigned_to,
          delegation_date: new Date().toISOString(),
          instructions: `${formData.assignment_reason}\n\nInstructions: ${formData.instructions}`,
          status: 'active',
        }]);

      if (error) throw error;

      toast.success('Case allocated successfully!');
      setShowForm(false);
      setFormData({
        case_id: '',
        assigned_to: '',
        direction_reference: '',
        assignment_reason: '',
        instructions: '',
        priority: 'medium',
      });
      loadAllocations();
    } catch (error) {
      console.error('Error allocating case:', error);
      toast.error('Failed to allocate case');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      low: { label: 'Low', color: 'bg-slate-100 text-slate-700 border-slate-300' },
      medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700 border-blue-300' },
      high: { label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-300' },
      urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-300' },
    };
    const badge = badges[priority] || badges.medium;
    return <Badge className={`${badge.color} border`}>{badge.label}</Badge>;
  };

  const filteredAllocations = allocations.filter(a =>
    a.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.case_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.assigned_to.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardNav />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Step 3: Case Allocation</h1>
              <p className="text-slate-600 mt-1">Manager assigns cases to Litigation Officers</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowForm(!showForm)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Allocate Case
            </Button>

            {formData.case_id && (
              <AlertDialog
                caseId={formData.case_id}
                currentStep="Step 3: Case Allocation"
              />
            )}
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-emerald-900 mb-2">How This Module Works</h3>
                <ul className="text-sm text-emerald-800 space-y-1.5">
                  <li>• <strong>Manager Action:</strong> Manager Legal Services assigns cases to Litigation Officers</li>
                  <li>• <strong>Direction Based:</strong> Allocation references the directive from Step 2</li>
                  <li>• <strong>Priority Setting:</strong> Manager sets priority level for the case</li>
                  <li>• <strong>Instructions:</strong> Manager provides specific instructions to the assigned officer</li>
                  <li>• <strong>Triggers Step 4:</strong> Assignment activates the Litigation Officer's workspace</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Allocation Form */}
        {showForm && (
          <Card className="border-2 border-emerald-300">
            <CardHeader>
              <CardTitle>Allocate Case to Litigation Officer</CardTitle>
              <CardDescription>
                Assign a case based on directions from Step 2
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
                    <Label htmlFor="assigned_to">Assign To (Litigation Officer) *</Label>
                    <Input
                      id="assigned_to"
                      placeholder="Officer name"
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="direction_reference">Direction Reference</Label>
                    <Input
                      id="direction_reference"
                      placeholder="Reference to Step 2 directive"
                      value={formData.direction_reference}
                      onChange={(e) => setFormData({ ...formData, direction_reference: e.target.value })}
                    />
                    <p className="text-xs text-slate-500">Link to the direction that triggered this allocation</p>
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
                  <Label htmlFor="assignment_reason">Assignment Reason *</Label>
                  <Textarea
                    id="assignment_reason"
                    placeholder="Why this officer is being assigned to this case..."
                    value={formData.assignment_reason}
                    onChange={(e) => setFormData({ ...formData, assignment_reason: e.target.value })}
                    required
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Specific instructions for the litigation officer..."
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Allocate Case
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
            placeholder="Search allocations by case number, title, or officer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Allocations List */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-slate-500">Loading allocations...</div>
              </CardContent>
            </Card>
          ) : filteredAllocations.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No allocations found</h3>
                <p className="text-slate-600 mb-6">
                  {allocations.length === 0
                    ? 'Allocate your first case to get started'
                    : 'Try adjusting your search criteria'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAllocations.map((allocation) => (
              <Card key={allocation.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {allocation.case_number} - {allocation.case_title}
                        </h3>
                        {getPriorityBadge(allocation.priority)}
                      </div>
                      <p className="text-sm text-slate-600">
                        Assigned to: <span className="font-medium">{allocation.assigned_to}</span>
                      </p>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                      {format(new Date(allocation.assignment_date), 'MMM dd, yyyy')}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-1">Assignment Reason:</h4>
                      <p className="text-sm text-slate-600">{allocation.assignment_reason}</p>
                    </div>
                    {allocation.instructions && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-1">Instructions:</h4>
                        <p className="text-sm text-slate-600">{allocation.instructions}</p>
                      </div>
                    )}
                  </div>

                  {allocation.direction_reference && (
                    <div className="text-xs text-slate-500">
                      Direction Reference: {allocation.direction_reference}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {filteredAllocations.length > 0 && (
          <p className="text-sm text-slate-600 text-center">
            Showing {filteredAllocations.length} of {allocations.length} allocations
          </p>
        )}
      </div>
    </div>
  );
}
