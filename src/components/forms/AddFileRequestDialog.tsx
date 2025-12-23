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

interface AddFileRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddFileRequestDialog({ open, onOpenChange, onSuccess }: AddFileRequestDialogProps) {
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState<{ id: string; case_number: string; title: string }[]>([]);
  const [formData, setFormData] = useState({
    case_id: '',
    file_type: 'court_file',
    file_number: '',
    current_location: '',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      void loadCases();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('file_requests').insert([
        {
          ...formData,
          requested_by: user.id,
          status: 'requested',
        } as never,
      ]);

      if (error) throw error;

      toast.success('File request created successfully!');
      onSuccess();
      setFormData({
        case_id: '',
        file_type: 'court_file',
        file_number: '',
        current_location: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error creating file request:', error);
      toast.error('Failed to create file request');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request File</DialogTitle>
          <DialogDescription>
            Request a court file, land file, or title file for a case
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
              <Label htmlFor="file_type">File Type *</Label>
              <Select value={formData.file_type} onValueChange={(value) => handleChange('file_type', value)}>
                <SelectTrigger id="file_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="court_file">Court File</SelectItem>
                  <SelectItem value="land_file">Land File</SelectItem>
                  <SelectItem value="title_file">Title File</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file_number">File Number</Label>
              <Input
                id="file_number"
                value={formData.file_number}
                onChange={(e) => handleChange('file_number', e.target.value)}
                placeholder="e.g., CF-2025-001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_location">Expected Location</Label>
            <Input
              id="current_location"
              value={formData.current_location}
              onChange={(e) => handleChange('current_location', e.target.value)}
              placeholder="Where the file might be located"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional information"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} style={{ background: '#EF5A5A' }}>
              {loading ? 'Creating...' : 'Create Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
