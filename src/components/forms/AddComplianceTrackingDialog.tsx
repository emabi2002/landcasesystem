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

interface AddComplianceTrackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddComplianceTrackingDialog({ open, onOpenChange, onSuccess }: AddComplianceTrackingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState<{ id: string; case_number: string; title: string }[]>([]);
  const [formData, setFormData] = useState({
    case_id: '',
    court_order_reference: '',
    court_order_date: '',
    court_order_description: '',
    compliance_deadline: '',
    responsible_division: 'survey_division',
    memo_reference: '',
    compliance_notes: '',
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

      const { error } = await supabase.from('compliance_tracking').insert([
        {
          ...formData,
          court_order_date: formData.court_order_date || null,
          compliance_deadline: formData.compliance_deadline || null,
          compliance_status: 'pending',
        } as never,
      ]);

      if (error) throw error;

      toast.success('Compliance order added successfully!');
      onSuccess();
      setFormData({
        case_id: '',
        court_order_reference: '',
        court_order_date: '',
        court_order_description: '',
        compliance_deadline: '',
        responsible_division: 'survey_division',
        memo_reference: '',
        compliance_notes: '',
      });
    } catch (error) {
      console.error('Error adding compliance order:', error);
      toast.error('Failed to add compliance order');
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
          <DialogTitle>Add Court Order Compliance</DialogTitle>
          <DialogDescription>
            Track compliance with a court order across divisions
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
              <Label htmlFor="court_order_reference">Court Order Reference</Label>
              <Input
                id="court_order_reference"
                value={formData.court_order_reference}
                onChange={(e) => handleChange('court_order_reference', e.target.value)}
                placeholder="e.g., CO-2025-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="court_order_date">Order Date</Label>
              <Input
                id="court_order_date"
                type="date"
                value={formData.court_order_date}
                onChange={(e) => handleChange('court_order_date', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="court_order_description">Court Order Description *</Label>
            <Textarea
              id="court_order_description"
              value={formData.court_order_description}
              onChange={(e) => handleChange('court_order_description', e.target.value)}
              placeholder="Describe what the court has ordered"
              rows={4}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="responsible_division">Responsible Division *</Label>
              <Select value={formData.responsible_division} onValueChange={(value) => handleChange('responsible_division', value)}>
                <SelectTrigger id="responsible_division">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="survey_division">Survey Division</SelectItem>
                  <SelectItem value="registrar_for_titles">Registrar for Titles</SelectItem>
                  <SelectItem value="alienated_lands_division">Alienated Lands Division</SelectItem>
                  <SelectItem value="valuation_division">Valuation Division</SelectItem>
                  <SelectItem value="physical_planning_division">Physical Planning Division</SelectItem>
                  <SelectItem value="ilg_division">ILG Division</SelectItem>
                  <SelectItem value="customary_leases_division">Customary Leases Division</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="compliance_deadline">Compliance Deadline</Label>
              <Input
                id="compliance_deadline"
                type="date"
                value={formData.compliance_deadline}
                onChange={(e) => handleChange('compliance_deadline', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo_reference">Memo Reference</Label>
            <Input
              id="memo_reference"
              value={formData.memo_reference}
              onChange={(e) => handleChange('memo_reference', e.target.value)}
              placeholder="Reference number of memo sent to division"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="compliance_notes">Notes</Label>
            <Textarea
              id="compliance_notes"
              value={formData.compliance_notes}
              onChange={(e) => handleChange('compliance_notes', e.target.value)}
              placeholder="Additional notes"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} style={{ background: '#EF5A5A' }}>
              {loading ? 'Adding...' : 'Add Compliance Order'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
