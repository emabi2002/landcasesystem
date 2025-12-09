'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface AddFilingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddFilingDialog({ open, onOpenChange, onSuccess }: AddFilingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState<{ id: string; case_number: string; title: string }[]>([]);
  const [lawyers, setLawyers] = useState<{ id: string; name: string; organization: string }[]>([]);
  const [formData, setFormData] = useState({
    case_id: '',
    filing_type: 'instruction_letter',
    title: '',
    description: '',
    filing_number: '',
    submitted_to: '',
    file_url: '',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      void loadCases();
      void loadLawyers();
    }
  }, [open]);

  const loadCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_number, title')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  };

  const loadLawyers = async () => {
    try {
      const { data, error } = await supabase
        .from('external_lawyers')
        .select('id, name, organization')
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setLawyers(data || []);
    } catch (error) {
      console.error('Error loading lawyers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('filings').insert([
        {
          ...formData,
          prepared_by: user.id,
          prepared_date: new Date().toISOString(),
          status: 'draft',
          submitted_to: formData.submitted_to || null,
        } as never,
      ]);

      if (error) throw error;

      toast.success('Filing created successfully!');
      onSuccess();
      setFormData({
        case_id: '',
        filing_type: 'instruction_letter',
        title: '',
        description: '',
        filing_number: '',
        submitted_to: '',
        file_url: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error creating filing:', error);
      toast.error('Failed to create filing');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Filing</DialogTitle>
          <DialogDescription>
            Create instruction letter, affidavit, or other legal filing
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="case_id">Case *</Label>
            <Select value={formData.case_id} onValueChange={(value) => handleChange('case_id', value)} required>
              <SelectTrigger id="case_id">
                <SelectValue placeholder="Select a case" />
              </SelectTrigger>
              <SelectContent>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.case_number} - {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="filing_type">Filing Type *</Label>
              <Select value={formData.filing_type} onValueChange={(value) => handleChange('filing_type', value)}>
                <SelectTrigger id="filing_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instruction_letter">Instruction Letter</SelectItem>
                  <SelectItem value="affidavit">Affidavit</SelectItem>
                  <SelectItem value="motion">Motion</SelectItem>
                  <SelectItem value="response">Response</SelectItem>
                  <SelectItem value="brief">Brief</SelectItem>
                  <SelectItem value="notice">Notice</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filing_number">Filing Number</Label>
              <Input
                id="filing_number"
                value={formData.filing_number}
                onChange={(e) => handleChange('filing_number', e.target.value)}
                placeholder="e.g., FL-2025-001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Filing title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Detailed description of the filing"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="submitted_to">Submit to (Lawyer)</Label>
            <Select value={formData.submitted_to} onValueChange={(value) => handleChange('submitted_to', value)}>
              <SelectTrigger id="submitted_to">
                <SelectValue placeholder="Select a lawyer (optional)" />
              </SelectTrigger>
              <SelectContent>
                {lawyers.map((lawyer) => (
                  <SelectItem key={lawyer.id} value={lawyer.id}>
                    {lawyer.name} - {lawyer.organization}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file_url">Document URL</Label>
            <Input
              id="file_url"
              value={formData.file_url}
              onChange={(e) => handleChange('file_url', e.target.value)}
              placeholder="Link to document file"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} style={{ background: '#EF5A5A' }}>
              {loading ? 'Creating...' : 'Create Filing'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
