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
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Plus, AlertCircle, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog } from '@/components/forms/AlertDialog';
import { CaseSelector } from '@/components/forms/CaseSelector';

export default function CompliancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    case_id: '',
    compliance_type: 'court_order_compliance',
    court_order_description: '',
    responsible_division: 'survey_division',
    compliance_deadline: '',
    compliance_notes: '',
    return_to_step: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('compliance_tracking')
        .insert([{
          case_id: formData.case_id,
          court_order_description: formData.court_order_description,
          responsible_division: formData.responsible_division,
          compliance_deadline: formData.compliance_deadline || null,
          compliance_status: 'pending',
          compliance_notes: formData.compliance_notes,
          memo_sent_by: user.id,
          memo_sent_date: new Date().toISOString(),
        }]);

      if (error) throw error;

      toast.success('Compliance tracking record created successfully!');
      setShowForm(false);
      setFormData({
        case_id: '',
        compliance_type: 'court_order_compliance',
        court_order_description: '',
        responsible_division: 'survey_division',
        compliance_deadline: '',
        compliance_notes: '',
        return_to_step: '',
      });
    } catch (error) {
      console.error('Error recording compliance update:', error);
      toast.error('Failed to record compliance update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">
        {/* Sticky Header Bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CheckSquare className="h-5 w-5 text-slate-600" />
              <div className="h-6 w-px bg-slate-300" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Compliance</h1>
                <p className="text-xs text-slate-500">Step 5: Solicitor General & Legal Officers</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {formData.case_id && (
                <AlertDialog
                  caseId={formData.case_id}
                  currentStep="Step 5: Compliance Tracking"
                />
              )}
              <Button
                onClick={() => setShowForm(!showForm)}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {showForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                {showForm ? 'Cancel' : 'New Update'}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Info Card */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-purple-900 text-sm mb-2">How This Module Works</h3>
                <ul className="text-xs text-purple-800 space-y-1">
                  <li>• <strong>Iterative Process:</strong> Cases often return to earlier workflow steps from here</li>
                  <li>• <strong>Loop Back to Step 2:</strong> Request updated directions from Secretary/Director/Manager</li>
                  <li>• <strong>Loop Back to Step 4:</strong> Request filings or updates from Litigation Officer</li>
                  <li>• <strong>Document Requests:</strong> Request internal documents from other departments</li>
                  <li>• <strong>Repeats Until Complete:</strong> This cycle continues until all compliance obligations are satisfied</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Workflow Cycle Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <RefreshCw className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 text-sm mb-2">Compliance Workflow Cycle</h3>
                <div className="text-xs text-amber-800 space-y-2">
                  <p><strong>From Compliance you can:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>→ Return to <strong>Step 2 (Directions)</strong> for updated instructions</li>
                    <li>→ Return to <strong>Step 4 (Litigation Officer)</strong> for additional filings</li>
                    <li>→ Request documents from internal divisions</li>
                    <li>→ Continue to <strong>Step 6 (Case Closure)</strong> when compliance is satisfied</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Update Form */}
          {showForm && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Record Compliance Update</h2>
                <p className="text-xs text-slate-500 mt-1">Document compliance activities and determine next actions</p>
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
                    <Label className="text-xs text-slate-600">Responsible Division *</Label>
                    <Select
                      value={formData.responsible_division}
                      onValueChange={(value) => setFormData({ ...formData, responsible_division: value })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="survey_division">Survey Division</SelectItem>
                        <SelectItem value="registrar_for_titles">Registrar for Titles</SelectItem>
                        <SelectItem value="alienated_lands_division">Alienated Lands Division</SelectItem>
                        <SelectItem value="valuation_division">Valuation Division</SelectItem>
                        <SelectItem value="physical_planning_division">Physical Planning Division</SelectItem>
                        <SelectItem value="ilg_division">ILG Division</SelectItem>
                        <SelectItem value="customary_leases_division">Customary Leases Division</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-600">Court Order Description *</Label>
                  <Textarea
                    placeholder="Describe the court order requiring compliance..."
                    value={formData.court_order_description}
                    onChange={(e) => setFormData({ ...formData, court_order_description: e.target.value })}
                    required
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Compliance Deadline</Label>
                    <Input
                      type="date"
                      value={formData.compliance_deadline}
                      onChange={(e) => setFormData({ ...formData, compliance_deadline: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Return to Workflow Step</Label>
                    <Select
                      value={formData.return_to_step}
                      onValueChange={(value) => setFormData({ ...formData, return_to_step: value })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select if case needs to return..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No return needed</SelectItem>
                        <SelectItem value="step_2">Return to Step 2 (Directions)</SelectItem>
                        <SelectItem value="step_4">Return to Step 4 (Litigation Officer)</SelectItem>
                        <SelectItem value="continue_compliance">Continue Compliance</SelectItem>
                        <SelectItem value="ready_for_closure">Ready for Closure (Step 6)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-600">Compliance Notes / Memo Content</Label>
                  <Textarea
                    placeholder="Notes about the compliance request, memo content sent to division..."
                    value={formData.compliance_notes}
                    onChange={(e) => setFormData({ ...formData, compliance_notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Record Compliance Update
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
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Recent Compliance Updates</h2>
              <p className="text-xs text-slate-500 mt-1">Compliance activities, document requests, and workflow returns</p>
            </div>
            <div className="p-12 text-center">
              <CheckSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No compliance updates recorded yet</h3>
              <p className="text-sm text-slate-600 mb-6">Compliance updates will appear here as they are recorded</p>
              {!showForm && (
                <Button
                  onClick={() => setShowForm(true)}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Record First Update
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
