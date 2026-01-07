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
import { Shield, Plus, Search, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog } from '@/components/forms/AlertDialog';
import { format } from 'date-fns';
import { CaseSelector } from '@/components/forms/CaseSelector';

interface ClosedCase {
  id: string;
  case_id: string;
  case_number: string;
  case_title: string;
  closure_type: string;
  court_order_date: string;
  court_order_details: string;
  final_status: string;
  outcome_summary: string;
  lessons_learned: string | null;
  closed_at: string;
}

export default function ClosurePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [closedCases, setClosedCases] = useState<ClosedCase[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    case_id: '',
    closure_type: 'default_judgement',
    court_order_date: '',
    court_order_details: '',
    final_status: 'closed',
    outcome_summary: '',
    lessons_learned: '',
    archive_instructions: '',
  });

  useEffect(() => {
    checkAuth();
    loadClosedCases();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
  };

  const loadClosedCases = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('case_closure')
        .select(`
          *,
          cases!inner(case_number, title)
        `)
        .order('closed_at', { ascending: false});

      if (error) throw error;

      const formatted = ((data as any) || []).map((c: any) => ({
        id: c.id,
        case_id: c.case_id,
        case_number: c.cases?.case_number || '',
        case_title: c.cases?.title || '',
        closure_type: c.closure_type,
        court_order_date: c.court_order_date,
        court_order_details: c.court_order_details,
        final_status: c.final_status,
        outcome_summary: c.outcome_summary,
        lessons_learned: c.lessons_learned,
        closed_at: c.closed_at,
      }));

      setClosedCases(formatted);
    } catch (error) {
      console.error('Error loading closed cases:', error);
      toast.error('Failed to load closed cases');
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

      // Update case with closure information
      const { error } = await (supabase as any)
        .from('cases')
        .update({
          status: 'closed',
          closure_type: formData.closure_type,
          closed_date: new Date().toISOString(),
          closure_notes: `${formData.outcome_summary}\n\nCourt Order Date: ${formData.court_order_date}\n\nCourt Order Details: ${formData.court_order_details}\n\nLessons Learned: ${formData.lessons_learned || 'N/A'}`,
        })
        .eq('id', formData.case_id);

      if (error) throw error;

      // Record closure in case history
      await (supabase as any)
        .from('case_history')
        .insert({
          case_id: formData.case_id,
          action: 'Case Closed',
          description: formData.outcome_summary,
          metadata: {
            closure_type: formData.closure_type,
            court_order_date: formData.court_order_date,
            court_order_details: formData.court_order_details,
            lessons_learned: formData.lessons_learned,
          },
        });

      toast.success('Case closed successfully! Proceed to Step 7 to notify parties.');
      setShowForm(false);
      setFormData({
        case_id: '',
        closure_type: 'default_judgement',
        court_order_date: '',
        court_order_details: '',
        final_status: 'closed',
        outcome_summary: '',
        lessons_learned: '',
        archive_instructions: '',
      });
      loadClosedCases();
    } catch (error) {
      console.error('Error closing case:', error);
      toast.error('Failed to close case');
    } finally {
      setLoading(false);
    }
  };

  const getClosureTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      default_judgement: { label: 'Default Judgement', color: 'bg-purple-100 text-purple-800 border-purple-300' },
      summary_determined: { label: 'Summary Determined', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      dismissed_want_prosecution: { label: 'Dismissed - Want of Prosecution', color: 'bg-orange-100 text-orange-800 border-orange-300' },
      dismissed_want_process: { label: 'Dismissed - Want of Process', color: 'bg-orange-100 text-orange-800 border-orange-300' },
      incompetent: { label: 'Incompetent', color: 'bg-red-100 text-red-800 border-red-300' },
      appeal_granted: { label: 'Appeal Granted', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
      judicial_review: { label: 'Judicial Review', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
      court_order_plaintiff: { label: 'Court Order - Plaintiff Favour', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    };
    const badge = badges[type] || { label: type, color: 'bg-gray-100 text-gray-800 border-gray-300' };
    return <Badge className={`${badge.color} border`}>{badge.label}</Badge>;
  };

  const filteredCases = closedCases.filter(c =>
    c.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.case_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.closure_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardNav />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Step 6: Case Closure</h1>
              <p className="text-slate-600 mt-1">Judgment and Case Closure</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowForm(!showForm)}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Close Case
            </Button>

            {formData.case_id && (
              <AlertDialog
                caseId={formData.case_id}
                currentStep="Step 6: Case Closure"
              />
            )}
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">How This Module Works</h3>
                <ul className="text-sm text-red-800 space-y-1.5">
                  <li>• <strong>Compliance Satisfied:</strong> Case reaches here after all compliance obligations are complete (Step 5)</li>
                  <li>• <strong>Court Judgment:</strong> Record the court's final judgment and all related documents</li>
                  <li>• <strong>Case Closure:</strong> Formally close the case with outcome summary and lessons learned</li>
                  <li>• <strong>Archive:</strong> All documents and actions stored under the same Case ID for future reference</li>
                  <li>• <strong>Next Step:</strong> Proceed to Step 7 to notify all relevant parties of the outcome</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Case Closure Form */}
        {showForm && (
          <Card className="border-2 border-red-300">
            <CardHeader>
              <CardTitle>Close Case</CardTitle>
              <CardDescription>
                Record court judgment and formally close the case
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
                    <Label htmlFor="closure_type">Court Order Type *</Label>
                    <Select
                      value={formData.closure_type}
                      onValueChange={(value) => setFormData({ ...formData, closure_type: value })}
                    >
                      <SelectTrigger id="closure_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default_judgement">Default Judgement</SelectItem>
                        <SelectItem value="summary_determined">Summary Determined</SelectItem>
                        <SelectItem value="dismissed_want_prosecution">Dismissed - Want of Prosecution</SelectItem>
                        <SelectItem value="dismissed_want_process">Dismissed - Want of Process</SelectItem>
                        <SelectItem value="incompetent">Incompetent</SelectItem>
                        <SelectItem value="appeal_granted">Appeal Granted</SelectItem>
                        <SelectItem value="judicial_review">Judicial Review</SelectItem>
                        <SelectItem value="court_order_plaintiff">Court Order Granted in Favour of the Plaintiff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="court_order_date">Court Order Date *</Label>
                  <Input
                    id="court_order_date"
                    type="date"
                    value={formData.court_order_date}
                    onChange={(e) => setFormData({ ...formData, court_order_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="court_order_details">Court Order Details *</Label>
                  <Textarea
                    id="court_order_details"
                    placeholder="Full details of the court order and judgment..."
                    value={formData.court_order_details}
                    onChange={(e) => setFormData({ ...formData, court_order_details: e.target.value })}
                    required
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outcome_summary">Outcome Summary *</Label>
                  <Textarea
                    id="outcome_summary"
                    placeholder="Summary of the case outcome and implications..."
                    value={formData.outcome_summary}
                    onChange={(e) => setFormData({ ...formData, outcome_summary: e.target.value })}
                    required
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lessons_learned">Lessons Learned</Label>
                  <Textarea
                    id="lessons_learned"
                    placeholder="Key lessons learned from this case for future reference..."
                    value={formData.lessons_learned}
                    onChange={(e) => setFormData({ ...formData, lessons_learned: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="archive_instructions">Archive Instructions</Label>
                  <Textarea
                    id="archive_instructions"
                    placeholder="Instructions for archiving case files..."
                    value={formData.archive_instructions}
                    onChange={(e) => setFormData({ ...formData, archive_instructions: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-emerald-900 mb-1">After Closure</h4>
                      <p className="text-sm text-emerald-800">
                        After closing this case, proceed to <strong>Step 7 (Notifications)</strong> to notify all relevant parties of the court's decision.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Close Case
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
            placeholder="Search closed cases by case number, title, or closure type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Closed Cases List */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-slate-500">Loading closed cases...</div>
              </CardContent>
            </Card>
          ) : filteredCases.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No closed cases found</h3>
                <p className="text-slate-600 mb-6">
                  {closedCases.length === 0
                    ? 'Closed cases will appear here once you close a case'
                    : 'Try adjusting your search criteria'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredCases.map((closedCase) => (
              <Card key={closedCase.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {closedCase.case_number} - {closedCase.case_title}
                        </h3>
                        {getClosureTypeBadge(closedCase.closure_type)}
                      </div>
                      <p className="text-sm text-slate-600">
                        Court Order Date: {format(new Date(closedCase.court_order_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                      Closed: {format(new Date(closedCase.closed_at), 'MMM dd, yyyy')}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-1">Court Order Details:</h4>
                      <p className="text-sm text-slate-600">{closedCase.court_order_details}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-1">Outcome Summary:</h4>
                      <p className="text-sm text-slate-600">{closedCase.outcome_summary}</p>
                    </div>
                    {closedCase.lessons_learned && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-1">Lessons Learned:</h4>
                        <p className="text-sm text-slate-600">{closedCase.lessons_learned}</p>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-slate-500">
                    Final Status: {closedCase.final_status}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {filteredCases.length > 0 && (
          <p className="text-sm text-slate-600 text-center">
            Showing {filteredCases.length} of {closedCases.length} closed cases
          </p>
        )}
      </div>
    </div>
  );
}
