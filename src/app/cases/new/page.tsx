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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('cases')
        .insert([
          {
            ...formData,
            created_by: user.id,
            assigned_officer_id: null,
          } as never,
        ])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned');

      toast.success('Case registered successfully!');
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
