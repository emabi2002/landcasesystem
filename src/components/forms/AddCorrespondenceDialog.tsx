'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LabelWithHelp } from '@/components/help';
import { toast } from 'sonner';

interface AddCorrespondenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddCorrespondenceDialog({ open, onOpenChange, onSuccess }: AddCorrespondenceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reference_number: '',
    document_type: 'other',
    source: 'other',
    received_date: new Date().toISOString().split('T')[0],
    subject: '',
    description: '',
    file_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('incoming_correspondence').insert([
        {
          ...formData,
          received_by: user.id,
          acknowledgement_sent: false,
          status: 'received',
        } as never,
      ]);

      if (error) throw error;

      toast.success('Correspondence registered successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error registering correspondence:', error);
      toast.error('Failed to register correspondence');
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
          <DialogTitle>Register Incoming Correspondence</DialogTitle>
          <DialogDescription>
            Register documents received from courts, parties, or agencies
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <LabelWithHelp
                htmlFor="reference_number"
                helpTitle="Reference Number"
                help="A unique reference for this incoming item, for example IC-2025-001. Use your registry's numbering so the document can be traced later."
              >
                Reference Number *
              </LabelWithHelp>
              <Input
                id="reference_number"
                value={formData.reference_number}
                onChange={(e) => handleChange('reference_number', e.target.value)}
                placeholder="e.g., IC-2025-001"
                required
              />
            </div>

            <div className="space-y-2">
              <LabelWithHelp
                htmlFor="document_type"
                helpTitle="Document Type"
                help="What kind of document was received (Section 5 Notice, Court Order, Writ, etc.). Choosing the right type helps route and filter the item correctly."
              >
                Document Type *
              </LabelWithHelp>
              <Select value={formData.document_type} onValueChange={(value) => handleChange('document_type', value)}>
                <SelectTrigger id="document_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="section_5_notice">Section 5 Notice</SelectItem>
                  <SelectItem value="search_warrant">Search Warrant</SelectItem>
                  <SelectItem value="court_order">Court Order</SelectItem>
                  <SelectItem value="summons_ombudsman">Summons from Ombudsman</SelectItem>
                  <SelectItem value="writ">Writ</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <LabelWithHelp
                htmlFor="source"
                helpTitle="Source"
                help="Who sent the document (Plaintiff, Solicitor General, Court, Ombudsman, etc.). Record the true sender so acknowledgements go to the right party."
              >
                Source *
              </LabelWithHelp>
              <Select value={formData.source} onValueChange={(value) => handleChange('source', value)}>
                <SelectTrigger id="source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plaintiff">Plaintiff</SelectItem>
                  <SelectItem value="defendant">Defendant</SelectItem>
                  <SelectItem value="solicitor_general">Solicitor General</SelectItem>
                  <SelectItem value="ombudsman_commission">Ombudsman Commission</SelectItem>
                  <SelectItem value="court">Court</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <LabelWithHelp
                htmlFor="received_date"
                helpTitle="Received Date"
                help="The date the document actually arrived at the office - not today's data-entry date. This starts any response or acknowledgement clock."
              >
                Received Date *
              </LabelWithHelp>
              <Input
                id="received_date"
                type="date"
                value={formData.received_date}
                onChange={(e) => handleChange('received_date', e.target.value)}
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
              placeholder="Brief subject of the correspondence"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Detailed description of the document"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file_url">File URL</Label>
            <Input
              id="file_url"
              value={formData.file_url}
              onChange={(e) => handleChange('file_url', e.target.value)}
              placeholder="Link to uploaded document (optional)"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} style={{ background: '#EF5A5A' }}>
              {loading ? 'Registering...' : 'Register Correspondence'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
