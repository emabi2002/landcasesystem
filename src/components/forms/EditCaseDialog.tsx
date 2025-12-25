'use client';

import { useState, useEffect } from 'react';
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
import { Edit } from 'lucide-react';
import { toast } from 'sonner';

interface CaseData {
  id: string;
  title: string | null;
  description?: string | null;
  case_type: string;
  priority: string;
  status: string;
  region?: string | null;
}

interface EditCaseDialogProps {
  caseData: CaseData;
  onSuccess: () => void;
}

export function EditCaseDialog({ caseData, onSuccess }: EditCaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: caseData.title || '',
    description: caseData.description || '',
    case_type: caseData.case_type,
    priority: caseData.priority,
    status: caseData.status,
    region: caseData.region || '',
  });

  useEffect(() => {
    setFormData({
      title: caseData.title || '',
      description: caseData.description || '',
      case_type: caseData.case_type,
      priority: caseData.priority,
      status: caseData.status,
      region: caseData.region || '',
    });
  }, [caseData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('cases')
        .update({
          title: formData.title,
          description: formData.description || null,
          case_type: formData.case_type,
          priority: formData.priority,
          status: formData.status,
          region: formData.region || null,
        } as never)
        .eq('id', caseData.id);

      if (error) throw error;

      // Add to case history
      await supabase.from('case_history').insert([
        {
          case_id: caseData.id,
          action: 'Case Updated',
          description: `Case details were modified by ${user.email}`,
          created_by: user.id,
        } as never,
      ]);

      toast.success('Case updated successfully!');
      setOpen(false);
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update case';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 text-white hover:opacity-90" style={{ background: '#EF5A5A' }}>
          <Edit className="h-4 w-4" />
          Edit Case
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Case Details</DialogTitle>
          <DialogDescription>Update case information and status</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Case Title *</Label>
            <Input
              id="title"
              placeholder="Brief descriptive title of the case"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Detailed description of the case..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="case_type">Case Type *</Label>
              <Select value={formData.case_type} onValueChange={(value) => setFormData({ ...formData, case_type: value })}>
                <SelectTrigger id="case_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dispute">Land Dispute</SelectItem>
                  <SelectItem value="acquisition">Land Acquisition</SelectItem>
                  <SelectItem value="lease">Lease Agreement</SelectItem>
                  <SelectItem value="survey">Survey Matter</SelectItem>
                  <SelectItem value="title">Title Issue</SelectItem>
                  <SelectItem value="boundary">Boundary Dispute</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="in_court">In Court</SelectItem>
                  <SelectItem value="mediation">Mediation</SelectItem>
                  <SelectItem value="tribunal">Tribunal</SelectItem>
                  <SelectItem value="judgment">Judgment</SelectItem>
                  <SelectItem value="settled">Settled</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                <SelectTrigger id="region">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="National Capital District">National Capital District</SelectItem>
                  <SelectItem value="Central Province">Central Province</SelectItem>
                  <SelectItem value="Western Province">Western Province</SelectItem>
                  <SelectItem value="Gulf Province">Gulf Province</SelectItem>
                  <SelectItem value="Milne Bay Province">Milne Bay Province</SelectItem>
                  <SelectItem value="Oro Province">Oro Province</SelectItem>
                  <SelectItem value="Southern Highlands Province">Southern Highlands Province</SelectItem>
                  <SelectItem value="Hela Province">Hela Province</SelectItem>
                  <SelectItem value="Western Highlands Province">Western Highlands Province</SelectItem>
                  <SelectItem value="Enga Province">Enga Province</SelectItem>
                  <SelectItem value="Chimbu Province">Chimbu Province</SelectItem>
                  <SelectItem value="Eastern Highlands Province">Eastern Highlands Province</SelectItem>
                  <SelectItem value="Morobe Province">Morobe Province</SelectItem>
                  <SelectItem value="Madang Province">Madang Province</SelectItem>
                  <SelectItem value="East Sepik Province">East Sepik Province</SelectItem>
                  <SelectItem value="Sandaun Province">Sandaun Province</SelectItem>
                  <SelectItem value="Manus Province">Manus Province</SelectItem>
                  <SelectItem value="New Ireland Province">New Ireland Province</SelectItem>
                  <SelectItem value="East New Britain Province">East New Britain Province</SelectItem>
                  <SelectItem value="West New Britain Province">West New Britain Province</SelectItem>
                  <SelectItem value="Bougainville">Bougainville</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
