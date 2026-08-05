'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Check, ChevronsUpDown, Plus, Save, X } from 'lucide-react';

import { AppLayout } from '@/components/layout/AppLayout';
import { HelpTooltip } from '@/components/help';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SelectWithAdd } from '@/components/ui/select-with-add';
import { Textarea } from '@/components/ui/textarea';
import { logAudit } from '@/lib/permissions';
import { supabase } from '@/lib/supabase';

interface ZoningType {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  is_active?: boolean | null;
}

interface ActionOfficer {
  id: string;
  name: string;
  title?: string | null;
  department?: string | null;
  division?: string | null;
  email?: string | null;
  phone?: string | null;
  employee_id?: string | null;
  office_location?: string | null;
  employment_status?: string | null;
  is_active?: boolean | null;
  profile_id?: string | null;
}

const emptyOfficerForm = {
  id: '',
  name: '',
  title: '',
  department: '',
  email: '',
  phone: '',
  employee_id: '',
  office_location: '',
  employment_status: 'active',
  notes: '',
  profile_id: '',
};

export default function NewCasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [savingLookup, setSavingLookup] = useState(false);
  const [zoningTypes, setZoningTypes] = useState<ZoningType[]>([]);
  const [actionOfficers, setActionOfficers] = useState<ActionOfficer[]>([]);
  const [zoningOpen, setZoningOpen] = useState(false);
  const [officerOpen, setOfficerOpen] = useState(false);
  const [zoningSearch, setZoningSearch] = useState('');
  const [officerSearch, setOfficerSearch] = useState('');
  const [zoningDialogOpen, setZoningDialogOpen] = useState(false);
  const [officerDialogOpen, setOfficerDialogOpen] = useState(false);
  const [zoningForm, setZoningForm] = useState({ name: '', description: '', status: 'active' });
  const [officerForm, setOfficerForm] = useState(emptyOfficerForm);

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
    zoning_type_id: '',
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
    dlpp_action_officer_id: '',
    officer_assigned_date: '',
    assignment_footnote: '',
    section5_notice: false,
  });

  useEffect(() => {
    void loadLookups();
  }, []);

  const loadLookups = async () => {
    try {
      const [{ data: zoningData }, { data: officerData }] = await Promise.all([
        (supabase as any)
          .from('zoning_types')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .order('name', { ascending: true }),
        (supabase as any)
          .from('action_officers')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true }),
      ]);

      setZoningTypes((zoningData as ZoningType[]) || []);
      setActionOfficers((officerData as ActionOfficer[]) || []);
    } catch (error) {
      console.error('Error loading registration lookups:', error);
      toast.error('Some lookup values could not be loaded');
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const selectedZoning = zoningTypes.find((item) => item.id === formData.zoning_type_id) || null;
  const selectedOfficer = actionOfficers.find((item) => item.id === formData.dlpp_action_officer_id) || null;

  const filteredZoningTypes = zoningTypes.filter((item) => {
    const q = zoningSearch.trim().toLowerCase();
    if (!q) return true;
    return [item.name, item.description].filter(Boolean).join(' ').toLowerCase().includes(q);
  });

  const filteredActionOfficers = actionOfficers.filter((item) => {
    const q = officerSearch.trim().toLowerCase();
    if (!q) return true;
    return [item.name, item.title, item.department, item.division, item.email, item.employee_id]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q);
  });

  const selectZoning = (zoning: ZoningType) => {
    setFormData((prev) => ({ ...prev, zoning_type_id: zoning.id, zoning: zoning.name }));
    setZoningSearch('');
    setZoningOpen(false);
  };

  const selectOfficer = (officer: ActionOfficer) => {
    setFormData((prev) => ({ ...prev, dlpp_action_officer_id: officer.id, dlpp_action_officer: officer.name }));
    setOfficerSearch('');
    setOfficerOpen(false);
  };

  const saveZoning = async () => {
    if (!zoningForm.name.trim()) {
      toast.error('Zoning name is required');
      return;
    }

    setSavingLookup(true);
    try {
      const response = await fetch('/api/lookups/zoning/upsert', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zoningForm),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save zoning');

      const zoning = result.zoning as ZoningType;
      setZoningTypes((previous) =>
        [...previous.filter((item) => item.id !== zoning.id), zoning].sort((a, b) => a.name.localeCompare(b.name))
      );
      selectZoning(zoning);
      setZoningDialogOpen(false);
      setZoningForm({ name: '', description: '', status: 'active' });
      toast.success('Zoning added and selected');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save zoning');
    } finally {
      setSavingLookup(false);
    }
  };

  const saveOfficer = async () => {
    if (!officerForm.name.trim() || !officerForm.title.trim() || !officerForm.department.trim()) {
      toast.error('Full name, title, and division are required');
      return;
    }

    setSavingLookup(true);
    try {
      const response = await fetch('/api/internal-officers/upsert', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(officerForm),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save officer');

      const officer = result.officer as ActionOfficer;
      setActionOfficers((previous) =>
        [...previous.filter((item) => item.id !== officer.id), officer].sort((a, b) => a.name.localeCompare(b.name))
      );
      selectOfficer(officer);
      setOfficerDialogOpen(false);
      setOfficerForm(emptyOfficerForm);
      toast.success('Officer added and selected');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save officer');
    } finally {
      setSavingLookup(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
          returnable_date: formData.returnable_date ? new Date(formData.returnable_date).toISOString() : null,
          user_id: user.id,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      if (!result.case) throw new Error('No case data returned');

      toast.success('Case registered successfully');
      await logAudit('create', 'cases', result.case.id, 'case', {
        case_number: result.case.case_number,
        title: formData.title,
      });
      router.push(`/cases/${result.case.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to register case';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">
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

        <form data-tour="newcase-form" onSubmit={handleSubmit} className="max-w-7xl mx-auto px-6 py-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-6">
                <span className="text-sm font-medium text-slate-700">DLPP Role:</span>
                <div className="flex gap-1 bg-white rounded-lg border border-slate-200 p-1">
                  <button
                    type="button"
                    onClick={() => handleChange('dlpp_role', 'defendant')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      formData.dlpp_role === 'defendant' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Defendant / Respondent
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('dlpp_role', 'plaintiff')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      formData.dlpp_role === 'plaintiff' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Plaintiff / Applicant
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4 pb-2 border-b border-slate-200">
                  Case Identification
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-slate-600">Internal Case No.</Label>
                    <Input placeholder="Auto-generated" value={formData.case_number} onChange={(e) => handleChange('case_number', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-slate-600">Court File Number</Label>
                      <HelpTooltip title="Court File Number" content="The reference the court uses for this matter. Copy it exactly from a court document." />
                    </div>
                    <Input placeholder="e.g., NC 123/2025" value={formData.court_file_number} onChange={(e) => handleChange('court_file_number', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Track Number</Label>
                    <Input placeholder="Track number" value={formData.track_number} onChange={(e) => handleChange('track_number', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Region</Label>
                    <SelectWithAdd value={formData.region} onValueChange={(value) => handleChange('region', value)} tableName="regions" placeholder="Select" className="mt-1" />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4 pb-2 border-b border-slate-200">
                  Parties & Matter
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-slate-600">Parties to Proceedings</Label>
                      <HelpTooltip title="Parties to Proceedings" content="List the parties in the matter using exact legal names." />
                    </div>
                    <Textarea placeholder="e.g., John Doe v. Department of Lands & Physical Planning" value={formData.parties_description} onChange={(e) => handleChange('parties_description', e.target.value)} className="mt-1" rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-slate-600">Matter Type</Label>
                      <SelectWithAdd value={formData.matter_type} onValueChange={(value) => handleChange('matter_type', value)} tableName="matter_types" placeholder="Select" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Case Category</Label>
                      <SelectWithAdd value={formData.case_type} onValueChange={(value) => handleChange('case_type', value)} tableName="case_categories" placeholder="Select" className="mt-1" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4 pb-2 border-b border-slate-200">
                  Key Dates
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <Label className="text-xs text-slate-600">Date Filed</Label>
                    <Input type="date" value={formData.proceeding_filed_date} onChange={(e) => handleChange('proceeding_filed_date', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Documents Served</Label>
                    <Input type="date" value={formData.documents_served_date} onChange={(e) => handleChange('documents_served_date', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Returnable Date</Label>
                    <Input type="datetime-local" value={formData.returnable_date} onChange={(e) => handleChange('returnable_date', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Hearing Type</Label>
                    <SelectWithAdd value={formData.returnable_type} onValueChange={(value) => handleChange('returnable_type', value)} tableName="hearing_types" placeholder="Select" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Document Type</Label>
                    <Input placeholder="e.g., Writ of Summons" value={formData.court_documents_type} onChange={(e) => handleChange('court_documents_type', e.target.value)} className="mt-1" />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4 pb-2 border-b border-slate-200">
                  Land Details
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <Label className="text-xs text-slate-600">Land Description</Label>
                    <Textarea placeholder="Location, boundaries, description..." value={formData.land_description} onChange={(e) => handleChange('land_description', e.target.value)} className="mt-1" rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-slate-600">Zoning</Label>
                      <div className="mt-1 flex gap-2">
                        <Popover open={zoningOpen} onOpenChange={setZoningOpen}>
                          <PopoverTrigger asChild>
                            <Button type="button" variant="outline" className="h-10 flex-1 justify-between font-normal">
                              <span className={selectedZoning ? 'truncate' : 'truncate text-slate-500'}>{selectedZoning?.name || 'Search or select zoning'}</span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-[360px] p-0">
                            <div className="border-b p-3">
                              <Input value={zoningSearch} onChange={(e) => setZoningSearch(e.target.value)} placeholder="Search zoning..." autoFocus />
                            </div>
                            <div className="max-h-72 overflow-y-auto p-1">
                              {filteredZoningTypes.length === 0 ? (
                                <div className="px-3 py-4 text-center text-sm text-slate-500">No matching record found.</div>
                              ) : (
                                filteredZoningTypes.map((item) => (
                                  <button key={item.id} type="button" onClick={() => selectZoning(item)} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-slate-100">
                                    <Check className={`h-4 w-4 ${formData.zoning_type_id === item.id ? 'opacity-100' : 'opacity-0'}`} />
                                    <span>{item.name}</span>
                                  </button>
                                ))
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <Button type="button" variant="outline" size="icon" onClick={() => setZoningDialogOpen(true)} title="Add new zoning">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Survey Plan No.</Label>
                      <Input placeholder="e.g., SP-12345" value={formData.survey_plan_no} onChange={(e) => handleChange('survey_plan_no', e.target.value)} className="mt-1" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <Label className="text-xs text-slate-600">Lease Type</Label>
                    <SelectWithAdd value={formData.lease_type} onValueChange={(value) => handleChange('lease_type', value)} tableName="lease_types" placeholder="Select" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Lease Start</Label>
                    <Input type="date" value={formData.lease_commencement_date} onChange={(e) => handleChange('lease_commencement_date', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Lease End</Label>
                    <Input type="date" value={formData.lease_expiration_date} onChange={(e) => handleChange('lease_expiration_date', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Division</Label>
                    <SelectWithAdd value={formData.division_responsible} onValueChange={(value) => handleChange('division_responsible', value)} tableName="divisions" placeholder="Select" className="mt-1" />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4 pb-2 border-b border-slate-200">
                  Legal Issues
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-600">{formData.dlpp_role === 'defendant' ? 'Allegations / Legal Issues' : 'Cause of Action'}</Label>
                    <Textarea placeholder={formData.dlpp_role === 'defendant' ? 'Allegations against DLPP...' : 'Cause of action and legal basis...'} value={formData.allegations} onChange={(e) => handleChange('allegations', e.target.value)} className="mt-1" rows={3} />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Reliefs Sought</Label>
                    <Textarea placeholder="Reliefs sought..." value={formData.reliefs_sought} onChange={(e) => handleChange('reliefs_sought', e.target.value)} className="mt-1" rows={3} />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4 pb-2 border-b border-slate-200">
                  Legal Representatives & Assignment
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-slate-600">{formData.dlpp_role === 'defendant' ? "Plaintiff's Lawyer" : "Defendant's Lawyer"}</Label>
                    <SelectWithAdd value={formData.opposing_lawyer_name} onValueChange={(value) => handleChange('opposing_lawyer_name', value)} tableName="lawyers" placeholder="Select" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Sol Gen Officer</Label>
                    <SelectWithAdd value={formData.sol_gen_officer} onValueChange={(value) => handleChange('sol_gen_officer', value)} tableName="sol_gen_officers" placeholder="Select" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">DLPP Action Officer</Label>
                    <div className="mt-1 flex gap-2">
                      <Popover open={officerOpen} onOpenChange={setOfficerOpen}>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" className="h-10 flex-1 justify-between font-normal">
                            <span className={selectedOfficer ? 'truncate' : 'truncate text-slate-500'}>
                              {selectedOfficer ? `${selectedOfficer.name} – ${selectedOfficer.title || 'Officer'}` : 'Search or select officer'}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-[420px] p-0">
                          <div className="border-b p-3">
                            <Input value={officerSearch} onChange={(e) => setOfficerSearch(e.target.value)} placeholder="Search name, title, division, email..." autoFocus />
                          </div>
                          <div className="max-h-72 overflow-y-auto p-1">
                            {filteredActionOfficers.length === 0 ? (
                              <div className="px-3 py-4 text-center text-sm text-slate-500">No matching record found.</div>
                            ) : (
                              filteredActionOfficers.map((item) => (
                                <button key={item.id} type="button" onClick={() => selectOfficer(item)} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-slate-100">
                                  <Check className={`h-4 w-4 ${formData.dlpp_action_officer_id === item.id ? 'opacity-100' : 'opacity-0'}`} />
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate font-medium">{item.name}</span>
                                    <span className="block truncate text-xs text-slate-500">{item.title || 'Officer'} · {item.department || item.division || 'No division'}</span>
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button type="button" variant="outline" size="icon" onClick={() => setOfficerDialogOpen(true)} title="Add new officer">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Date Assigned</Label>
                    <Input type="date" value={formData.officer_assigned_date} onChange={(e) => handleChange('officer_assigned_date', e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="text-xs text-slate-600">Assignment Notes</Label>
                  <Textarea placeholder="Notes from manager/supervisor..." value={formData.assignment_footnote} onChange={(e) => handleChange('assignment_footnote', e.target.value)} className="mt-1" rows={2} />
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4 pb-2 border-b border-slate-200">
                  Status & Priority
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-slate-600">Status</Label>
                    <SelectWithAdd value={formData.status} onValueChange={(value) => handleChange('status', value)} tableName="case_statuses" placeholder="Select" useCodeAsValue className="mt-1" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-slate-600">Priority</Label>
                      <HelpTooltip title="Priority" content="How urgent the case is. Set High or Urgent for matters with close deadlines." />
                    </div>
                    <SelectWithAdd value={formData.priority} onValueChange={(value) => handleChange('priority', value)} tableName="priority_levels" placeholder="Select" useCodeAsValue className="mt-1" />
                  </div>
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-slate-600">Case Title</Label>
                      <HelpTooltip title="Case Title" content="A short, clear name so the case can be recognised and found later." />
                    </div>
                    <Input placeholder="Brief descriptive title" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label className="text-xs text-slate-600">Additional Notes</Label>
                    <Textarea placeholder="Additional information..." value={formData.description} onChange={(e) => handleChange('description', e.target.value)} className="mt-1" rows={2} />
                  </div>
                  {formData.dlpp_role === 'defendant' && (
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <Checkbox id="section5_notice" checked={formData.section5_notice} onCheckedChange={(checked: boolean) => handleChange('section5_notice', checked)} />
                      <Label htmlFor="section5_notice" className="text-sm font-medium cursor-pointer">Section 5 Notice Applies</Label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <Link href="/cases"><Button type="button" variant="outline">Cancel</Button></Link>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 min-w-[120px]">
                {loading ? 'Saving...' : 'Register Case'}
              </Button>
            </div>
          </div>
        </form>

        <Dialog open={zoningDialogOpen} onOpenChange={setZoningDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Zoning</DialogTitle>
              <DialogDescription>Create a controlled zoning lookup value.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Zoning name *</Label>
                <Input value={zoningForm.name} onChange={(e) => setZoningForm({ ...zoningForm, name: e.target.value })} placeholder="Residential" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={zoningForm.description} onChange={(e) => setZoningForm({ ...zoningForm, description: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={zoningForm.status} onValueChange={(value) => setZoningForm({ ...zoningForm, status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setZoningDialogOpen(false)}>Cancel</Button>
              <Button type="button" onClick={saveZoning} disabled={savingLookup} className="bg-emerald-600 hover:bg-emerald-700">{savingLookup ? 'Saving...' : 'Add and Select'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={officerDialogOpen} onOpenChange={setOfficerDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Add New DLPP Officer</DialogTitle>
              <DialogDescription>Create an officer record only. This does not create system login access.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Full name *</Label>
                <Input value={officerForm.name} onChange={(e) => setOfficerForm({ ...officerForm, name: e.target.value })} placeholder="Samuel Kila" />
              </div>
              <div className="space-y-2">
                <Label>Job title *</Label>
                <Input value={officerForm.title} onChange={(e) => setOfficerForm({ ...officerForm, title: e.target.value })} placeholder="Principal Legal Officer" />
              </div>
              <div className="space-y-2">
                <Label>Division / section *</Label>
                <Input value={officerForm.department} onChange={(e) => setOfficerForm({ ...officerForm, department: e.target.value })} placeholder="Legal Services Division" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={officerForm.email} onChange={(e) => setOfficerForm({ ...officerForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telephone</Label>
                <Input value={officerForm.phone} onChange={(e) => setOfficerForm({ ...officerForm, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Employee / staff number</Label>
                <Input value={officerForm.employee_id} onChange={(e) => setOfficerForm({ ...officerForm, employee_id: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={officerForm.employment_status} onValueChange={(value) => setOfficerForm({ ...officerForm, employment_status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="leave">On Leave</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOfficerDialogOpen(false)}>Cancel</Button>
              <Button type="button" onClick={saveOfficer} disabled={savingLookup} className="bg-emerald-600 hover:bg-emerald-700">{savingLookup ? 'Saving...' : 'Add and Select'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
