'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Party {
  id: string;
  name: string;
  party_type: string;
  role: string;
  contact_info: Record<string, unknown> | null;
}

interface EditPartyDialogProps {
  party: Party;
  onSuccess: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPartyDialog({ party, onSuccess, open, onOpenChange }: EditPartyDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: party.name,
    party_type: party.party_type,
    role: party.role,
    contact_info: party.contact_info ? JSON.stringify(party.contact_info) : '',
  });

  useEffect(() => {
    setFormData({
      name: party.name,
      party_type: party.party_type,
      role: party.role,
      contact_info: party.contact_info ? JSON.stringify(party.contact_info) : '',
    });
  }, [party]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const contactInfo = formData.contact_info ? JSON.parse(JSON.stringify({ notes: formData.contact_info })) : null;

      const { error } = await supabase
        .from('parties')
        .update({
          name: formData.name,
          party_type: formData.party_type,
          role: formData.role,
          contact_info: contactInfo,
        } as never)
        .eq('id', party.id);

      if (error) throw error;

      toast.success('Party updated successfully!');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Party update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update party';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this party? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('parties')
        .delete()
        .eq('id', party.id);

      if (error) throw error;

      toast.success('Party deleted successfully!');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Party delete error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete party';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Party</DialogTitle>
          <DialogDescription>Update party information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Party Name *</Label>
            <Input
              id="name"
              placeholder="Full name or organization name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="party_type">Party Type *</Label>
            <Select value={formData.party_type} onValueChange={(value) => setFormData({ ...formData, party_type: value })}>
              <SelectTrigger id="party_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
                <SelectItem value="government_entity">Government Agency</SelectItem>
                <SelectItem value="clan">Clan/Community</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role in Case *</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plaintiff">Plaintiff/Claimant</SelectItem>
                <SelectItem value="defendant">Defendant/Respondent</SelectItem>
                <SelectItem value="witness">Witness</SelectItem>
                <SelectItem value="legal_rep">Legal Representative</SelectItem>
                <SelectItem value="third_party">Third Party</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_info">Contact Information</Label>
            <Textarea
              id="contact_info"
              placeholder="Phone, email, address, or other contact details..."
              value={formData.contact_info}
              onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading} className="sm:mr-auto">
              Delete
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="text-white hover:opacity-90" style={{ background: '#EF5A5A' }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
