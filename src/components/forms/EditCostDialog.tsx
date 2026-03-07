'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Edit, Loader2, Save } from 'lucide-react';
import {
  LitigationCost,
  CostCategory,
  PAYMENT_STATUS_OPTIONS,
  RESPONSIBLE_UNITS,
  RESPONSIBLE_AUTHORITIES,
} from '@/types/litigation-costs';

interface EditCostDialogProps {
  cost: LitigationCost;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCostUpdated?: () => void;
}

export function EditCostDialog({ cost, open, onOpenChange, onCostUpdated }: EditCostDialogProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CostCategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category_id: cost.category_id || '',
    cost_type: cost.cost_type,
    amount: cost.amount,
    currency: cost.currency,
    date_incurred: cost.date_incurred.split('T')[0],
    date_paid: cost.date_paid?.split('T')[0] || '',
    payment_status: cost.payment_status,
    amount_paid: cost.amount_paid,
    responsible_unit: cost.responsible_unit || '',
    responsible_authority: cost.responsible_authority || '',
    description: cost.description || '',
    reference_number: cost.reference_number || '',
    payee_name: cost.payee_name || '',
    payee_type: cost.payee_type || '',
  });

  // Reset form when cost changes
  useEffect(() => {
    setFormData({
      category_id: cost.category_id || '',
      cost_type: cost.cost_type,
      amount: cost.amount,
      currency: cost.currency,
      date_incurred: cost.date_incurred.split('T')[0],
      date_paid: cost.date_paid?.split('T')[0] || '',
      payment_status: cost.payment_status,
      amount_paid: cost.amount_paid,
      responsible_unit: cost.responsible_unit || '',
      responsible_authority: cost.responsible_authority || '',
      description: cost.description || '',
      reference_number: cost.reference_number || '',
      payee_name: cost.payee_name || '',
      payee_type: cost.payee_type || '',
    });
  }, [cost]);

  // Load cost categories
  useEffect(() => {
    async function loadCategories() {
      const { data, error } = await (supabase as any)
        .from('cost_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (data && !error) {
        setCategories(data);
      }
    }
    if (open) {
      loadCategories();
    }
  }, [open]);

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    setFormData(prev => ({
      ...prev,
      category_id: categoryId,
      cost_type: category?.name || prev.cost_type,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await (supabase as any)
        .from('litigation_costs')
        .update({
          category_id: formData.category_id || null,
          cost_type: formData.cost_type,
          amount: formData.amount,
          currency: formData.currency,
          date_incurred: formData.date_incurred,
          date_paid: formData.date_paid || null,
          payment_status: formData.payment_status,
          amount_paid: formData.amount_paid || 0,
          responsible_unit: formData.responsible_unit || null,
          responsible_authority: formData.responsible_authority || null,
          description: formData.description || null,
          reference_number: formData.reference_number || null,
          payee_name: formData.payee_name || null,
          payee_type: formData.payee_type || null,
          updated_at: new Date().toISOString(),
          updated_by: user?.id || null,
        })
        .eq('id', cost.id);

      if (updateError) throw updateError;

      onOpenChange(false);
      onCostUpdated?.();
    } catch (err) {
      console.error('Error updating cost:', err);
      setError(err instanceof Error ? err.message : 'Failed to update cost entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-[#8B2332]" />
            Edit Cost Entry
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Cost Category and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Cost Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost_type">Cost Type *</Label>
              <Input
                id="cost_type"
                value={formData.cost_type}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_type: e.target.value }))}
                placeholder="e.g., External Legal Fees"
                required
              />
            </div>
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="amount">Amount *</Label>
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

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_incurred">Date Incurred *</Label>
              <Input
                id="date_incurred"
                type="date"
                value={formData.date_incurred}
                onChange={(e) => setFormData(prev => ({ ...prev, date_incurred: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_paid">Date Paid</Label>
              <Input
                id="date_paid"
                type="date"
                value={formData.date_paid}
                onChange={(e) => setFormData(prev => ({ ...prev, date_paid: e.target.value }))}
              />
            </div>
          </div>

          {/* Payment Status and Amount Paid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_status">Payment Status *</Label>
              <Select
                value={formData.payment_status}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  payment_status: value as 'paid' | 'unpaid' | 'partial' | 'waived' | 'disputed',
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

          {/* Payee Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payee_name">Payee Name</Label>
              <Input
                id="payee_name"
                value={formData.payee_name}
                onChange={(e) => setFormData(prev => ({ ...prev, payee_name: e.target.value }))}
                placeholder="e.g., Allens Linklaters"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payee_type">Payee Type</Label>
              <Select
                value={formData.payee_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, payee_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="law_firm">Law Firm</SelectItem>
                  <SelectItem value="court">Court</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reference Number */}
          <div className="space-y-2">
            <Label htmlFor="reference_number">Reference Number</Label>
            <Input
              id="reference_number"
              value={formData.reference_number}
              onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
              placeholder="Invoice/Receipt/Voucher number"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Details about this cost entry..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#8B2332] hover:bg-[#6B1A26]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
