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

interface AddCommunicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddCommunicationDialog({ open, onOpenChange, onSuccess }: AddCommunicationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState<{ id: string; case_number: string; title: string }[]>([]);
  const [formData, setFormData] = useState({
    case_id: '',
    communication_type: 'email',
    direction: 'outgoing',
    party_type: 'plaintiff',
    party_name: '',
    subject: '',
    content: '',
    communication_date: new Date().toISOString().split('T')[0],
    response_required: false,
    response_deadline: '',
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

      const { error } = await supabase.from('communications').insert([
        {
          ...formData,
          handled_by: user.id,
          response_status: formData.response_required ? 'pending' : 'no_response_needed',
          response_deadline: formData.response_deadline || null,
        } as never,
      ]);

      if (error) throw error;

      toast.success('Communication logged successfully!');
      onSuccess();
      setFormData({
        case_id: '',
        communication_type: 'email',
        direction: 'outgoing',
        party_type: 'plaintiff',
        party_name: '',
        subject: '',
        content: '',
        communication_date: new Date().toISOString().split('T')[0],
        response_required: false,
        response_deadline: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error logging communication:', error);
      toast.error('Failed to log communication');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Communication</DialogTitle>
          <DialogDescription>
            Record a communication with parties, lawyers, or the court
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

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="communication_type">Type *</Label>
              <Select value={formData.communication_type} onValueChange={(value) => handleChange('communication_type', value)}>
                <SelectTrigger id="communication_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="letter">Letter</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="in_person">In Person</SelectItem>
                  <SelectItem value="fax">Fax</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direction">Direction *</Label>
              <Select value={formData.direction} onValueChange={(value) => handleChange('direction', value)}>
                <SelectTrigger id="direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incoming">Incoming</SelectItem>
                  <SelectItem value="outgoing">Outgoing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="party_type">Party Type *</Label>
              <Select value={formData.party_type} onValueChange={(value) => handleChange('party_type', value)}>
                <SelectTrigger id="party_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plaintiff">Plaintiff</SelectItem>
                  <SelectItem value="defendant">Defendant</SelectItem>
                  <SelectItem value="solicitor_general">Solicitor General</SelectItem>
                  <SelectItem value="private_lawyer">Private Lawyer</SelectItem>
                  <SelectItem value="witness">Witness</SelectItem>
                  <SelectItem value="court">Court</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="party_name">Party Name</Label>
              <Input
                id="party_name"
                value={formData.party_name}
                onChange={(e) => handleChange('party_name', e.target.value)}
                placeholder="Name of person/organization"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="communication_date">Date *</Label>
              <Input
                id="communication_date"
                type="date"
                value={formData.communication_date}
                onChange={(e) => handleChange('communication_date', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              placeholder="Communication subject"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content/Summary</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="Details of the communication"
              rows={4}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="response_required"
                checked={formData.response_required}
                onChange={(e) => handleChange('response_required', e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="response_required">Response Required</Label>
            </div>

            {formData.response_required && (
              <div className="flex-1 space-y-2">
                <Label htmlFor="response_deadline">Response Deadline</Label>
                <Input
                  id="response_deadline"
                  type="date"
                  value={formData.response_deadline}
                  onChange={(e) => handleChange('response_deadline', e.target.value)}
                />
              </div>
            )}
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
              {loading ? 'Logging...' : 'Log Communication'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
