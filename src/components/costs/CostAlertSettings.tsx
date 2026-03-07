'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Bell, Settings, AlertTriangle, Loader2, Check, Mail, Plus, Trash2 } from 'lucide-react';

interface CostAlert {
  id: string;
  alert_type: 'case_threshold' | 'category_threshold' | 'monthly_threshold' | 'outstanding_threshold';
  threshold_amount: number;
  notify_email: boolean;
  notify_in_app: boolean;
  recipient_role: string;
  is_active: boolean;
  created_at: string;
}

interface CostAlertSettingsProps {
  caseId?: string;
  onAlertChange?: () => void;
}

const ALERT_TYPES = [
  { value: 'case_threshold', label: 'Case Cost Threshold', description: 'Alert when total case costs exceed amount' },
  { value: 'category_threshold', label: 'Category Threshold', description: 'Alert when a cost category exceeds amount' },
  { value: 'monthly_threshold', label: 'Monthly Threshold', description: 'Alert when monthly costs exceed amount' },
  { value: 'outstanding_threshold', label: 'Outstanding Threshold', description: 'Alert when outstanding payments exceed amount' },
];

const RECIPIENT_ROLES = [
  { value: 'case_officer', label: 'Case Officer' },
  { value: 'senior_legal_officer', label: 'Senior Legal Officer' },
  { value: 'legal_director', label: 'Legal Director' },
  { value: 'finance_officer', label: 'Finance Officer' },
  { value: 'all', label: 'All Staff' },
];

export function CostAlertSettings({ caseId, onAlertChange }: CostAlertSettingsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alerts, setAlerts] = useState<CostAlert[]>([]);

  // New alert form
  const [newAlert, setNewAlert] = useState({
    alert_type: 'case_threshold' as const,
    threshold_amount: 100000,
    notify_email: true,
    notify_in_app: true,
    recipient_role: 'senior_legal_officer',
  });

  useEffect(() => {
    if (open) {
      loadAlerts();
    }
  }, [open]);

  async function loadAlerts() {
    setLoading(true);
    try {
      let query = (supabase as any)
        .from('cost_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (caseId) {
        query = query.eq('case_id', caseId);
      }

      const { data, error } = await query;

      if (error) {
        // Table might not exist yet
        console.log('Cost alerts table may not exist:', error);
        setAlerts([]);
      } else {
        setAlerts(data || []);
      }
    } catch (err) {
      console.error('Error loading alerts:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAlert() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await (supabase as any)
        .from('cost_alerts')
        .insert({
          case_id: caseId || null,
          alert_type: newAlert.alert_type,
          threshold_amount: newAlert.threshold_amount,
          notify_email: newAlert.notify_email,
          notify_in_app: newAlert.notify_in_app,
          recipient_role: newAlert.recipient_role,
          is_active: true,
          created_by: user?.id,
        });

      if (error) throw error;

      toast.success('Alert created successfully');
      loadAlerts();
      onAlertChange?.();

      // Reset form
      setNewAlert({
        alert_type: 'case_threshold',
        threshold_amount: 100000,
        notify_email: true,
        notify_in_app: true,
        recipient_role: 'senior_legal_officer',
      });
    } catch (err) {
      console.error('Error creating alert:', err);
      toast.error('Failed to create alert. The cost_alerts table may not exist.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleAlert(alertId: string, isActive: boolean) {
    try {
      const { error } = await (supabase as any)
        .from('cost_alerts')
        .update({ is_active: !isActive })
        .eq('id', alertId);

      if (error) throw error;
      loadAlerts();
    } catch (err) {
      console.error('Error toggling alert:', err);
      toast.error('Failed to update alert');
    }
  }

  async function deleteAlert(alertId: string) {
    if (!confirm('Delete this alert?')) return;

    try {
      const { error } = await (supabase as any)
        .from('cost_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;
      toast.success('Alert deleted');
      loadAlerts();
      onAlertChange?.();
    } catch (err) {
      console.error('Error deleting alert:', err);
      toast.error('Failed to delete alert');
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PG', {
      style: 'currency',
      currency: 'PGK',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Bell className="h-4 w-4" />
          Cost Alerts
          {alerts.filter(a => a.is_active).length > 0 && (
            <Badge className="bg-[#8B2332] text-white text-xs">
              {alerts.filter(a => a.is_active).length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#8B2332]" />
            Cost Threshold Alerts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Add New Alert */}
          <Card className="border-2 border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Alert
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Alert Type</Label>
                  <Select
                    value={newAlert.alert_type}
                    onValueChange={(v) => setNewAlert(prev => ({ ...prev, alert_type: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALERT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Threshold Amount (PGK)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">K</span>
                    <Input
                      type="number"
                      value={newAlert.threshold_amount}
                      onChange={(e) => setNewAlert(prev => ({
                        ...prev,
                        threshold_amount: parseFloat(e.target.value) || 0
                      }))}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notify</Label>
                <Select
                  value={newAlert.recipient_role}
                  onValueChange={(v) => setNewAlert(prev => ({ ...prev, recipient_role: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECIPIENT_ROLES.map(r => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newAlert.notify_email}
                    onCheckedChange={(checked: boolean) => setNewAlert(prev => ({ ...prev, notify_email: checked }))}
                  />
                  <Label className="text-sm flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newAlert.notify_in_app}
                    onCheckedChange={(checked: boolean) => setNewAlert(prev => ({ ...prev, notify_in_app: checked }))}
                  />
                  <Label className="text-sm flex items-center gap-1">
                    <Bell className="h-4 w-4" />
                    In-App
                  </Label>
                </div>
              </div>

              <Button
                onClick={handleAddAlert}
                disabled={saving}
                className="w-full bg-[#8B2332] hover:bg-[#6B1A26]"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Alert
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Alerts */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-gray-700">Active Alerts</h3>

            {loading ? (
              <div className="text-center py-6">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
              </div>
            ) : alerts.length > 0 ? (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      alert.is_active ? 'bg-white' : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${alert.is_active ? 'bg-amber-100' : 'bg-gray-200'}`}>
                        <AlertTriangle className={`h-4 w-4 ${alert.is_active ? 'text-amber-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {ALERT_TYPES.find(t => t.value === alert.alert_type)?.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          Threshold: {formatCurrency(alert.threshold_amount)} •
                          {' '}{RECIPIENT_ROLES.find(r => r.value === alert.recipient_role)?.label}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        {alert.notify_email && <Mail className="h-3 w-3" />}
                        {alert.notify_in_app && <Bell className="h-3 w-3" />}
                      </div>
                      <Switch
                        checked={alert.is_active}
                        onCheckedChange={() => toggleAlert(alert.id, alert.is_active)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAlert(alert.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No alerts configured</p>
                <p className="text-xs">Create an alert to get notified when costs exceed thresholds</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium flex items-center gap-1 mb-1">
              <Settings className="h-4 w-4" />
              How alerts work
            </p>
            <ul className="text-xs space-y-1 ml-5 list-disc">
              <li>Alerts are checked when new costs are added</li>
              <li>Email notifications require SMTP configuration</li>
              <li>In-app notifications appear in the dashboard</li>
              <li>Alerts can be configured per case or globally</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
