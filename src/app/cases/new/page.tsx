'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SelectWithAdd } from '@/components/ui/select-with-add';
import { HelpTooltip } from '@/components/help';
import { ArrowLeft, Save, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewCasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dlpp_role: 'defendant' as 'defendant' | 'plaintiff',
    case_number: '',
    title: '',
    description: '',
    status: 'under_review',
    priority: 'medium',
    region: '',
    court_file_number: '',
    parties_description: '',
    track_number: '',
    proceeding_filed_date: '',
    documents_served_date: '',
    court_documents_type: '',
    matter_type: '',
    case_type: 'other',
    returnable_date: '',
    returnable_type: '',
    land_description: '',
    zoning: '',
    survey_plan_no: '',
    lease_type: '',
    lease_commencement_date: '',
    lease_expiration_date: '',
    division_responsible: '',
    allegations: '',
    reliefs_sought: '',
    opposing_lawyer_name: '',
    sol_gen_officer: '',
    dlpp_action_officer: '',
    officer_assigned_date: '',
    assignment_footnote: '',
    section5_notice: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const response = await fetch('/api/cases/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          proceeding_filed_date: formData.proceeding_filed_date || null,
          documents_served_date: formData.documents_served_date || null,
          officer_assigned_date: formData.officer_assigned_date || null,
          lease_commencement_date: formData.lease_commencement_date || null,
          lease_expiration_date: formData.lease_expiration_date || null,
          returnable_date: formData.returnable_date
            ? new Date(formData.returnable_date).toISOString()
            : null,
          user_id: user.id,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      if (!result.case) throw new Error('No case data returned');

      toast.success('Case registered successfully');
      router.push(`/cases/${result.case.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to register case';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">
        {/* Header Bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/cases">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div className="h-6 w-px bg-slate-300" />
              <h1 className="text-xl font-semibold text-slate-900">New Case Registration</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/cases">
                <Button variant="outline" size="sm" className="gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </Link>
              <Button
                data-tour="newcase-save"
                onClick={handleSubmit}
                disabled={loading}
                size="sm"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : 'Save Case'}
              </Button>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <form data-tour="newcase-form" onSubmit={handleSubmit} className="max-w-7xl mx-auto px-6 py-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">

            {/* DLPP Role Toggle */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-6">
                <span className="text-sm font-medium text-slate-700">DLPP Role:</span>
                <div className="flex gap-1 bg-white rounded-lg border border-slate-200 p-1">
                  <button
                    type="button"
                    onClick={() => handleChange('dlpp_role', 'defendant')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      formData.dlpp_role === 'defendant'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Defendant / Respondent
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('dlpp_role', 'plaintiff')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      formData.dlpp_role === 'plaintiff'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Plaintiff / Applicant
                  </button>
                </div>
              </div>
            </div>

            {/* Main Form Grid */}
            <div className="p-6 space-y-8">

              {/* Section: Case Identification */}
              <div>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4 pb-2 border-b border-slate-200">
                  Case Identification
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-slate-600">Internal Case No.</Label>
                    <Input
                      placeholder="Auto-generated"
                      value={formData.case_number}
                      onChange={(e) => handleChange('case_number', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-slate-600">Court File Number</Label>
                      <HelpTooltip
                        title="Court File Number"
                        content="The reference the court uses for this matter (for example NC 123/2025). Copy it exactly from a court document. Leave blank if the matter is not yet in court."
                      />
                    </div>
                    <Input
                      placeholder="e.g., NC 123/2025"
                      value={formData.court_file_number}
                      onChange={(e) => handleChange('court_file_number', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Track Number</Label>
                    <Input
                      placeholder="Track number"
                      value={formData.track_number}
                      onChange={(e) => handleChange('track_number', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Region</Label>
                    <SelectWithAdd
                      value={formData.region}
                      onValueChange={(value) => handleChange('region', value)}
                      tableName="regions"
                      placeholder="Select"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Parties & Matter */}
              <div>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4 pb-2 border-b border-slate-200">
                  Parties & Matter
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-slate-600">Parties to Proceedings</Label>
                      <HelpTooltip
                        title="Parties to Proceedings"
                        content="List the parties in the matter, for example 'John Doe v. Department of Lands & Physical Planning'. Use the exact legal names as they appear on official documents."
                      />
                    </div>
                    <Textarea
                      placeholder="e.g., John Doe v. Department of Lands & Physical Planning"
                      value={formData.parties_description}
                      onChange={(e) => handleChange('parties_description', e.target.value)}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-slate-600">Matter Type</Label>
                      <SelectWithAdd
                        value={formData.matter_type}
                        onValueChange={(value) => handleChange('matter_type', value)}
                        tableName="matter_types"
                        placeholder="Select"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Case Category</Label>
                      <SelectWithAdd
                        value={formData.case_type}
                        onValueChange={(value) => handleChange('case_type', value)}
                        tableName="case_categories"
                        placeholder="Select"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Dates */}
              <div>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4 pb-2 border-b border-slate-200">
                  Key Dates
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <Label className="text-xs text-slate-600">Date Filed</Label>
                    <Input
                      type="date"
                      value={formData.proceeding_filed_date}
                      onChange={(e) => handleChange('proceeding_filed_date', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Documents Served</Label>
                    <Input
                      type="date"
                      value={formData.documents_served_date}
                      onChange={(e) => handleChange('documents_served_date', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Returnable Date</Label>
                    <Input
                      type="datetime-local"
                      value={formData.returnable_date}
                      onChange={(e) => handleChange('returnable_date', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Hearing Type</Label>
                    <SelectWithAdd
                      value={formData.returnable_type}
                      onValueChange={(value) => handleChange('returnable_type', value)}
                      tableName="hearing_types"
                      placeholder="Select"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Document Type</Label>
                    <Input
                      placeholder="e.g., Writ of Summons"
                      value={formData.court_documents_type}
                      onChange={(e) => handleChange('court_documents_type', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Land Details */}
              <div>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4 pb-2 border-b border-slate-200">
                  Land Details
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <Label className="text-xs text-slate-600">Land Description</Label>
                    <Textarea
                      placeholder="Location, boundaries, description..."
                      value={formData.land_description}
                      onChange={(e) => handleChange('land_description', e.target.value)}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-slate-600">Zoning</Label>
                      <Input
                        placeholder="e.g., Residential"
                        value={formData.zoning}
                        onChange={(e) => handleChange('zoning', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Survey Plan No.</Label>
                      <Input
                        placeholder="e.g., SP-12345"
                        value={formData.survey_plan_no}
                        onChange={(e) => handleChange('survey_plan_no', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <Label className="text-xs text-slate-600">Lease Type</Label>
                    <SelectWithAdd
                      value={formData.lease_type}
                      onValueChange={(value) => handleChange('lease_type', value)}
                      tableName="lease_types"
                      placeholder="Select"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Lease Start</Label>
                    <Input
                      type="date"
                      value={formData.lease_commencement_date}
                      onChange={(e) => handleChange('lease_commencement_date', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Lease End</Label>
                    <Input
                      type="date"
                      value={formData.lease_expiration_date}
                      onChange={(e) => handleChange('lease_expiration_date', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Division</Label>
                    <SelectWithAdd
                      value={formData.division_responsible}
                      onValueChange={(value) => handleChange('division_responsible', value)}
                      tableName="divisions"
                      placeholder="Select"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Legal Issues */}
              <div>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4 pb-2 border-b border-slate-200">
                  Legal Issues
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-600">
                      {formData.dlpp_role === 'defendant' ? 'Allegations / Legal Issues' : 'Cause of Action'}
                    </Label>
                    <Textarea
                      placeholder={formData.dlpp_role === 'defendant'
                        ? "Allegations against DLPP..."
                        : "Cause of action and legal basis..."
                      }
                      value={formData.allegations}
                      onChange={(e) => handleChange('allegations', e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Reliefs Sought</Label>
                    <Textarea
                      placeholder="Reliefs sought..."
                      value={formData.reliefs_sought}
                      onChange={(e) => handleChange('reliefs_sought', e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Section: Legal Representatives & Assignment */}
              <div>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4 pb-2 border-b border-slate-200">
                  Legal Representatives & Assignment
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-slate-600">
                      {formData.dlpp_role === 'defendant' ? "Plaintiff's Lawyer" : "Defendant's Lawyer"}
                    </Label>
                    <SelectWithAdd
                      value={formData.opposing_lawyer_name}
                      onValueChange={(value) => handleChange('opposing_lawyer_name', value)}
                      tableName="lawyers"
                      placeholder="Select"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Sol Gen Officer</Label>
                    <SelectWithAdd
                      value={formData.sol_gen_officer}
                      onValueChange={(value) => handleChange('sol_gen_officer', value)}
                      tableName="sol_gen_officers"
                      placeholder="Select"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">DLPP Action Officer</Label>
                    <Input
                      placeholder="Officer name"
                      value={formData.dlpp_action_officer}
                      onChange={(e) => handleChange('dlpp_action_officer', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Date Assigned</Label>
                    <Input
                      type="date"
                      value={formData.officer_assigned_date}
                      onChange={(e) => handleChange('officer_assigned_date', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="text-xs text-slate-600">Assignment Notes</Label>
                  <Textarea
                    placeholder="Notes from manager/supervisor..."
                    value={formData.assignment_footnote}
                    onChange={(e) => handleChange('assignment_footnote', e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>

              {/* Section: Status & Priority */}
              <div>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4 pb-2 border-b border-slate-200">
                  Status & Priority
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-slate-600">Status</Label>
                    <SelectWithAdd
                      value={formData.status}
                      onValueChange={(value) => handleChange('status', value)}
                      tableName="case_statuses"
                      placeholder="Select"
                      useCodeAsValue
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-slate-600">Priority</Label>
                      <HelpTooltip
                        title="Priority"
                        content="How urgent the case is. Set 'High' or 'Urgent' for matters with close deadlines so they stand out to managers on the Dashboard and in alerts."
                      />
                    </div>
                    <SelectWithAdd
                      value={formData.priority}
                      onValueChange={(value) => handleChange('priority', value)}
                      tableName="priority_levels"
                      placeholder="Select"
                      useCodeAsValue
                      className="mt-1"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-slate-600">Case Title</Label>
                      <HelpTooltip
                        title="Case Title"
                        content="A short, clear name so the case can be recognised and found later. Include a party name or location, for example 'Kila v State — Portion 123 Waigani'. Avoid vague titles like 'Land case'."
                      />
                    </div>
                    <Input
                      placeholder="Brief descriptive title"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label className="text-xs text-slate-600">Additional Notes</Label>
                    <Textarea
                      placeholder="Additional information..."
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                  {formData.dlpp_role === 'defendant' && (
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <Checkbox
                        id="section5_notice"
                        checked={formData.section5_notice}
                        onCheckedChange={(checked: boolean) => handleChange('section5_notice', checked)}
                      />
                      <Label htmlFor="section5_notice" className="text-sm font-medium cursor-pointer">
                        Section 5 Notice Applies
                      </Label>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <Link href="/cases">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 min-w-[120px]"
              >
                {loading ? 'Saving...' : 'Register Case'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
