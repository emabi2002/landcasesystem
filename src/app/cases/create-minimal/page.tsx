'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CreateMinimalCasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dlpp_role: 'defendant' as 'defendant' | 'plaintiff',
    brief_description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Auto-generate case number
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-6);
      const caseNumber = `DLPP-${year}-${timestamp}`;

      // Auto-generate title
      const roleDesc = formData.dlpp_role === 'defendant' ? 'as Defendant' : 'as Plaintiff';
      const caseTitle = formData.brief_description
        ? `${formData.brief_description.substring(0, 100)}`
        : `Case ${caseNumber} - DLPP ${roleDesc}`;

      // Insert minimal case record
      const { data: newCase, error: caseError } = await supabase
        .from('cases')
        .insert([{
          case_number: caseNumber,
          title: caseTitle,
          description: formData.brief_description || null,
          dlpp_role: formData.dlpp_role,
          status: 'registered',
          priority: 'medium',
          case_type: 'court_matter',
          workflow_status: 'registered',
          created_by: user.id,
        }])
        .select()
        .single();

      if (caseError) throw caseError;
      if (!newCase) throw new Error('No case data returned');

      // Show success message
      toast.success(
        `Case ${caseNumber} created successfully! Redirecting to case dashboard...`,
        { duration: 3000 }
      );

      // Redirect to case dashboard
      setTimeout(() => {
        router.push(`/cases/${newCase.id}`);
      }, 1500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create case';
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardNav />

      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/cases">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Cases
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Create New Case</h1>
              <p className="text-slate-600 mt-1">Minimal case creation - Case ID will be generated</p>
            </div>
          </div>
        </div>

        {/* Information Card */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">How It Works</h3>
                <ul className="text-sm text-blue-800 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Step 1:</strong> Create minimal case record here (generates Case ID)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Step 2:</strong> Access workflow modules from case dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Step 3:</strong> Different officers add data in their respective modules</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Step 4:</strong> Case progresses through 8-step workflow until closure</span>
                  </li>
                </ul>
                <p className="text-sm text-blue-700 mt-3 font-medium">
                  ⚠️ Once created, this screen cannot be accessed again for this case. All updates go through workflow modules.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Creation Form */}
        <form onSubmit={handleSubmit}>
          <Card className="border-2 border-slate-200">
            <CardHeader>
              <CardTitle>Minimal Case Information</CardTitle>
              <CardDescription>
                Only basic information needed - all other details will be added through workflow modules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* DLPP Role */}
              <div className="space-y-2">
                <Label htmlFor="dlpp_role">DLPP Role in this Case</Label>
                <Select value={formData.dlpp_role} onValueChange={(value) => handleChange('dlpp_role', value)}>
                  <SelectTrigger id="dlpp_role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="defendant">Defendant / Respondent</SelectItem>
                    <SelectItem value="plaintiff">Plaintiff / Applicant</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Select whether DLPP is the Defendant or Plaintiff in this matter
                </p>
              </div>

              {/* Brief Description */}
              <div className="space-y-2">
                <Label htmlFor="brief_description">Brief Description (Optional)</Label>
                <Textarea
                  id="brief_description"
                  placeholder="e.g., Land dispute regarding Section 60, Challenge to decision letter, etc."
                  value={formData.brief_description}
                  onChange={(e) => handleChange('brief_description', e.target.value)}
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-slate-500">
                  Optional - helps identify the case. Can be updated later. ({formData.brief_description.length}/200)
                </p>
              </div>

              {/* Auto-Generation Info */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h4 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  What Will Be Generated
                </h4>
                <ul className="text-sm text-emerald-800 space-y-1">
                  <li>✅ <strong>Case Number:</strong> DLPP-{new Date().getFullYear()}-XXXXXX (unique)</li>
                  <li>✅ <strong>Case Title:</strong> Based on description or auto-generated</li>
                  <li>✅ <strong>Status:</strong> Registered (ready for workflow)</li>
                  <li>✅ <strong>Creation Record:</strong> Date, time, and creating officer logged</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card className="border-2 border-emerald-200 mt-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 text-white hover:opacity-90 h-12 text-base font-semibold"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Creating Case...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Create Case & Generate Case ID
                    </span>
                  )}
                </Button>
                <Link href="/cases" className="flex-1 sm:flex-initial">
                  <Button type="button" variant="outline" className="w-full h-12" disabled={loading}>
                    Cancel
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-slate-600 mt-4 text-center">
                After creation, you'll be redirected to the case dashboard to access workflow modules
              </p>
            </CardContent>
          </Card>
        </form>

        {/* Workflow Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What Happens Next?</CardTitle>
            <CardDescription>After case creation, access these workflow modules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {[
                { step: 1, name: 'Document Reception', officer: 'Legal Section Staff' },
                { step: 2, name: 'Directions', officer: 'Secretary/Director/Manager' },
                { step: 3, name: 'Registration & Assignment', officer: 'Litigation Officer' },
                { step: 4, name: 'Officer Actions', officer: 'Legal Officers' },
                { step: 5, name: 'External Filings', officer: 'Legal Officers' },
                { step: 6, name: 'Compliance', officer: 'Manager Legal Services' },
                { step: 7, name: 'Case Closure', officer: 'Manager/Legal Officer' },
                { step: 8, name: 'Parties & Lawyers', officer: 'Legal Officers' },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 bg-slate-200 rounded-full font-bold text-slate-700">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-600">{item.officer}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
