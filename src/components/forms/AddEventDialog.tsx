'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface AddEventDialogProps {
  caseId: string;
  onSuccess: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function AddEventDialog({ caseId, onSuccess, open: controlledOpen, onOpenChange, trigger }: AddEventDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    event_type: 'other',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('events')
        .insert([
          {
            case_id: caseId,
            title: formData.title,
            description: formData.description || null,
            event_date: new Date(formData.event_date).toISOString(),
            location: formData.location || null,
            event_type: formData.event_type,
          } as never,
        ]);

      if (error) throw error;

      toast.success('Event created successfully!');
      setOpen(false);
      setFormData({
        title: '',
        description: '',
        event_date: '',
        location: '',
        event_type: 'other',
      });
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create event';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!controlledOpen && (
        <DialogTrigger asChild>
          {trigger || (
            <Button className="gap-2 text-white hover:opacity-90" style={{ background: '#EF5A5A' }}>
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Event</DialogTitle>
          <DialogDescription>Add a hearing, deadline, or meeting for this case</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event_type">Event Type *</Label>
            <Select value={formData.event_type} onValueChange={(value) => setFormData({ ...formData, event_type: value })}>
              <SelectTrigger id="event_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hearing">Court Hearing</SelectItem>
                <SelectItem value="filing_deadline">Filing Deadline</SelectItem>
                <SelectItem value="response_deadline">Response Deadline</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Court Hearing, Filing Deadline"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_date">Date & Time *</Label>
            <Input
              id="event_date"
              type="datetime-local"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Supreme Court, Room 123"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Additional details about the event..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="text-white hover:opacity-90" style={{ background: '#EF5A5A' }}>
              {loading ? 'Creating...' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
