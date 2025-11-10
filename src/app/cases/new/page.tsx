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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewCasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    case_number: '',
    title: '',
    description: '',
    status: 'under_review',
    case_type: 'dispute',
    priority: 'medium',
    region: '',
    case_origin: 'other',
    court_file_number: '',
    first_hearing_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Prepare case data with proper timestamp conversion
      const caseData = {
        ...formData,
        // Convert datetime-local to ISO timestamp or null
        first_hearing_date: formData.first_hearing_date
          ? new Date(formData.first_hearing_date).toISOString()
          : null,
        created_by: user.id,
        assigned_officer_id: null,
      };

      const { data, error } = await supabase
        .from('cases')
        .insert([caseData as never])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned');

      // Show success message with info about auto-created events
      if (formData.first_hearing_date) {
        toast.success('Case registered successfully! Calendar events created for case registration and first hearing.');
      } else {
        toast.success('Case registered successfully! Calendar event created for case registration.');
      }

      router.push(`/cases/${(data as { id: string }).id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to register case';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />

      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/cases">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Cases
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Register New Case</h1>
          <p className="text-slate-600 mt-1">Enter case details and information</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Case Information</CardTitle>
              <CardDescription>Provide details about the legal case</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="case_number">Case Number *</Label>
                  <Input
                    id="case_number"
                    placeholder="e.g., DLPP-2025-001"
                    value={formData.case_number}
                    onChange={(e) => handleChange('case_number', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    placeholder="e.g., Central Province"
                    value={formData.region}
                    onChange={(e) => handleChange('region', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Case Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief title describing the case"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the case..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="first_hearing_date">First Hearing Date (Optional)</Label>
                <Input
                  id="first_hearing_date"
                  type="datetime-local"
                  value={formData.first_hearing_date}
                  onChange={(e) => handleChange('first_hearing_date', e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  This will automatically create a calendar event for the first hearing
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="case_origin">Case Origin *</Label>
                  <Select value={formData.case_origin} onValueChange={(value) => handleChange('case_origin', value)}>
                    <SelectTrigger id="case_origin">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="section_160_registrar">Section 160 by Registrar for Titles</SelectItem>
                      <SelectItem value="summons">Summons</SelectItem>
                      <SelectItem value="dlpp_initiated">DLPP Initiated</SelectItem>
                      <SelectItem value="litigation_lawyers">Litigation Lawyers</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="court_file_number">Court File Number</Label>
                  <Input
                    id="court_file_number"
                    placeholder="e.g., CF-2025-001"
                    value={formData.court_file_number}
                    onChange={(e) => handleChange('court_file_number', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="case_type">Case Type *</Label>
                  <Select value={formData.case_type} onValueChange={(value) => handleChange('case_type', value)}>
                    <SelectTrigger id="case_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dispute">Dispute</SelectItem>
                      <SelectItem value="court_matter">Court Matter</SelectItem>
                      <SelectItem value="title_claim">Title Claim</SelectItem>
                      <SelectItem value="administrative_review">Administrative Review</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
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
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="settled">Settled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
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

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 md:flex-initial text-white hover:opacity-90"
                  style={{ background: '#EF5A5A' }}
                >
                  {loading ? 'Registering...' : 'Register Case'}
                </Button>
                <Link href="/cases">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
