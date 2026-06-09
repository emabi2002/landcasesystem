'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface AddLawyerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddLawyerDialog({ open, onOpenChange, onSuccess }: AddLawyerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    lawyer_type: 'private_lawyer',
    contact_email: '',
    contact_phone: '',
    address: '',
    specialization: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('external_lawyers').insert([
        {
          ...formData,
          active: true,
        } as never,
      ]);

      if (error) throw error;

      toast.success('Lawyer added successfully!');
      onSuccess();
      setFormData({
        name: '',
        organization: '',
        lawyer_type: 'private_lawyer',
        contact_email: '',
        contact_phone: '',
        address: '',
        specialization: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error adding lawyer:', error);
      toast.error('Failed to add lawyer');
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
          <DialogTitle>Add External Lawyer</DialogTitle>
          <DialogDescription>
            Add a new Solicitor General or private lawyer to the directory
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., John Smith"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lawyer_type">Lawyer Type *</Label>
              <Select value={formData.lawyer_type} onValueChange={(value) => handleChange('lawyer_type', value)}>
                <SelectTrigger id="lawyer_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solicitor_general">Solicitor General</SelectItem>
                  <SelectItem value="private_lawyer">Private Lawyer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">Organization *</Label>
            <Input
              id="organization"
              value={formData.organization}
              onChange={(e) => handleChange('organization', e.target.value)}
              placeholder="e.g., Office of Solicitor General"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone">Phone</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                placeholder="+675 xxx xxxx"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Physical address"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization</Label>
            <Input
              id="specialization"
              value={formData.specialization}
              onChange={(e) => handleChange('specialization', e.target.value)}
              placeholder="e.g., Land Law, Constitutional Law"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional information"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} style={{ background: '#EF5A5A' }}>
              {loading ? 'Adding...' : 'Add Lawyer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
