'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SelectWithAdd } from '@/components/ui/select-with-add';
import { Plus, Gavel, Upload } from 'lucide-react';

interface AddCourtOrderDialogProps {
  caseId: string;
  caseNumber?: string;
  onSuccess?: () => void;
}

export function AddCourtOrderDialog({ caseId, caseNumber, onSuccess }: AddCourtOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    court_reference: '',
    order_date: '',
    order_type: '',
    judge_name: '',
    parties_to_proceeding: '',
    terms: '',
    conclusion_grounds: '',
    outcome: '',
    compliance_required: false,
    compliance_deadline: '',
    compliance_notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.court_reference || !formData.order_date || !formData.terms) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert court order
      const { error: orderError } = await (supabase as any)
        .from('court_orders')
        .insert({
          case_id: caseId,
          court_reference: formData.court_reference,
          order_date: formData.order_date,
          order_type: formData.order_type || 'judgment',
          judge_name: formData.judge_name || null,
          parties_to_proceeding: formData.parties_to_proceeding || null,
          terms: formData.terms,
          conclusion_grounds: formData.conclusion_grounds || null,
          outcome: formData.outcome || null,
          uploaded_by: user.id,
        });

      if (orderError) {
        // Check if the error is due to missing table
        if (orderError.code === '42P01') {
          toast.error('Court orders table not found. Please run the database migration scripts.');
          return;
        }
        throw orderError;
      }

      // Update case status to judgment
      await (supabase as any)
        .from('cases')
        .update({
          status: 'judgment',
          updated_at: new Date().toISOString()
        })
        .eq('id', caseId);

      // Add to case history
      await (supabase as any)
        .from('case_history')
        .insert({
          case_id: caseId,
          action: 'Court Order Registered',
          description: `Court order ${formData.court_reference} dated ${formData.order_date} - ${formData.order_type}`,
          performed_by: user.id,
        });

      toast.success('Court order registered successfully!');
      setOpen(false);
      setFormData({
        court_reference: '',
        order_date: '',
        order_type: '',
        judge_name: '',
        parties_to_proceeding: '',
        terms: '',
        conclusion_grounds: '',
        outcome: '',
        compliance_required: false,
        compliance_deadline: '',
        compliance_notes: '',
      });
      onSuccess?.();
    } catch (error) {
      console.error('Error registering court order:', error);
      toast.error('Failed to register court order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4" />
          Register Court Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Register Court Order
          </DialogTitle>
          <DialogDescription>
            Record the court's judgment or order for {caseNumber || 'this case'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Court Reference & Date */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="court_reference">Court Reference Number *</Label>
              <Input
                id="court_reference"
                placeholder="e.g., WS 123/2025"
                value={formData.court_reference}
                onChange={(e) => setFormData({ ...formData, court_reference: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order_date">Order Date *</Label>
              <Input
                id="order_date"
                type="date"
                value={formData.order_date}
                onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Order Type & Judge */}
          <div className="grid gap-4 md:grid-cols-2">
            <SelectWithAdd
              value={formData.order_type}
              onValueChange={(value) => setFormData({ ...formData, order_type: value })}
              tableName="order_types"
              label="Order Type"
              placeholder="Select order type"
              required
            />
            <div className="space-y-2">
              <Label htmlFor="judge_name">Judge/Magistrate Name</Label>
              <Input
                id="judge_name"
                placeholder="Hon. Justice..."
                value={formData.judge_name}
                onChange={(e) => setFormData({ ...formData, judge_name: e.target.value })}
              />
            </div>
          </div>

          {/* Parties */}
          <div className="space-y-2">
            <Label htmlFor="parties_to_proceeding">Parties to Proceeding</Label>
            <Textarea
              id="parties_to_proceeding"
              placeholder="List all parties involved in this order..."
              value={formData.parties_to_proceeding}
              onChange={(e) => setFormData({ ...formData, parties_to_proceeding: e.target.value })}
              rows={2}
            />
          </div>

          {/* Terms */}
          <div className="space-y-2">
            <Label htmlFor="terms">Terms of Order *</Label>
            <Textarea
              id="terms"
              placeholder="Enter the full terms and conditions of the court order..."
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              rows={5}
              required
            />
          </div>

          {/* Grounds for Conclusion */}
          <div className="space-y-2">
            <Label htmlFor="conclusion_grounds">Grounds for Conclusion</Label>
            <Textarea
              id="conclusion_grounds"
              placeholder="Legal reasoning and grounds for the court's decision..."
              value={formData.conclusion_grounds}
              onChange={(e) => setFormData({ ...formData, conclusion_grounds: e.target.value })}
              rows={3}
            />
          </div>

          {/* Outcome */}
          <div className="space-y-2">
            <Label htmlFor="outcome">Outcome Summary</Label>
            <Select
              value={formData.outcome}
              onValueChange={(value) => setFormData({ ...formData, outcome: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_favor_dlpp">In Favor of DLPP</SelectItem>
                <SelectItem value="against_dlpp">Against DLPP</SelectItem>
                <SelectItem value="partial_dlpp">Partial - Mixed Result</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
                <SelectItem value="pending_compliance">Pending Compliance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Document Upload
            </h4>
            <p className="text-sm text-amber-800">
              After registering the court order, you can upload the signed order document
              from the Documents tab.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {loading ? 'Registering...' : 'Register Court Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
