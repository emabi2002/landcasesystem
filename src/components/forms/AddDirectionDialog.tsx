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

interface AddDirectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddDirectionDialog({ open, onOpenChange, onSuccess }: AddDirectionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    direction_number: '',
    source: 'manager_legal_services',
    issued_date: new Date().toISOString().split('T')[0],
    subject: '',
    content: '',
    priority: 'medium',
    due_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('directions').insert([
        {
          ...formData,
          issued_by: user.id,
          status: 'pending',
          due_date: formData.due_date || null,
        } as never,
      ]);

      if (error) throw error;

      toast.success('Direction added successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error adding direction:', error);
      toast.error('Failed to add direction');
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
          <DialogTitle>Add New Direction</DialogTitle>
          <DialogDescription>
            Record a directive from Secretary, Director, or Manager
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="direction_number">Direction Number *</Label>
              <Input
                id="direction_number"
                value={formData.direction_number}
                onChange={(e) => handleChange('direction_number', e.target.value)}
                placeholder="e.g., DIR-2025-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source *</Label>
              <Select value={formData.source} onValueChange={(value) => handleChange('source', value)}>
                <SelectTrigger id="source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="secretary_lands">Secretary Lands</SelectItem>
                  <SelectItem value="director_legal_services">Director Legal Services</SelectItem>
                  <SelectItem value="manager_legal_services">Manager Legal Services</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issued_date">Issued Date *</Label>
              <Input
                id="issued_date"
                type="date"
                value={formData.issued_date}
                onChange={(e) => handleChange('issued_date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange('due_date', e.target.value)}
              />
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

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              placeholder="Brief subject of the direction"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Direction Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="Full details of the direction"
              rows={6}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} style={{ background: '#EF5A5A' }}>
              {loading ? 'Adding...' : 'Add Direction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
