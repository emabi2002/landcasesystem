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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewCasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Information
    dlpp_role: 'defendant' as 'defendant' | 'plaintiff',
    case_number: '',
    title: '',
    description: '',
    status: 'under_review',
    priority: 'medium',
    region: '',

    // Court Details (Section A & B - Items 1-6)
    court_file_number: '', // Court reference number
    parties_description: '', // Parties to the proceedings
    track_number: '',
    proceeding_filed_date: '',
    documents_served_date: '',
    court_documents_type: '',

    // Matter Details (Section A & B - Items 7-8)
    matter_type: '', // tort, compensation claim, fraud, judicial review, etc.
    case_type: 'other',
    returnable_date: '', // Returnable date for hearing
    returnable_type: '', // directions hearing, substantive hearing, pre-trial, trial, mediation

    // Land Description (Section A & B - Item 9)
    land_description: '',
    zoning: '',
    survey_plan_no: '',
    lease_type: '',
    lease_commencement_date: '',
    lease_expiration_date: '',

    // Division and Legal Issues (Section A - Items 10-12, Section B - Items 10-11)
    division_responsible: '',
    allegations: '', // Legal issues / cause of action
    reliefs_sought: '',

    // Legal Representatives (Section A - Items 13-14, Section B - Items 13)
    opposing_lawyer_name: '', // Plaintiff's lawyer (defendant) or Defendant's lawyer (plaintiff)
    sol_gen_officer: '',

    // DLPP Officers (Section A - Item 15, Section B - Item 18)
    dlpp_action_officer: '',
    officer_assigned_date: '',
    assignment_footnote: '',

    // Status and Notices (Section A - Items 16-17)
    section5_notice: false, // Only for defendant cases
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Use normalized API route to insert into all related tables
      const response = await fetch('/api/cases/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // Convert date strings to proper format or null
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

      // Show success message
      toast.success(
        'Case registered successfully! ' +
        'All related data (parties, land, events, tasks) created and linked.'
      );

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
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />

      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/cases">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Cases
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Register New Case</h1>
          <p className="text-slate-600 mt-1">Completely flexible data entry - no mandatory fields! Add any details now or later as the case evolves.</p>
        </div>

        {/* Progressive Entry Notice */}
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Progressive Case Entry - No Mandatory Fields!</h3>
                <p className="text-sm text-blue-800">
                  <strong>All fields are completely optional.</strong> Create a case with minimal information and add details progressively as the matter evolves:
                  court assignment, service of documents, hearing dates, party information, etc. The case remains open for ongoing modifications
                  until closure. You can return to edit and add information at any time during the case lifecycle.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DLPP Role Selection */}
        <Card className="border-2 border-emerald-200 bg-emerald-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-emerald-600" />
              STEP 1: Select DLPP Role in this Case
            </CardTitle>
            <CardDescription>
              Choose whether DLPP is the Defendant/Respondent or Plaintiff/Applicant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={formData.dlpp_role} onValueChange={(value) => handleChange('dlpp_role', value)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="defendant">Defendant/Respondent</TabsTrigger>
                <TabsTrigger value="plaintiff">Plaintiff/Applicant</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Main Registration Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Section 1: Court Details */}
            <Card>
              <CardHeader>
                <CardTitle>Court and Case Details</CardTitle>
                <CardDescription>
                  Items 1-6: Court reference, parties, dates, and documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="case_number">Internal Case Number</Label>
                    <Input
                      id="case_number"
                      placeholder="e.g., DLPP-2025-001 (auto-generated if left blank)"
                      value={formData.case_number}
                      onChange={(e) => handleChange('case_number', e.target.value)}
                    />
                    <p className="text-xs text-slate-500">Internal DLPP tracking number - leave blank to auto-generate</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="court_file_number">Court Reference Number (Item 1)</Label>
                    <Input
                      id="court_file_number"
                      placeholder="e.g., NC 123/2025 (added when assigned by court)"
                      value={formData.court_file_number}
                      onChange={(e) => handleChange('court_file_number', e.target.value)}
                    />
                    <p className="text-xs text-slate-500">Can be added later when court assigns number</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parties_description">Parties to the Proceedings (Item 2)</Label>
                  <Textarea
                    id="parties_description"
                    placeholder="E.g., John Doe v. Department of Lands & Physical Planning"
                    value={formData.parties_description}
                    onChange={(e) => handleChange('parties_description', e.target.value)}
                    rows={2}
                  />
                  <p className="text-xs text-slate-500">Can be updated as more parties are identified</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="track_number">Track Number (Item 3)</Label>
                    <Input
                      id="track_number"
                      placeholder="Court track number"
                      value={formData.track_number}
                      onChange={(e) => handleChange('track_number', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proceeding_filed_date">Date Proceeding Filed (Item 4)</Label>
                    <Input
                      id="proceeding_filed_date"
                      type="date"
                      value={formData.proceeding_filed_date}
                      onChange={(e) => handleChange('proceeding_filed_date', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="documents_served_date">
                      Date Documents {formData.dlpp_role === 'defendant' ? 'Served/Received' : 'Served'} (Item 5)
                    </Label>
                    <Input
                      id="documents_served_date"
                      type="date"
                      value={formData.documents_served_date}
                      onChange={(e) => handleChange('documents_served_date', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="court_documents_type">Type of Court Documents Lodged (Item 6)</Label>
                    <Input
                      id="court_documents_type"
                      placeholder="e.g., Writ of Summons, Statement of Claim"
                      value={formData.court_documents_type}
                      onChange={(e) => handleChange('court_documents_type', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Matter Type and Hearing Details */}
            <Card>
              <CardHeader>
                <CardTitle>Matter Type and Hearing Details</CardTitle>
                <CardDescription>
                  Items 7-8: Type of matter and returnable dates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="matter_type">Type of Matter (Item 7)</Label>
                    <Select value={formData.matter_type} onValueChange={(value) => handleChange('matter_type', value)}>
                      <SelectTrigger id="matter_type">
                        <SelectValue placeholder="Select matter type (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tort">Tort</SelectItem>
                        <SelectItem value="compensation_claim">Compensation Claim</SelectItem>
                        <SelectItem value="fraud">Fraud</SelectItem>
                        <SelectItem value="judicial_review">Judicial Review</SelectItem>
                        <SelectItem value="contract_dispute">Contract Dispute</SelectItem>
                        <SelectItem value="land_title">Land Title</SelectItem>
                        <SelectItem value="lease_dispute">Lease Dispute</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="case_type">Case Category</Label>
                    <Select value={formData.case_type} onValueChange={(value) => handleChange('case_type', value)}>
                      <SelectTrigger id="case_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="court_matter">Court Matter</SelectItem>
                        <SelectItem value="tribunal">Tribunal</SelectItem>
                        <SelectItem value="mediation">Mediation</SelectItem>
                        <SelectItem value="administrative_review">Administrative Review</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-900 mb-2">Returnable Date Alert System</h4>
                      <p className="text-sm text-amber-800 mb-3">
                        System will automatically create a calendar event and send alerts 3 days before the returnable date.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="returnable_date">Returnable Date (Item 8)</Label>
                      <Input
                        id="returnable_date"
                        type="datetime-local"
                        value={formData.returnable_date}
                        onChange={(e) => handleChange('returnable_date', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="returnable_type">Type of Hearing</Label>
                      <Select value={formData.returnable_type} onValueChange={(value) => handleChange('returnable_type', value)}>
                        <SelectTrigger id="returnable_type">
                          <SelectValue placeholder="Select hearing type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="directions_hearing">Directions Hearing</SelectItem>
                          <SelectItem value="substantive_hearing">Substantive Hearing</SelectItem>
                          <SelectItem value="pre_trial_conference">Pre-Trial Conference</SelectItem>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="mediation">Mediation</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Land Description */}
            <Card>
              <CardHeader>
                <CardTitle>Land Description and Details</CardTitle>
                <CardDescription>
                  Item 9: Zoning, survey plan, lease details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="land_description">Land Description *</Label>
                  <Textarea
                    id="land_description"
                    placeholder="Full land description including location, boundaries, etc."
                    value={formData.land_description}
                    onChange={(e) => handleChange('land_description', e.target.value)}
                    required
                    rows={3}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="zoning">Zoning</Label>
                    <Input
                      id="zoning"
                      placeholder="e.g., Residential, Commercial"
                      value={formData.zoning}
                      onChange={(e) => handleChange('zoning', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="survey_plan_no">Survey Plan No.</Label>
                    <Input
                      id="survey_plan_no"
                      placeholder="e.g., SP-12345"
                      value={formData.survey_plan_no}
                      onChange={(e) => handleChange('survey_plan_no', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lease_type">Type of Lease</Label>
                    <Select value={formData.lease_type} onValueChange={(value) => handleChange('lease_type', value)}>
                      <SelectTrigger id="lease_type">
                        <SelectValue placeholder="Select lease type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="state_lease">State Lease</SelectItem>
                        <SelectItem value="customary_lease">Customary Lease</SelectItem>
                        <SelectItem value="business_lease">Business Lease</SelectItem>
                        <SelectItem value="agricultural_lease">Agricultural Lease</SelectItem>
                        <SelectItem value="residential_lease">Residential Lease</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="lease_commencement_date">Lease Commencement Date</Label>
                    <Input
                      id="lease_commencement_date"
                      type="date"
                      value={formData.lease_commencement_date}
                      onChange={(e) => handleChange('lease_commencement_date', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lease_expiration_date">Lease Expiration Date</Label>
                    <Input
                      id="lease_expiration_date"
                      type="date"
                      value={formData.lease_expiration_date}
                      onChange={(e) => handleChange('lease_expiration_date', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Legal Issues and Division */}
            <Card>
              <CardHeader>
                <CardTitle>Legal Issues and Division Responsible</CardTitle>
                <CardDescription>
                  Items 10-12: Division, allegations/cause of action, reliefs sought
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="division_responsible">Division Responsible (Item 10) *</Label>
                    <Select value={formData.division_responsible} onValueChange={(value) => handleChange('division_responsible', value)}>
                      <SelectTrigger id="division_responsible">
                        <SelectValue placeholder="Select division" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lands">Lands Division</SelectItem>
                        <SelectItem value="physical_planning">Physical Planning Division</SelectItem>
                        <SelectItem value="surveying">Surveying Division</SelectItem>
                        <SelectItem value="valuations">Valuations Division</SelectItem>
                        <SelectItem value="legal">Legal Division</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      placeholder="e.g., Central, Southern Highlands"
                      value={formData.region}
                      onChange={(e) => handleChange('region', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allegations">
                    {formData.dlpp_role === 'defendant' ? 'Allegations and/or Legal Issues (Item 11)' : 'Cause of Action (Item 11)'} *
                  </Label>
                  <Textarea
                    id="allegations"
                    placeholder={formData.dlpp_role === 'defendant'
                      ? "Describe the allegations made against DLPP..."
                      : "Describe the cause of action and legal basis..."
                    }
                    value={formData.allegations}
                    onChange={(e) => handleChange('allegations', e.target.value)}
                    required
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reliefs_sought">Reliefs Sought (Item 12) *</Label>
                  <Textarea
                    id="reliefs_sought"
                    placeholder={formData.dlpp_role === 'defendant'
                      ? "Describe reliefs sought by plaintiff..."
                      : "Describe reliefs sought by DLPP..."
                    }
                    value={formData.reliefs_sought}
                    onChange={(e) => handleChange('reliefs_sought', e.target.value)}
                    required
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 5: Legal Representatives */}
            <Card>
              <CardHeader>
                <CardTitle>Legal Representatives</CardTitle>
                <CardDescription>
                  Items 13-14: Lawyers and legal officers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="opposing_lawyer_name">
                      {formData.dlpp_role === 'defendant' ? "Name of Plaintiff's Lawyers (Item 13)" : "Name of Defendant's Lawyer (Item 13)"}
                    </Label>
                    <Input
                      id="opposing_lawyer_name"
                      placeholder="Lawyer name or firm"
                      value={formData.opposing_lawyer_name}
                      onChange={(e) => handleChange('opposing_lawyer_name', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sol_gen_officer">
                      Sol Gen Action Officer (Item 14)
                    </Label>
                    <Input
                      id="sol_gen_officer"
                      placeholder="Solicitor General's office action officer"
                      value={formData.sol_gen_officer}
                      onChange={(e) => handleChange('sol_gen_officer', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 6: DLPP Action Officer */}
            <Card>
              <CardHeader>
                <CardTitle>DLPP Action Officer Assignment</CardTitle>
                <CardDescription>
                  Item {formData.dlpp_role === 'defendant' ? '15' : '18'}: Officer assigned with manager/supervisor approval
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dlpp_action_officer">DLPP Action Officer *</Label>
                    <Input
                      id="dlpp_action_officer"
                      placeholder="Officer name"
                      value={formData.dlpp_action_officer}
                      onChange={(e) => handleChange('dlpp_action_officer', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="officer_assigned_date">Date Matter Assigned</Label>
                    <Input
                      id="officer_assigned_date"
                      type="date"
                      value={formData.officer_assigned_date}
                      onChange={(e) => handleChange('officer_assigned_date', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignment_footnote">Assignment Footnote (from Manager and Supervisor)</Label>
                  <Textarea
                    id="assignment_footnote"
                    placeholder="Notes from manager and supervisor regarding the assignment..."
                    value={formData.assignment_footnote}
                    onChange={(e) => handleChange('assignment_footnote', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 7: Status and Priority */}
            <Card>
              <CardHeader>
                <CardTitle>Case Status and Priority</CardTitle>
                <CardDescription>
                  Items {formData.dlpp_role === 'defendant' ? '16-17' : '15'}: Current status
                  {formData.dlpp_role === 'defendant' && ' and Section 5 notice'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status of Matter *</Label>
                    <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="in_court">In Court</SelectItem>
                        <SelectItem value="mediation">Mediation</SelectItem>
                        <SelectItem value="tribunal">Tribunal</SelectItem>
                        <SelectItem value="judgment">Judgment</SelectItem>
                        <SelectItem value="settled">Settled</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority Level *</Label>
                    <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
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

                {formData.dlpp_role === 'defendant' && (
                  <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg border">
                    <Checkbox
                      id="section5_notice"
                      checked={formData.section5_notice}
                      onCheckedChange={(checked: boolean) => handleChange('section5_notice', checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="section5_notice"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Section 5 Notice (Item 17)
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Check if Section 5 notice applies to this case
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Case Title Summary</Label>
                  <Input
                    id="title"
                    placeholder="Brief title describing the case (optional - can be added later)"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                  />
                  <p className="text-xs text-slate-500">Optional - add a descriptive title now or during case progression</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Additional Notes</Label>
                  <Textarea
                    id="description"
                    placeholder="Any additional information or notes about this case..."
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <Card className="border-2 border-emerald-200">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 text-white hover:opacity-90 h-11 text-base font-semibold"
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                  >
                    {loading ? 'Registering Case...' : 'Register Case'}
                  </Button>
                  <Link href="/cases" className="flex-1 sm:flex-initial">
                    <Button type="button" variant="outline" className="w-full h-11">
                      Cancel
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-slate-600 mt-4 text-center">
                  After registration, you can add documents, tasks, parties, and other details at any time as the case progresses.
                </p>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
