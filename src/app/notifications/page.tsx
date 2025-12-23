'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Bell, Plus, Search, AlertCircle, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CaseSelector } from '@/components/forms/CaseSelector';

interface Notification {
  id: string;
  case_id: string;
  case_number: string;
  case_title: string;
  recipient_type: string;
  recipient_name: string;
  notification_method: string;
  notification_content: string;
  proof_of_communication: string | null;
  sent_at: string;
  sent_by: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    case_id: '',
    recipient_type: 'plaintiff',
    recipient_name: '',
    recipient_lawyer: '',
    notification_method: 'email',
    notification_content: '',
    notify_solicitor_general: false,
    proof_of_communication: '',
  });

  useEffect(() => {
    checkAuth();
    loadNotifications();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
  };

  const loadNotifications = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('communications')
        .select(`
          *,
          cases!inner(case_number, title)
        `)
        .eq('direction', 'outgoing')
        .order('communication_date', { ascending: false });

      if (error) throw error;

      const formatted = ((data as any) || []).map((n: any) => ({
        id: n.id,
        case_id: n.case_id,
        case_number: n.cases?.case_number || '',
        case_title: n.cases?.title || '',
        recipient_type: n.recipient_type,
        recipient_name: n.recipient_name,
        notification_method: n.notification_method,
        notification_content: n.notification_content,
        proof_of_communication: n.proof_of_communication,
        sent_at: n.sent_at,
        sent_by: n.sent_by,
      }));

      setNotifications(formatted);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('communications')
        .insert([{
          case_id: formData.case_id,
          communication_type: formData.notification_method,
          direction: 'outgoing',
          party_type: formData.recipient_type,
          party_name: formData.recipient_name,
          subject: 'Court Decision Notification',
          content: formData.notification_content,
          communication_date: new Date().toISOString(),
          handled_by: user.id,
          response_required: false,
          response_status: 'no_response_needed',
          attachments: formData.proof_of_communication ? { proof: formData.proof_of_communication } : null,
        }]);

      if (error) throw error;

      toast.success('Notification sent successfully!');
      setShowForm(false);
      setFormData({
        case_id: '',
        recipient_type: 'plaintiff',
        recipient_name: '',
        recipient_lawyer: '',
        notification_method: 'email',
        notification_content: '',
        notify_solicitor_general: false,
        proof_of_communication: '',
      });
      loadNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const getRecipientBadge = (type: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      plaintiff: { label: 'Plaintiff', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      defendant: { label: 'Defendant', color: 'bg-purple-100 text-purple-800 border-purple-300' },
      solicitor_general: { label: 'Solicitor General', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
      state_legal: { label: 'State Legal Office', color: 'bg-orange-100 text-orange-800 border-orange-300' },
      other: { label: 'Other Party', color: 'bg-gray-100 text-gray-800 border-gray-300' },
    };
    const badge = badges[type] || badges.other;
    return <Badge className={`${badge.color} border`}>{badge.label}</Badge>;
  };

  const filteredNotifications = notifications.filter(n =>
    n.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.case_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.recipient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardNav />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Step 7: Notifications to Parties</h1>
              <p className="text-slate-600 mt-1">Advise parties of court decisions after case closure</p>
            </div>
          </div>

          <Button
            onClick={() => setShowForm(!showForm)}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Send Notification
          </Button>
        </div>

        {/* Info Card */}
        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-indigo-900 mb-2">How This Module Works</h3>
                <ul className="text-sm text-indigo-800 space-y-1.5">
                  <li>• <strong>After Case Closure:</strong> Use this module after a case is formally closed in Step 6</li>
                  <li>• <strong>Notify All Parties:</strong> Advise plaintiff, defendant(s), their lawyers of the court's decision</li>
                  <li>• <strong>Notify Legal Offices:</strong> Inform Solicitor General and State Legal Office of the outcome</li>
                  <li>• <strong>Record Proof:</strong> Document proof of communication for each notification sent</li>
                  <li>• <strong>Complete Workflow:</strong> This is the final step - case workflow is complete after notifications</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Send Notification Form */}
        {showForm && (
          <Card className="border-2 border-indigo-300">
            <CardHeader>
              <CardTitle>Send Notification</CardTitle>
              <CardDescription>
                Notify parties of court decision and case outcome
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <CaseSelector
                    value={formData.case_id}
                    onValueChange={(value) => setFormData({ ...formData, case_id: value })}
                    label="Case ID"
                    placeholder="Search and select closed case..."
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Must be a closed case from Step 6</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="recipient_type">Recipient Type *</Label>
                    <Select
                      value={formData.recipient_type}
                      onValueChange={(value) => setFormData({ ...formData, recipient_type: value })}
                    >
                      <SelectTrigger id="recipient_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plaintiff">Plaintiff</SelectItem>
                        <SelectItem value="defendant">Defendant</SelectItem>
                        <SelectItem value="solicitor_general">Solicitor General</SelectItem>
                        <SelectItem value="state_legal">State Legal Office</SelectItem>
                        <SelectItem value="other">Other Party</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notification_method">Notification Method *</Label>
                    <Select
                      value={formData.notification_method}
                      onValueChange={(value) => setFormData({ ...formData, notification_method: value })}
                    >
                      <SelectTrigger id="notification_method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="letter">Formal Letter</SelectItem>
                        <SelectItem value="courier">Courier Service</SelectItem>
                        <SelectItem value="in_person">In Person</SelectItem>
                        <SelectItem value="registered_mail">Registered Mail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="recipient_name">Recipient Name *</Label>
                    <Input
                      id="recipient_name"
                      placeholder="Party or organization name..."
                      value={formData.recipient_name}
                      onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipient_lawyer">Recipient's Lawyer (if applicable)</Label>
                    <Input
                      id="recipient_lawyer"
                      placeholder="Lawyer name or firm..."
                      value={formData.recipient_lawyer}
                      onChange={(e) => setFormData({ ...formData, recipient_lawyer: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notification_content">Notification Content *</Label>
                  <Textarea
                    id="notification_content"
                    placeholder="Content of the notification to be sent..."
                    value={formData.notification_content}
                    onChange={(e) => setFormData({ ...formData, notification_content: e.target.value })}
                    required
                    rows={8}
                  />
                  <p className="text-xs text-slate-500">
                    Include: Court decision, case outcome, judgment details, and any required actions
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proof_of_communication">Proof of Communication</Label>
                  <Textarea
                    id="proof_of_communication"
                    placeholder="Details of proof of communication (e.g., tracking number, receipt, acknowledgment)..."
                    value={formData.proof_of_communication}
                    onChange={(e) => setFormData({ ...formData, proof_of_communication: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2 p-4 bg-slate-50 rounded-lg border">
                  <Checkbox
                    id="notify_solicitor_general"
                    checked={formData.notify_solicitor_general}
                    onCheckedChange={(checked: boolean) =>
                      setFormData({ ...formData, notify_solicitor_general: checked })
                    }
                  />
                  <Label
                    htmlFor="notify_solicitor_general"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Also notify Solicitor General / State Legal Office
                  </Label>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-emerald-900 mb-1">Workflow Complete</h4>
                      <p className="text-sm text-emerald-800">
                        After all parties are notified, the case workflow is complete. The case remains closed and archived under its Case ID.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Notification
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search notifications by case number, title, or recipient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-slate-500">Loading notifications...</div>
              </CardContent>
            </Card>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No notifications found</h3>
                <p className="text-slate-600 mb-6">
                  {notifications.length === 0
                    ? 'Sent notifications will appear here'
                    : 'Try adjusting your search criteria'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card key={notification.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {notification.case_number} - {notification.case_title}
                        </h3>
                        {getRecipientBadge(notification.recipient_type)}
                      </div>
                      <p className="text-sm text-slate-600">
                        Sent to: <span className="font-medium">{notification.recipient_name}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Method: {notification.notification_method} • Sent: {format(new Date(notification.sent_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-1">Notification Content:</h4>
                      <p className="text-sm text-slate-600">{notification.notification_content}</p>
                    </div>
                    {notification.proof_of_communication && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-1">Proof of Communication:</h4>
                        <p className="text-sm text-slate-600">{notification.proof_of_communication}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {filteredNotifications.length > 0 && (
          <p className="text-sm text-slate-600 text-center">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </p>
        )}
      </div>
    </div>
  );
}
