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
import { DocumentUpload } from '@/components/forms/DocumentUpload';
import { ArrowLeft, FileText, AlertCircle, CheckCircle2, Upload, UserPlus, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { notifyNewCase } from '@/lib/notification-utils';

interface Party {
  name: string;
  role: 'plaintiff' | 'defendant' | 'witness' | 'other';
  party_type: 'individual' | 'company' | 'government_entity' | 'other';
  contact_info?: {
    phone?: string;
    email?: string;
    address?: string;
  };
}

export default function CreateMinimalCasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [isOldCase, setIsOldCase] = useState(false);
  const [formData, setFormData] = useState({
    dlpp_role: 'defendant' as 'defendant' | 'plaintiff',
    brief_description: '',
    case_type: 'court_matter' as string,
    old_case_reference: '',
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

      // Prepare case data
      const caseData: any = {
        case_number: caseNumber,
        title: caseTitle,
        description: formData.brief_description || null,
        dlpp_role: formData.dlpp_role,
        status: 'registered',
        priority: 'medium',
        case_type: formData.case_type,
        workflow_status: 'registered',
        created_by: user.id,
      };

      // Add old case reference if this is an old case
      if (isOldCase && formData.old_case_reference) {
        caseData.description = `OLD CASE REF: ${formData.old_case_reference}\n\n${formData.brief_description || ''}`;
      }

      // Insert minimal case record
      const { data: newCase, error: caseError } = await (supabase as any)
        .from('cases')
        .insert([caseData])
        .select()
        .single();

      if (caseError) throw caseError;
      if (!newCase) throw new Error('No case data returned');

      // Insert parties if any were added
      if (parties.length > 0) {
        const partyRecords = parties.map(party => ({
          case_id: newCase.id,
          name: party.name,
          role: party.role,
          party_type: party.party_type,
          contact_info: party.contact_info || {},
        }));

        const { error: partyError } = await (supabase as any)
          .from('parties')
          .insert(partyRecords);

        if (partyError) {
          console.error('Error inserting parties:', partyError);
          toast.error('Case created but failed to add parties. Please add them manually.');
        }
      }

      // Link uploaded documents to the case (optional)
      if (uploadedDocuments.length > 0) {
        const documentRecords = uploadedDocuments.map((filePath, index) => ({
          case_id: newCase.id,
          title: `Originating Document ${index + 1}`,
          description: 'Document uploaded during case registration',
          file_path: filePath,
          file_type: filePath.split('.').pop() || 'unknown',
          uploaded_by: user.id,
          uploaded_at: new Date().toISOString(),
        }));

        const { error: docError } = await (supabase as any)
          .from('documents')
          .insert(documentRecords);

        if (docError) {
          console.error('Error linking documents:', docError);
          toast.error('Case created but failed to link documents. Please add them manually.');
        }
      }

      // Send automatic notifications to Secretary, Director Legal, and Manager Legal
      const notificationResult = await notifyNewCase({
        case_id: newCase.id,
        case_number: caseNumber,
        case_title: caseTitle,
        case_type: formData.case_type,
        created_by: user.id
      });

      // Show success message
      const successMsg = isOldCase
        ? `Case ${caseNumber} created successfully (Old Case Ref: ${formData.old_case_reference})`
        : `Case ${caseNumber} created successfully!`;

      if (notificationResult.success) {
        toast.success(successMsg + '\n📧 Alerts sent to Secretary, Director Legal, and Manager Legal', { duration: 4000 });
      } else {
        toast.success(successMsg, { duration: 3000 });
        toast.warning('Note: Notifications could not be sent to all recipients', { duration: 3000 });
      }

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

  const handleDocumentUpload = (filePath: string) => {
    setUploadedDocuments(prev => [...prev, filePath]);
    toast.success('Document uploaded successfully!');
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addParty = () => {
    setParties(prev => [...prev, {
      name: '',
      role: 'plaintiff',
      party_type: 'individual',
      contact_info: {}
    }]);
  };

  const removeParty = (index: number) => {
    setParties(prev => prev.filter((_, i) => i !== index));
  };

  const updateParty = (index: number, field: keyof Party, value: any) => {
    setParties(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
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
              {/* Old Case vs New Case Toggle */}
              <div className="space-y-2">
                <Label>Case Type</Label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsOldCase(false)}
                    className={`flex-1 p-3 border-2 rounded-lg font-medium transition-all ${
                      !isOldCase
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    New Case
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOldCase(true)}
                    className={`flex-1 p-3 border-2 rounded-lg font-medium transition-all ${
                      isOldCase
                        ? 'border-amber-500 bg-amber-50 text-amber-900'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    Old Case (Needs New Court Reference)
                  </button>
                </div>
              </div>

              {/* Old Case Reference Number (conditional) */}
              {isOldCase && (
                <div className="space-y-2 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                  <Label htmlFor="old_case_reference" className="text-amber-900">
                    Old Case Reference Number *
                  </Label>
                  <Input
                    id="old_case_reference"
                    placeholder="e.g., DLPP-2020-123456 or Court Ref: ABC/2020/123"
                    value={formData.old_case_reference}
                    onChange={(e) => handleChange('old_case_reference', e.target.value)}
                    required={isOldCase}
                    className="border-amber-300 focus:border-amber-500"
                  />
                  <p className="text-xs text-amber-700">
                    Enter the old case reference number. System will generate a new ID for this case.
                  </p>
                </div>
              )}

              {/* Case Type */}
              <div className="space-y-2">
                <Label htmlFor="case_type">Case Type *</Label>
                <Select value={formData.case_type} onValueChange={(value) => handleChange('case_type', value)}>
                  <SelectTrigger id="case_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="court_matter">Court Matter</SelectItem>
                    <SelectItem value="dispute">Dispute</SelectItem>
                    <SelectItem value="title_claim">Title Claim</SelectItem>
                    <SelectItem value="administrative_review">Administrative Review</SelectItem>
                    <SelectItem value="judicial_review">Judicial Review</SelectItem>
                    <SelectItem value="tort">Tort</SelectItem>
                    <SelectItem value="compensation_claim">Compensation Claim</SelectItem>
                    <SelectItem value="fraud">Fraud</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Select the type of case to properly categorize it
                </p>
              </div>

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
                  rows={5}
                  maxLength={1000}
                />
                <p className="text-xs text-slate-500">
                  Optional - helps identify the case. Can be updated later. ({formData.brief_description.length}/1000)
                </p>
              </div>

              {/* Parties Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Parties Involved (Optional)</Label>
                  <Button
                    type="button"
                    onClick={addParty}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Party
                  </Button>
                </div>
                {parties.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">
                    No parties added yet. You can add parties now or later from the case details page.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {parties.map((party, index) => (
                      <div key={index} className="p-4 border-2 border-slate-200 rounded-lg space-y-3 bg-slate-50">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-slate-900">Party {index + 1}</h4>
                          <Button
                            type="button"
                            onClick={() => removeParty(index)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <Label className="text-xs">Name *</Label>
                            <Input
                              value={party.name}
                              onChange={(e) => updateParty(index, 'name', e.target.value)}
                              placeholder="Full name"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Role *</Label>
                            <Select
                              value={party.role}
                              onValueChange={(value) => updateParty(index, 'role', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="plaintiff">Plaintiff</SelectItem>
                                <SelectItem value="defendant">Defendant</SelectItem>
                                <SelectItem value="witness">Witness</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Type *</Label>
                            <Select
                              value={party.party_type}
                              onValueChange={(value) => updateParty(index, 'party_type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="individual">Individual</SelectItem>
                                <SelectItem value="company">Company</SelectItem>
                                <SelectItem value="government_entity">Government Entity</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Originating Document Upload - NOW OPTIONAL */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Originating Document(s) (Optional)
                </Label>
                <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                  <DocumentUpload
                    caseId="" // Will be set after case creation
                    onUploadComplete={handleDocumentUpload}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    maxSize={50 * 1024 * 1024} // 50MB
                  />
                  {uploadedDocuments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-emerald-700">
                        ✅ {uploadedDocuments.length} document(s) uploaded
                      </p>
                      <div className="space-y-1">
                        {uploadedDocuments.map((doc, index) => (
                          <div key={index} className="text-xs text-slate-600 flex items-center gap-2">
                            <FileText className="h-3 w-3" />
                            Document {index + 1}: {doc.split('/').pop()}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  <strong>Optional:</strong> Upload the originating document(s) for this case (e.g., court summons, notice, complaint).
                  You can always attach documents later from the case details page.
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
                  {isOldCase && (
                    <li>✅ <strong>Old Reference:</strong> {formData.old_case_reference || 'Will be recorded'}</li>
                  )}
                  <li>✅ <strong>Case Title:</strong> Based on description or auto-generated</li>
                  <li>✅ <strong>Case Type:</strong> {formData.case_type.replace(/_/g, ' ').toUpperCase()}</li>
                  <li>✅ <strong>Status:</strong> Registered (ready for workflow)</li>
                  {parties.length > 0 && (
                    <li>✅ <strong>Parties:</strong> {parties.length} partie(s) will be added</li>
                  )}
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
