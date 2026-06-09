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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Bell, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface AlertDialogProps {
  caseId: string;
  currentStep: string;
  triggerButton?: React.ReactNode;
}

export function AlertDialog({ caseId, currentStep, triggerButton }: AlertDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    alert_to: 'manager' as 'manager' | 'secretary' | 'director',
    alert_type: 'advice' as 'advice' | 'direction' | 'commentary',
    priority: 'normal' as 'normal' | 'urgent',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get case details for context
      const { data: caseData } = await (supabase as any)
        .from('cases')
        .select('case_number, title')
        .eq('id', caseId)
        .single();

      const recipientName = formData.alert_to === 'manager' 
        ? 'Legal Manager' 
        : formData.alert_to === 'secretary'
        ? 'Secretary'
        : 'Director of Legal Services';

      // Create alert in communications table
      const { error } = await (supabase as any)
        .from('communications')
        .insert([{
          case_id: caseId,
          communication_type: 'alert',
          direction: 'internal',
          party_type: formData.alert_to,
          party_name: recipientName,
          subject: `${formData.alert_type.toUpperCase()} REQUIRED - ${currentStep} (${formData.priority === 'urgent' ? 'URGENT' : 'Normal'})`,
          content: `Case: ${caseData?.case_number || caseId}\nTitle: ${caseData?.title || 'N/A'}\n\nWorkflow Step: ${currentStep}\nAlert Type: ${formData.alert_type}\nPriority: ${formData.priority}\n\n${formData.message}`,
          communication_date: new Date().toISOString(),
          handled_by: user.id,
          response_required: true,
          response_status: 'pending',
          priority: formData.priority,
          attachments: {
            workflow_step: currentStep,
            alert_type: formData.alert_type,
            alert_to: formData.alert_to,
          },
        }]);

      if (error) throw error;

      toast.success(`Alert sent to ${recipientName}!`, {
        description: formData.priority === 'urgent' ? 'Marked as URGENT' : 'Marked as Normal priority',
      });
      
      setOpen(false);
      setFormData({
        alert_to: 'manager',
        alert_type: 'advice',
        priority: 'normal',
        message: '',
      });
    } catch (error) {
      console.error('Error sending alert:', error);
      toast.error('Failed to send alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50">
            <AlertTriangle className="h-4 w-4" />
            Send Alert
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-600" />
            Send Alert for Advice/Direction
          </DialogTitle>
          <DialogDescription>
            Request commentary, advice, or direction from senior staff on this case at the current workflow stage
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="alert_to">Send Alert To *</Label>
              <Select
                value={formData.alert_to}
                onValueChange={(value: 'manager' | 'secretary' | 'director') =>
                  setFormData({ ...formData, alert_to: value })
                }
              >
                <SelectTrigger id="alert_to">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Legal Manager</SelectItem>
                  <SelectItem value="secretary">Secretary</SelectItem>
                  <SelectItem value="director">Director of Legal Services</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">Select who should receive this alert</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert_type">Request Type *</Label>
              <Select
                value={formData.alert_type}
                onValueChange={(value: 'advice' | 'direction' | 'commentary') =>
                  setFormData({ ...formData, alert_type: value })
                }
              >
                <SelectTrigger id="alert_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advice">Legal Advice</SelectItem>
                  <SelectItem value="direction">Direction Required</SelectItem>
                  <SelectItem value="commentary">Commentary Needed</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">What type of input do you need?</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level *</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: 'normal' | 'urgent') =>
                setFormData({ ...formData, priority: value })
              }
            >
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="urgent">⚠️ Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message / Reason for Alert *</Label>
            <Textarea
              id="message"
              placeholder="Explain why you need advice/direction and provide any relevant context..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-slate-500">
              Current workflow step: <strong>{currentStep}</strong>
            </p>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-orange-900 mb-1">Alert Information</h4>
                <p className="text-sm text-orange-800">
                  This alert will be sent to the{' '}
                  <strong>
                    {formData.alert_to === 'manager' 
                      ? 'Legal Manager' 
                      : formData.alert_to === 'secretary'
                      ? 'Secretary'
                      : 'Director of Legal Services'}
                  </strong>{' '}
                  requesting{' '}
                  <strong>{formData.alert_type}</strong>
                  {formData.priority === 'urgent' && (
                    <span className="text-red-600 font-bold"> (URGENT)</span>
                  )}
                  . They will be notified and can respond via the case dashboard.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Bell className="h-4 w-4 mr-2" />
              {loading ? 'Sending Alert...' : 'Send Alert'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
