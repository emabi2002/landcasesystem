'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  PAYMENT_STATUS_OPTIONS,
  RESPONSIBLE_UNITS,
  RESPONSIBLE_AUTHORITIES,
} from '@/types/litigation-costs';

interface RecordPenaltyDialogProps {
  caseId: string;
  onPenaltyAdded?: () => void;
  trigger?: React.ReactNode;
}

const PENALTY_TYPES = [
  'Court-Ordered Penalty',
  'Regulatory Fine',
  'Contempt of Court',
  'Late Filing Penalty',
  'Non-Compliance Penalty',
  'Environmental Penalty',
  'Land Use Violation',
  'Encroachment Penalty',
  'Other Penalty',
];

export function RecordPenaltyDialog({ caseId, onPenaltyAdded, trigger }: RecordPenaltyDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    penalty_type: '',
    amount: 0,
    currency: 'PGK',
    date_incurred: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_status: 'unpaid',
    amount_paid: 0,
    responsible_unit: '',
    responsible_authority: '',
    imposed_by: '',
    case_reference: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Find or use penalty category
      const { data: penaltyCategory } = await (supabase as any)
        .from('cost_categories')
        .select('id')
        .eq('code', 'PEN')
        .single();

      const { error: insertError } = await (supabase as any)
        .from('litigation_costs')
        .insert({
          case_id: caseId,
          category_id: penaltyCategory?.id || null,
          cost_type: formData.penalty_type,
          amount: formData.amount,
          currency: formData.currency,
          date_incurred: formData.date_incurred,
          payment_status: formData.payment_status,
          amount_paid: formData.amount_paid || 0,
          responsible_unit: formData.responsible_unit || null,
          responsible_authority: formData.responsible_authority || null,
          description: `${formData.penalty_type}\n\nImposed By: ${formData.imposed_by || 'N/A'}\nCase Reference: ${formData.case_reference || 'N/A'}\nDue Date: ${formData.due_date || 'N/A'}\n\n${formData.description}`,
          reference_number: formData.case_reference || null,
          payee_name: formData.imposed_by || null,
          payee_type: 'court',
          created_by: user?.id || null,
        });

      if (insertError) throw insertError;

      // Reset form
      setFormData({
        penalty_type: '',
        amount: 0,
        currency: 'PGK',
        date_incurred: new Date().toISOString().split('T')[0],
        due_date: '',
        payment_status: 'unpaid',
        amount_paid: 0,
        responsible_unit: '',
        responsible_authority: '',
        imposed_by: '',
        case_reference: '',
        description: '',
      });

      setOpen(false);
      onPenaltyAdded?.();
    } catch (err) {
      console.error('Error adding penalty:', err);
      setError(err instanceof Error ? err.message : 'Failed to record penalty');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Record Penalty
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Record Penalty / Fine
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Penalty Type */}
          <div className="space-y-2">
            <Label htmlFor="penalty_type">Penalty Type *</Label>
            <Select
              value={formData.penalty_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, penalty_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select penalty type" />
              </SelectTrigger>
              <SelectContent>
                {PENALTY_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="amount">Penalty Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">K</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="pl-8"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PGK">PGK</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Imposed By and Case Reference */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="imposed_by">Imposed By *</Label>
              <Input
                id="imposed_by"
                value={formData.imposed_by}
                onChange={(e) => setFormData(prev => ({ ...prev, imposed_by: e.target.value }))}
                placeholder="e.g., National Court, Land Board"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="case_reference">Court/Case Reference</Label>
              <Input
                id="case_reference"
                value={formData.case_reference}
                onChange={(e) => setFormData(prev => ({ ...prev, case_reference: e.target.value }))}
                placeholder="e.g., WS 123/2024"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_incurred">Date Imposed *</Label>
              <Input
                id="date_incurred"
                type="date"
                value={formData.date_incurred}
                onChange={(e) => setFormData(prev => ({ ...prev, date_incurred: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Payment Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Payment Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_status">Payment Status *</Label>
              <Select
                value={formData.payment_status}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  payment_status: value,
                  amount_paid: value === 'paid' ? formData.amount : (value === 'unpaid' ? 0 : formData.amount_paid)
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUS_OPTIONS.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount_paid">Amount Paid</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">K</span>
                <Input
                  id="amount_paid"
                  type="number"
                  step="0.01"
                  min="0"
                  max={formData.amount}
                  value={formData.amount_paid}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount_paid: parseFloat(e.target.value) || 0 }))}
                  className="pl-8"
                  placeholder="0.00"
                  disabled={formData.payment_status === 'paid' || formData.payment_status === 'unpaid'}
                />
              </div>
            </div>
          </div>

          {/* Responsibility */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsible_unit">Responsible Unit</Label>
              <Select
                value={formData.responsible_unit}
                onValueChange={(value) => setFormData(prev => ({ ...prev, responsible_unit: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {RESPONSIBLE_UNITS.map(unit => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible_authority">Responsible Authority</Label>
              <Select
                value={formData.responsible_authority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, responsible_authority: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select authority" />
                </SelectTrigger>
                <SelectContent>
                  {RESPONSIBLE_AUTHORITIES.map(auth => (
                    <SelectItem key={auth} value={auth}>
                      {auth}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Additional Notes</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Reason for penalty, court order details, etc..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Record Penalty
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
