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
import { CheckSquare, Plus, Search, AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog } from '@/components/forms/AlertDialog';
import { format } from 'date-fns';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardNav />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <CheckSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Step 5: Compliance</h1>
              <p className="text-slate-600 mt-1">Solicitor General & Legal Officers - Iterative Workflow</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowForm(!showForm)}
              className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="h-4 w-4" />
              New Compliance Update
            </Button>

            {formData.case_id && (
              <AlertDialog
                caseId={formData.case_id}
                currentStep="Step 5: Compliance Tracking"
              />
            )}
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-purple-900 mb-2">How This Module Works</h3>
                <ul className="text-sm text-purple-800 space-y-1.5">
                  <li>• <strong>Iterative Process:</strong> Cases often return to earlier workflow steps from here</li>
                  <li>• <strong>Loop Back to Step 2:</strong> Request updated directions from Secretary/Director/Manager</li>
                  <li>• <strong>Loop Back to Step 4:</strong> Request filings or updates from Litigation Officer</li>
                  <li>• <strong>Document Requests:</strong> Request internal documents from other departments to substantiate the case</li>
                  <li>• <strong>Repeats Until Complete:</strong> This cycle continues as many times as necessary until all compliance obligations are satisfied</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Cycle Info */}
        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <RefreshCw className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">Compliance Workflow Cycle</h3>
                <div className="text-sm text-amber-800 space-y-2">
                  <p><strong>From Compliance you can:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>→ Return to <strong>Step 2 (Directions)</strong> for updated instructions</li>
                    <li>→ Return to <strong>Step 4 (Litigation Officer)</strong> for additional filings/updates</li>
                    <li>→ Request documents from internal divisions</li>
                    <li>→ Continue to <strong>Step 6 (Case Closure)</strong> when compliance is satisfied</li>
                  </ul>
                  <p className="mt-3"><strong>This process repeats as many times as needed until the case is ready for closure.</strong></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Update Form */}
        {showForm && (
          <Card className="border-2 border-purple-300">
            <CardHeader>
              <CardTitle>Record Compliance Update</CardTitle>
              <CardDescription>
                Document compliance activities and determine next actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Label htmlFor="responsible_division">Responsible Division *</Label>
                  <Select
                    value={formData.responsible_division}
                    onValueChange={(value) => setFormData({ ...formData, responsible_division: value })}
                  >
                    <SelectTrigger id="responsible_division">
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
                  <p className="text-xs text-slate-500">Division responsible for compliance with court order</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="court_order_description">Court Order Description *</Label>
                  <Textarea
                    id="court_order_description"
                    placeholder="Describe the court order requiring compliance..."
                    value={formData.court_order_description}
                    onChange={(e) => setFormData({ ...formData, court_order_description: e.target.value })}
                    required
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compliance_deadline">Compliance Deadline</Label>
                  <Input
                    id="compliance_deadline"
                    type="date"
                    value={formData.compliance_deadline}
                    onChange={(e) => setFormData({ ...formData, compliance_deadline: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compliance_notes">Compliance Notes / Memo Content</Label>
                  <Textarea
                    id="compliance_notes"
                    placeholder="Notes about the compliance request, memo content sent to division..."
                    value={formData.compliance_notes}
                    onChange={(e) => setFormData({ ...formData, compliance_notes: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="return_to_step">Return to Workflow Step</Label>
                  <Select
                    value={formData.return_to_step}
                    onValueChange={(value) => setFormData({ ...formData, return_to_step: value })}
                  >
                    <SelectTrigger id="return_to_step">
                      <SelectValue placeholder="Select if case needs to return to earlier step..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No return needed</SelectItem>
                      <SelectItem value="step_2">Return to Step 2 (Directions)</SelectItem>
                      <SelectItem value="step_4">Return to Step 4 (Litigation Officer)</SelectItem>
                      <SelectItem value="continue_compliance">Continue Compliance</SelectItem>
                      <SelectItem value="ready_for_closure">Ready for Closure (Step 6)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Cases often cycle back to Step 2 or 4 for updates</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Record Compliance Update
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

        {/* Compliance Updates List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Compliance Updates</CardTitle>
            <CardDescription>
              Compliance activities, document requests, and workflow returns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-slate-500">
              <CheckSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p>No compliance updates recorded yet</p>
              <p className="text-sm mt-2">Compliance updates will appear here as they are recorded</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
