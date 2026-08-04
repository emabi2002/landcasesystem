'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/permissions';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AddPartyDialog } from '@/components/forms/AddPartyDialog';
import { AddDocumentDialog } from '@/components/forms/AddDocumentDialog';
import { AddTaskDialog } from '@/components/forms/AddTaskDialog';
import { AddEventDialog } from '@/components/forms/AddEventDialog';
import { AddLandParcelDialog } from '@/components/forms/AddLandParcelDialog';
import { EditCaseDialog } from '@/components/forms/EditCaseDialog';
import { EditPartyDialog } from '@/components/forms/EditPartyDialog';
import { EditDocumentDialog } from '@/components/forms/EditDocumentDialog';
import { EditTaskDialog } from '@/components/forms/EditTaskDialog';
import { EditEventDialog } from '@/components/forms/EditEventDialog';
import { EditLandParcelDialog } from '@/components/forms/EditLandParcelDialog';
import { LinkedRecommendations } from '@/components/compliance/LinkedRecommendations';
import { CostSummaryCard } from '@/components/costs/CostSummaryCard';
import { CostList } from '@/components/costs/CostList';
import { AddCostDialog } from '@/components/forms/AddCostDialog';
import { RecordPenaltyDialog } from '@/components/forms/RecordPenaltyDialog';
import { AddCourtOrderDialog } from '@/components/forms/AddCourtOrderDialog';
import { CaseClosureDialog } from '@/components/forms/CaseClosureDialog';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Users,
  MapPin,
  Calendar,
  CheckSquare,
  History,
  Upload,
  Plus,
  Edit2,
  Bell,
  Send,
  DollarSign,
  Gavel,
  Archive,
  Scale,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { WorkflowStepper, getWorkflowStepsFromStatus } from '@/components/dashboard/WorkflowStepper';
import { CaseTimeline } from '@/components/cases/CaseTimeline';
import { CaseSearchWarrants } from '@/components/search-warrants';
import { CaseSection5Notices } from '@/components/section5-notices';
import { CaseSection160 } from '@/components/section-160';

/* ---------- Types (so nothing is `unknown`) ---------- */
interface CaseData {
  id: string;
  case_number: string;
  title: string | null;
  description?: string | null;
  status: string;
  case_type: string;
  priority: string;
  region?: string | null;
  created_at: string;
  assigned_officer_id?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  updated_at?: string | null;
  closure_type?: string | null;
  closure_date?: string | null;
  closure_notes?: string | null;
  workflow_state?: string | null;
}

interface Party {
  id: string;
  case_id: string;
  name: string;
  party_type: string;
  role: string;
  contact_info: Record<string, unknown> | null;
}

interface DocumentItem {
  id: string;
  case_id: string;
  title: string;
  description?: string | null;
  uploaded_at: string;
  file_type?: string | null;
  file_path?: string | null;
}

interface TaskItem {
  id: string;
  case_id: string;
  title: string;
  description?: string | null;
  due_date: string;
  status: string;
  assigned_to?: string | null;
  priority?: string | null;
}

interface EventItem {
  id: string;
  case_id: string;
  title: string;
  description?: string | null;
  event_date: string;
  location?: string | null;
  event_type?: string | null;
}

interface Parcel {
  id: string;
  case_id: string;
  parcel_number: string;
  location?: string | null;
  notes?: string | null;
  area?: number | null;
  coordinates?: Record<string, unknown> | null;
}

interface HistoryItem {
  id: string;
  case_id: string;
  action: string;
  description?: string | null;
  created_at: string;
  activity_type?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  old_value?: unknown;
  new_value?: unknown;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  changed_fields?: string[] | null;
  performed_by?: string | null;
  created_by?: string | null;
  source_module?: string | null;
  reason?: string | null;
}

interface Alert {
  id: string;
  case_id: string;
  workflow_step: string;
  recipient_role: string;
  priority: string;
  subject: string;
  message: string;
  response_status: string;
  response?: string | null;
  responded_at?: string | null;
  created_at: string;
  created_by: string;
}

interface CourtOrder {
  id: string;
  case_id: string;
  court_reference: string;
  order_date: string;
  order_type: string;
  judge_name?: string | null;
  parties_to_proceeding?: string | null;
  terms: string;
  conclusion_grounds?: string | null;
  outcome?: string | null;
  uploaded_by: string;
  created_at: string;
}

interface AssignmentItem {
  id: string;
  case_id: string;
  assigned_to?: string | null;
  assigned_officer_id?: string | null;
  assigned_by?: string | null;
  assigned_by_user_id?: string | null;
  previous_officer_id?: string | null;
  assignment_type?: string | null;
  assignment_reason?: string | null;
  assigned_at: string;
  ended_at?: string | null;
  completed_at?: string | null;
  is_current?: boolean | null;
  status?: string | null;
  remarks?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface CaseAuditLog {
  id: string;
  user_id?: string | null;
  user_full_name?: string | null;
  action: string;
  table_name?: string | null;
  record_type?: string | null;
  record_id?: string | null;
  changed_fields?: string[] | null;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  reason?: string | null;
  source_module?: string | null;
  created_at: string;
  details?: Record<string, unknown> | null;
}

interface ProfileSummary {
  id: string;
  full_name?: string | null;
  email?: string | null;
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/* ---------- Workflow stage helpers ---------- */
const WORKFLOW_STAGES: { value: string; label: string }[] = [
  { value: 'under_review', label: 'Registered' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_court', label: 'Directions' },
  { value: 'hearing', label: 'Hearing' },
  { value: 'judgment', label: 'Judgment' },
  { value: 'compliance', label: 'Compliance' },
];

// Normalise DB status values that share a stage with a canonical value above.
const STAGE_ALIASES: Record<string, string> = {
  registered: 'under_review',
  directions: 'in_court',
  mediation: 'hearing',
  tribunal: 'hearing',
};

const canonicalStage = (status: string) => STAGE_ALIASES[status] ?? status;
const stageLabel = (status: string) =>
  WORKFLOW_STAGES.find((s) => s.value === canonicalStage(status))?.label ?? status;

/* ---------- Component ---------- */
export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [parties, setParties] = useState<Party[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [landParcels, setLandParcels] = useState<Parcel[]>([]);
  const [caseHistory, setCaseHistory] = useState<HistoryItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [courtOrders, setCourtOrders] = useState<CourtOrder[]>([]);
  const [caseAssignments, setCaseAssignments] = useState<AssignmentItem[]>([]);
  const [caseAuditLogs, setCaseAuditLogs] = useState<CaseAuditLog[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, ProfileSummary>>({});
  const [respondingToAlert, setRespondingToAlert] = useState<string | null>(null);
  const [alertResponse, setAlertResponse] = useState('');
  const [updatingStage, setUpdatingStage] = useState(false);
  const [pendingStage, setPendingStage] = useState<{ value: string; label: string } | null>(null);
  const [stageChangeReason, setStageChangeReason] = useState('');
  const [timelineKey, setTimelineKey] = useState(0);

  // Dialog states for programmatic control
  const [partyDialogOpen, setPartyDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [landParcelDialogOpen, setLandParcelDialogOpen] = useState(false);

  // Edit dialog states
  const [editPartyDialogOpen, setEditPartyDialogOpen] = useState(false);
  const [editDocumentDialogOpen, setEditDocumentDialogOpen] = useState(false);
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
  const [editEventDialogOpen, setEditEventDialogOpen] = useState(false);
  const [editLandParcelDialogOpen, setEditLandParcelDialogOpen] = useState(false);

  // Selected items for editing
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedLandParcel, setSelectedLandParcel] = useState<Parcel | null>(null);

  useEffect(() => {
    if (caseId) void loadCaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const loadCaseData = async () => {
    try {
      const { data: caseDetail, error: caseError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single();

      if (caseError) throw caseError;
      setCaseData(caseDetail as CaseData);

      const [
        { data: partiesData },
        { data: documentsData },
        { data: tasksData },
        { data: eventsData },
        { data: parcelsData },
        { data: historyData },
        { data: alertsData },
        { data: courtOrdersData },
        { data: assignmentsData },
        { data: auditData, error: auditError },
        { data: profilesData },
      ] = await Promise.all([
        supabase.from('parties').select('*').eq('case_id', caseId),
        supabase.from('documents').select('*').eq('case_id', caseId).order('uploaded_at', { ascending: false }),
        supabase.from('tasks').select('*').eq('case_id', caseId).order('due_date', { ascending: true }),
        supabase.from('events').select('*').eq('case_id', caseId).order('event_date', { ascending: true }),
        supabase.from('land_parcels').select('*').eq('case_id', caseId),
        supabase.from('case_history').select('*').eq('case_id', caseId).order('created_at', { ascending: false }),
        (supabase as any).from('communications').select('*').eq('case_id', caseId).eq('communication_type', 'alert').order('created_at', { ascending: false }),
        (supabase as any).from('court_orders').select('*').eq('case_id', caseId).order('order_date', { ascending: false }),
        (supabase as any).from('case_assignments').select('*').eq('case_id', caseId).order('assigned_at', { ascending: false }),
        (supabase as any).from('audit_logs').select('*').eq('case_id', caseId).order('created_at', { ascending: false }).limit(200),
        (supabase as any).from('profiles').select('id, full_name, email'),
      ]);

      setParties((partiesData as Party[]) ?? []);
      setDocuments((documentsData as DocumentItem[]) ?? []);
      setTasks((tasksData as TaskItem[]) ?? []);
      setEvents((eventsData as EventItem[]) ?? []);
      setLandParcels((parcelsData as Parcel[]) ?? []);
      setCaseHistory((historyData as HistoryItem[]) ?? []);
      setAlerts((alertsData as Alert[]) ?? []);
      setCourtOrders((courtOrdersData as CourtOrder[]) ?? []);
      setCaseAssignments((assignmentsData as AssignmentItem[]) ?? []);
      setCaseAuditLogs(auditError ? [] : ((auditData as CaseAuditLog[]) ?? []));
      setProfileMap(
        ((profilesData as ProfileSummary[]) ?? []).reduce<Record<string, ProfileSummary>>((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {})
      );
    } catch (error) {
      console.error('Error loading case data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      under_review: { className: 'bg-yellow-100 text-yellow-800', label: 'Under Review' },
      in_court: { className: 'bg-blue-100 text-blue-800', label: 'In Court' },
      mediation: { className: 'bg-purple-100 text-purple-800', label: 'Mediation' },
      tribunal: { className: 'bg-orange-100 text-orange-800', label: 'Tribunal' },
      judgment: { className: 'bg-indigo-100 text-indigo-800', label: 'Judgment' },
      closed: { className: 'bg-gray-100 text-gray-800', label: 'Closed' },
      settled: { className: 'bg-green-100 text-green-800', label: 'Settled' },
    };
    return variants[status] || { className: 'bg-gray-100 text-gray-800', label: status };
  };

  const getTaskStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      pending: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      in_progress: { className: 'bg-blue-100 text-blue-800', label: 'In Progress' },
      completed: { className: 'bg-green-100 text-green-800', label: 'Completed' },
      overdue: { className: 'bg-red-100 text-red-800', label: 'Overdue' },
    };
    return variants[status] || { className: 'bg-gray-100 text-gray-800', label: status };
  };

  const profileName = (id?: string | null) => {
    if (!id) return '—';
    const profile = profileMap[id];
    return profile?.full_name || profile?.email || id.slice(0, 8);
  };

  const currentAssignment = caseAssignments.find((assignment) => assignment.is_current || assignment.status === 'active');
  const isClosedOrSettled = caseData?.status === 'closed' || caseData?.status === 'settled';

  const persistStageChange = async (newStatus: string, description: string, reason: string) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await (supabase as any)
      .from('cases')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        updated_by: user?.id ?? null,
        last_change_reason: reason,
      })
      .eq('id', caseId);
    if (error) throw error;

    try {
      await (supabase as any).from('case_history').insert({
        case_id: caseId,
        action: 'Stage Updated',
        description,
        performed_by: user?.id ?? null,
        reason,
        activity_type: 'stage_changed',
        source_module: 'case_details',
        old_value: { status: caseData?.status ?? null },
        new_value: { status: newStatus },
        changed_fields: ['status'],
      });
    } catch {
      // history table is optional; ignore failures
    }

    await logAudit('update', 'cases', caseId, 'case_stage', {
      reason,
      previous_status: caseData?.status ?? null,
      new_status: newStatus,
    });
  };

  const requestStageChange = (newStatus: string) => {
    if (!caseData || !newStatus || canonicalStage(caseData.status) === newStatus) return;
    setPendingStage({ value: newStatus, label: stageLabel(newStatus) });
    setStageChangeReason('');
  };

  const confirmStageChange = async () => {
    if (!caseData || !pendingStage) return;
    if (stageChangeReason.trim().length < 5) {
      toast.error('Please provide a reason for changing the case stage.');
      return;
    }
    const target = pendingStage;
    setPendingStage(null);
    setUpdatingStage(true);
    try {
      await persistStageChange(
        target.value,
        `Case stage changed to "${target.label}". Reason: ${stageChangeReason.trim()}`,
        stageChangeReason.trim()
      );
      toast.success(`Case moved to ${target.label}`);
      await loadCaseData();
      setTimelineKey((k) => k + 1);
      setStageChangeReason('');
    } catch (error) {
      console.error('Error updating stage:', error);
      toast.error('Failed to update case stage');
    } finally {
      setUpdatingStage(false);
    }
  };

  const maybeAutoAdvance = async (targetStatus: string, reason: string) => {
    if (!caseData) return;
    const curIdx = WORKFLOW_STAGES.findIndex((s) => s.value === canonicalStage(caseData.status));
    const targetIdx = WORKFLOW_STAGES.findIndex((s) => s.value === targetStatus);
    if (targetIdx < 0 || targetIdx <= curIdx) return;
    try {
      await persistStageChange(targetStatus, `Auto-advanced to "${stageLabel(targetStatus)}" (${reason})`, reason);
      toast.info(`Stage auto-advanced to ${stageLabel(targetStatus)}`);
    } catch (error) {
      console.error('Auto-advance failed:', error);
    }
  };

  const handleCourtOrderRegistered = async () => {
    await maybeAutoAdvance('judgment', 'court order registered');
    await loadCaseData();
    setTimelineKey((k) => k + 1);
  };

  const handleAlertResponse = async (alertId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('communications')
        .update({
          response: alertResponse,
          response_status: 'responded',
          responded_at: new Date().toISOString(),
          responded_by: user.id,
        })
        .eq('id', alertId);

      if (error) throw error;

      toast.success('Response submitted successfully!');
      setRespondingToAlert(null);
      setAlertResponse('');
      loadCaseData();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Failed to submit response');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto" />
            <p className="mt-4 text-slate-600">Loading case details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!caseData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Case not found</h2>
            <p className="text-slate-600 mb-6">The case you&apos;re looking for doesn&apos;t exist</p>
            <Link href="/cases">
              <Button>Back to Cases</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const currentStage = canonicalStage(caseData.status);
  const currentStageIdx = WORKFLOW_STAGES.findIndex((s) => s.value === currentStage);
  const nextStage =
    currentStageIdx >= 0 && currentStageIdx < WORKFLOW_STAGES.length - 1
      ? WORKFLOW_STAGES[currentStageIdx + 1]
      : null;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link href="/cases">
              <Button variant="ghost" className="gap-2 mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Cases
              </Button>
            </Link>

            <div data-tour="case-header" className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900">
                {String(caseData.title ?? 'Untitled Case')}
              </h1>
              <Badge className={getStatusBadge(caseData.status).className}>
                {getStatusBadge(caseData.status).label}
              </Badge>
            </div>

            <p className="text-slate-600 font-mono">{caseData.case_number}</p>
            {caseData.description && (
              <p className="text-slate-600 mt-3 max-w-3xl">{caseData.description}</p>
            )}
          </div>

          <div data-tour="case-edit">
            <EditCaseDialog caseData={caseData} onSuccess={loadCaseData} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600 mb-1">Case Type</div>
              <div className="font-medium capitalize">{caseData.case_type.replace('_', ' ')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600 mb-1">Priority</div>
              <div className="font-medium capitalize">{caseData.priority}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600 mb-1">Region</div>
              <div className="font-medium">{caseData.region || 'Not specified'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600 mb-1">Created</div>
              <div className="font-medium">
                {format(new Date(caseData.created_at), 'MMM dd, yyyy')}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card data-tour="case-workflow" className="border-2 border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4 text-slate-600" />
              Case Workflow Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-8">
            <WorkflowStepper
              steps={getWorkflowStepsFromStatus(caseData.status, caseData)}
              orientation="horizontal"
            />

            {!isClosedOrSettled && (
              <div data-tour="case-stage" className="mt-10 pt-4 border-t border-slate-200 flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="text-sm font-medium text-slate-700">Update stage:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={currentStageIdx >= 0 ? currentStage : ''}
                    onValueChange={requestStageChange}
                    disabled={updatingStage}
                  >
                    <SelectTrigger className="h-9 w-[190px]">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKFLOW_STAGES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {nextStage && (
                    <Button
                      size="sm"
                      onClick={() => requestStageChange(nextStage.value)}
                      disabled={updatingStage}
                      className="gap-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {updatingStage ? 'Updating…' : `Advance to ${nextStage.label}`}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <span className="text-xs text-slate-400 sm:ml-auto">
                  Final closure is completed in the Closure tab.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList data-tour="case-tabs" className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="overview" className="text-xs px-3">Overview</TabsTrigger>
            <TabsTrigger value="parties" className="text-xs px-3">Parties ({parties.length})</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs px-3">Documents ({documents.length})</TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs px-3">Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="events" className="text-xs px-3">Events ({events.length})</TabsTrigger>
            <TabsTrigger value="land" className="text-xs px-3">Land ({landParcels.length})</TabsTrigger>
            <TabsTrigger value="assignments" className="text-xs px-3">Assignments ({caseAssignments.length})</TabsTrigger>
            <TabsTrigger value="costs" className="text-xs px-3 flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Costs
            </TabsTrigger>
            <TabsTrigger value="court-order" className="text-xs px-3 flex items-center gap-1">
              <Gavel className="h-3 w-3" />
              Court Order
            </TabsTrigger>
            <TabsTrigger value="closure" className="text-xs px-3 flex items-center gap-1">
              <Archive className="h-3 w-3" />
              Closure
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs px-3">
              <Bell className="h-3 w-3 mr-1" />
              Alerts ({alerts.length})
            </TabsTrigger>
            <TabsTrigger value="compliance" className="text-xs px-3">Compliance</TabsTrigger>
            <TabsTrigger value="section5-notices" className="text-xs px-3">Section 5 Notices</TabsTrigger>
            <TabsTrigger value="section-160" className="text-xs px-3">Section 160(2)</TabsTrigger>
            <TabsTrigger value="search-warrants" className="text-xs px-3">Search Warrants</TabsTrigger>
            <TabsTrigger value="history" className="text-xs px-3">History</TabsTrigger>
            <TabsTrigger value="audit-trail" className="text-xs px-3">Audit Trail</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Parties Involved
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {parties.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No parties added</p>
                  ) : (
                    <div className="space-y-2">
                      {parties.slice(0, 3).map((party) => (
                        <TooltipProvider key={party.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="flex items-center justify-between p-2 border rounded hover:bg-slate-50 hover:border-purple-300 cursor-pointer transition-all group relative"
                                onClick={() => {
                                  setSelectedParty(party);
                                  setEditPartyDialogOpen(true);
                                }}
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{party.name}</div>
                                  <div className="text-xs text-slate-500 capitalize">
                                    {party.party_type}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {party.role}
                                  </Badge>
                                  <Edit2 className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p className="text-xs">Click to edit or update party details</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No events scheduled</p>
                  ) : (
                    <div className="space-y-2">
                      {events.slice(0, 3).map((event) => (
                        <TooltipProvider key={event.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="p-2 border rounded hover:bg-slate-50 hover:border-purple-300 cursor-pointer transition-all group relative"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setEditEventDialogOpen(true);
                                }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{event.title}</div>
                                    <div className="text-xs text-slate-500 mt-1">
                                      {format(new Date(event.event_date), 'MMM dd, yyyy - h:mm a')}
                                    </div>
                                  </div>
                                  <Edit2 className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p className="text-xs">Click to edit event details or add location</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Active Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tasks.filter((t) => t.status !== 'completed').length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No active tasks</p>
                  ) : (
                    <div className="space-y-2">
                      {tasks
                        .filter((t) => t.status !== 'completed')
                        .slice(0, 3)
                        .map((task) => (
                          <TooltipProvider key={task.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className="p-2 border rounded hover:bg-slate-50 hover:border-purple-300 cursor-pointer transition-all group relative"
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setEditTaskDialogOpen(true);
                                  }}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{task.title}</div>
                                      <div className="flex items-center justify-between mt-1">
                                        <div className="text-xs text-slate-500">
                                          Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
                                        </div>
                                        <Badge className={`text-xs ${getTaskStatusBadge(task.status).className}`}>
                                          {getTaskStatusBadge(task.status).label}
                                        </Badge>
                                      </div>
                                    </div>
                                    <Edit2 className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p className="text-xs">Click to update status, priority, or due date</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Recent Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No documents uploaded</p>
                  ) : (
                    <div className="space-y-2">
                      {documents.slice(0, 3).map((doc) => (
                        <TooltipProvider key={doc.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="p-2 border rounded hover:bg-slate-50 hover:border-purple-300 cursor-pointer transition-all group relative"
                                onClick={() => {
                                  setSelectedDocument(doc);
                                  setEditDocumentDialogOpen(true);
                                }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm truncate">{doc.title}</div>
                                    <div className="text-xs text-slate-500 mt-1">
                                      {format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}
                                    </div>
                                  </div>
                                  <Edit2 className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p className="text-xs">Click to edit document details or download</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6">
                <CaseTimeline caseId={caseId} caseCreatedAt={caseData.created_at} refreshKey={timelineKey} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parties">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Parties Involved</CardTitle>
                    <CardDescription>Individuals and entities involved in this case</CardDescription>
                  </div>
                  <AddPartyDialog caseId={caseId} onSuccess={loadCaseData} />
                </div>
              </CardHeader>
              <CardContent>
                {parties.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">No parties added to this case</p>
                    <Button variant="outline" className="gap-2" onClick={() => setPartyDialogOpen(true)}>
                      <Plus className="h-4 w-4" />
                      Add First Party
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {parties.map((party) => (
                      <div key={party.id} className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{party.name}</h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                            <span className="capitalize">Type: {party.party_type.replace('_', ' ')}</span>
                            <span className="capitalize">Role: {party.role}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedParty(party);
                            setEditPartyDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>Case files and attachments</CardDescription>
                  </div>
                  <AddDocumentDialog caseId={caseId} onSuccess={loadCaseData} />
                </div>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">No documents uploaded</p>
                    <Button variant="outline" className="gap-2" onClick={() => setDocumentDialogOpen(true)}>
                      <Upload className="h-4 w-4" />
                      Upload First Document
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div className="bg-blue-50 p-2 rounded">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{doc.title}</h4>
                            {doc.description && (
                              <p className="text-sm text-slate-600 mt-1">{doc.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                              <span>Uploaded: {format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}</span>
                              {doc.file_type && <span>Type: {doc.file_type}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (doc.file_path) {
                                const { data } = supabase.storage
                                  .from('case-documents')
                                  .getPublicUrl(doc.file_path);
                                if (data?.publicUrl) {
                                  window.open(data.publicUrl, '_blank');
                                  toast.success('Opening document...');
                                }
                              }
                            }}
                            title="Download document"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (doc.file_path) {
                                const { data } = supabase.storage
                                  .from('case-documents')
                                  .getPublicUrl(doc.file_path);
                                if (data?.publicUrl) {
                                  const printWindow = window.open(data.publicUrl, '_blank');
                                  if (printWindow) {
                                    printWindow.onload = () => {
                                      printWindow.print();
                                    };
                                  }
                                  toast.success('Opening print dialog...');
                                }
                              }
                            }}
                            title="Print document"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDocument(doc);
                              setEditDocumentDialogOpen(true);
                            }}
                            title="Edit document details"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
                                try {
                                  if (doc.file_path) {
                                    await supabase.storage.from('case-documents').remove([doc.file_path]);
                                  }
                                  const { error } = await (supabase as any)
                                    .from('documents')
                                    .delete()
                                    .eq('id', doc.id);

                                  if (error) throw error;
                                  toast.success('Document deleted successfully');
                                  loadCaseData();
                                } catch (error) {
                                  console.error('Error deleting document:', error);
                                  toast.error('Failed to delete document');
                                }
                              }
                            }}
                            title="Delete document"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tasks</CardTitle>
                    <CardDescription>Assignments and action items</CardDescription>
                  </div>
                  <AddTaskDialog caseId={caseId} onSuccess={loadCaseData} />
                </div>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">No tasks created</p>
                    <Button variant="outline" className="gap-2" onClick={() => setTaskDialogOpen(true)}>
                      <Plus className="h-4 w-4" />
                      Create First Task
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50 cursor-pointer"
                        onClick={() => {
                          setSelectedTask(task);
                          setEditTaskDialogOpen(true);
                        }}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span>Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                        <Badge className={getTaskStatusBadge(task.status).className}>
                          {getTaskStatusBadge(task.status).label}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Events & Hearings</CardTitle>
                    <CardDescription>Schedule and important dates</CardDescription>
                  </div>
                  <AddEventDialog caseId={caseId} onSuccess={loadCaseData} />
                </div>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">No events scheduled</p>
                    <Button variant="outline" className="gap-2" onClick={() => setEventDialogOpen(true)}>
                      <Plus className="h-4 w-4" />
                      Schedule First Event
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-4 p-4 border rounded-lg hover:bg-slate-50 cursor-pointer"
                        onClick={() => {
                          setSelectedEvent(event);
                          setEditEventDialogOpen(true);
                        }}
                      >
                        <div className="bg-blue-50 p-2 rounded">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{event.title}</h4>
                          {event.description && (
                            <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                            <span>{format(new Date(event.event_date), 'MMM dd, yyyy - h:mm a')}</span>
                            {event.location && <span>Location: {event.location}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="land">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Land Parcels</CardTitle>
                    <CardDescription>Associated land and property</CardDescription>
                  </div>
                  <AddLandParcelDialog caseId={caseId} onSuccess={loadCaseData} />
                </div>
              </CardHeader>
              <CardContent>
                {landParcels.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">No land parcels linked</p>
                    <Button variant="outline" className="gap-2" onClick={() => setLandParcelDialogOpen(true)}>
                      <Plus className="h-4 w-4" />
                      Link First Parcel
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {landParcels.map((parcel) => (
                      <div
                        key={parcel.id}
                        className="flex items-start gap-4 p-4 border rounded-lg hover:bg-slate-50 cursor-pointer"
                        onClick={() => {
                          setSelectedLandParcel(parcel);
                          setEditLandParcelDialogOpen(true);
                        }}
                      >
                        <div className="bg-green-50 p-2 rounded">
                          <MapPin className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">Parcel {parcel.parcel_number}</h4>
                          {parcel.location && (
                            <p className="text-sm text-slate-600 mt-1">{parcel.location}</p>
                          )}
                          {parcel.notes && <p className="text-sm text-slate-500 mt-1">{parcel.notes}</p>}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLandParcel(parcel);
                            setEditLandParcelDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Assignment History
                </CardTitle>
                <CardDescription>Current and previous officers assigned to this case</CardDescription>
              </CardHeader>
              <CardContent>
                {currentAssignment && (
                  <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Current assigned officer</div>
                    <div className="mt-1 text-lg font-semibold text-emerald-950">
                      {profileName(currentAssignment.assigned_officer_id || currentAssignment.assigned_to)}
                    </div>
                    <p className="mt-1 text-sm text-emerald-800">
                      Assigned {format(new Date(currentAssignment.assigned_at), 'dd MMM yyyy, h:mm a')}
                      {currentAssignment.assignment_reason ? ` · ${currentAssignment.assignment_reason}` : ''}
                    </p>
                  </div>
                )}
                {caseAssignments.length === 0 ? (
                  <p className="text-center py-12 text-slate-500">No assignment history recorded</p>
                ) : (
                  <div className="space-y-3">
                    {caseAssignments.map((assignment) => (
                      <div key={assignment.id} className="rounded-lg border bg-white p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-slate-900">
                                {profileName(assignment.assigned_officer_id || assignment.assigned_to)}
                              </h4>
                              {(assignment.is_current || assignment.status === 'active') && <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Current</Badge>}
                              <Badge variant="outline" className="capitalize">{(assignment.assignment_type || 'assignment').replace(/_/g, ' ')}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-slate-600">
                              Previous officer: {profileName(assignment.previous_officer_id)}
                            </p>
                            {(assignment.assignment_reason || assignment.remarks) && (
                              <p className="mt-2 text-sm text-slate-700">Reason: {assignment.assignment_reason || assignment.remarks}</p>
                            )}
                          </div>
                          <div className="text-sm text-slate-500 md:text-right">
                            <div>Assigned: {format(new Date(assignment.assigned_at), 'dd MMM yyyy, h:mm a')}</div>
                            {(assignment.ended_at || assignment.completed_at) && (
                              <div>Ended: {format(new Date(assignment.ended_at || assignment.completed_at || assignment.assigned_at), 'dd MMM yyyy, h:mm a')}</div>
                            )}
                            <div>Entered by: {profileName(assignment.created_by || assignment.assigned_by_user_id || assignment.assigned_by)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Case Alerts & Responses
                </CardTitle>
                <CardDescription>
                  Alerts sent for advice, commentary, or direction from senior staff
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No alerts for this case</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <Card key={alert.id} className="border-2 border-red-100">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={
                                  alert.priority === 'urgent' ? 'bg-red-100 text-red-800 border-red-300 border' :
                                  alert.priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-300 border' :
                                  'bg-yellow-100 text-yellow-800 border-yellow-300 border'
                                }>
                                  {alert.priority}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {alert.recipient_role.replace('_', ' ')}
                                </Badge>
                                <Badge className={
                                  alert.response_status === 'responded' ? 'bg-green-100 text-green-800 border-green-300 border' :
                                  'bg-yellow-100 text-yellow-800 border-yellow-300 border'
                                }>
                                  {alert.response_status === 'responded' ? 'Responded' : 'Pending'}
                                </Badge>
                              </div>
                              <h4 className="font-semibold text-slate-900 mb-1">{alert.subject}</h4>
                              <p className="text-sm text-slate-600 mb-2">{alert.workflow_step}</p>
                            </div>
                            <div className="text-right text-sm text-slate-500">
                              {format(new Date(alert.created_at), 'MMM dd, yyyy HH:mm')}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm font-semibold text-slate-700">Message:</Label>
                              <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{alert.message}</p>
                            </div>

                            {alert.response && (
                              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <Label className="text-sm font-semibold text-green-900">Response:</Label>
                                <p className="text-sm text-green-800 mt-1 whitespace-pre-wrap">{alert.response}</p>
                                {alert.responded_at && (
                                  <p className="text-xs text-green-600 mt-2">
                                    Responded on {format(new Date(alert.responded_at), 'MMM dd, yyyy HH:mm')}
                                  </p>
                                )}
                              </div>
                            )}

                            {!alert.response && alert.response_status === 'pending' && (
                              <div className="mt-4">
                                {respondingToAlert === alert.id ? (
                                  <div className="space-y-3">
                                    <div>
                                      <Label htmlFor="alert-response">Your Response</Label>
                                      <Textarea
                                        id="alert-response"
                                        placeholder="Provide your advice, commentary, or direction..."
                                        value={alertResponse}
                                        onChange={(e) => setAlertResponse(e.target.value)}
                                        rows={4}
                                        className="mt-1"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => handleAlertResponse(alert.id)}
                                        className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        <Send className="h-4 w-4" />
                                        Submit Response
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setRespondingToAlert(null);
                                          setAlertResponse('');
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <Button
                                    onClick={() => setRespondingToAlert(alert.id)}
                                    variant="outline"
                                    className="gap-2"
                                  >
                                    <Send className="h-4 w-4" />
                                    Respond to Alert
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costs" className="space-y-4">
            <Card className="border-2 border-dashed border-[#8B2332]/30 bg-[#8B2332]/5">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-center md:text-left">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 justify-center md:justify-start">
                      <DollarSign className="h-5 w-5 text-[#8B2332]" />
                      Record Litigation Costs
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Track all costs associated with this case including legal fees, court fees, penalties, settlements, and other expenses.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                    <AddCostDialog caseId={caseId} onCostAdded={loadCaseData} />
                    <RecordPenaltyDialog caseId={caseId} onPenaltyAdded={loadCaseData} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <CostSummaryCard caseId={caseId} />
            <CostList caseId={caseId} onRefresh={loadCaseData} />
          </TabsContent>

          <TabsContent value="court-order" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Gavel className="h-5 w-5" />
                      Court Order Registration
                    </CardTitle>
                    <CardDescription>
                      Record court orders, judgments, and final decisions
                    </CardDescription>
                  </div>
                  <AddCourtOrderDialog
                    caseId={caseId}
                    caseNumber={caseData.case_number}
                    onSuccess={handleCourtOrderRegistered}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {courtOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Gavel className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No Court Orders Registered</h3>
                    <p className="text-slate-600 mb-6">
                      Register court orders when the case reaches judgment stage
                    </p>
                    <div className="max-w-md mx-auto p-4 bg-amber-50 border border-amber-200 rounded-lg text-left">
                      <h4 className="font-semibold text-amber-900 mb-2">Court Order Details Include:</h4>
                      <ul className="text-sm text-amber-800 space-y-1">
                        <li>• Order reference number and date</li>
                        <li>• Judge/Magistrate name</li>
                        <li>• Order type (judgment, dismissal, settlement, etc.)</li>
                        <li>• Terms and conditions</li>
                        <li>• Grounds for conclusion</li>
                        <li>• Compliance requirements</li>
                        <li>• Upload signed order document</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courtOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                              <Gavel className="h-5 w-5 text-amber-700" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900">{order.court_reference}</h4>
                              <p className="text-sm text-slate-600">
                                {format(new Date(order.order_date), 'MMMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200 capitalize">
                            {order.order_type.replace(/_/g, ' ')}
                          </Badge>
                        </div>

                        {order.judge_name && (
                          <div className="mb-3">
                            <Label className="text-xs text-slate-500">Judge/Magistrate</Label>
                            <p className="text-sm text-slate-700">{order.judge_name}</p>
                          </div>
                        )}

                        {order.parties_to_proceeding && (
                          <div className="mb-3">
                            <Label className="text-xs text-slate-500">Parties to Proceeding</Label>
                            <p className="text-sm text-slate-700">{order.parties_to_proceeding}</p>
                          </div>
                        )}

                        <div className="mb-3">
                          <Label className="text-xs text-slate-500">Terms of Order</Label>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{order.terms}</p>
                        </div>

                        {order.conclusion_grounds && (
                          <div className="mb-3">
                            <Label className="text-xs text-slate-500">Grounds for Conclusion</Label>
                            <p className="text-sm text-slate-700">{order.conclusion_grounds}</p>
                          </div>
                        )}

                        {order.outcome && (
                          <div className="pt-3 border-t">
                            <Badge className={
                              order.outcome === 'in_favor_dlpp' ? 'bg-green-100 text-green-800 border-green-200' :
                              order.outcome === 'against_dlpp' ? 'bg-red-100 text-red-800 border-red-200' :
                              'bg-yellow-100 text-yellow-800 border-yellow-200'
                            }>
                              Outcome: {order.outcome.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="closure" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Archive className="h-5 w-5" />
                      Case Closure
                    </CardTitle>
                    <CardDescription>
                      Finalize and archive the case
                    </CardDescription>
                  </div>
                  {caseData.status !== 'closed' && (
                    <CaseClosureDialog
                      caseId={caseId}
                      caseNumber={caseData.case_number}
                      caseTitle={caseData.title || undefined}
                      onSuccess={loadCaseData}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {caseData.status === 'closed' ? (
                  <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckSquare className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-900">Case Closed</h3>
                        <p className="text-sm text-green-700">This case has been formally closed and archived</p>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-xs text-green-700">Closure Date</Label>
                        <p className="font-medium text-green-900">{caseData.closure_date ? format(new Date(caseData.closure_date), 'MMM dd, yyyy') : format(new Date(caseData.created_at), 'MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-green-700">Final Status</Label>
                        <p className="font-medium text-green-900 capitalize">{caseData.status}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Archive className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Case Not Yet Closed</h3>
                    <p className="text-slate-600 mb-6">
                      Complete all required steps before closing the case
                    </p>
                    <div className="max-w-md mx-auto p-4 bg-slate-50 border border-slate-200 rounded-lg text-left">
                      <h4 className="font-semibold text-slate-900 mb-2">Before Closing:</h4>
                      <ul className="text-sm text-slate-700 space-y-1">
                        <li className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-slate-400" />
                          All court orders registered
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-slate-400" />
                          Compliance requirements tracked
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-slate-400" />
                          Final outcome documented
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-slate-400" />
                          All documents uploaded
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-slate-400" />
                          Costs finalized
                        </li>
                      </ul>
                    </div>
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
                      <p className="text-sm text-red-800">
                        <strong>Note:</strong> Once closed, the case will be archived and no further modifications can be made without admin approval.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance">
            <LinkedRecommendations caseId={caseId} />
          </TabsContent>

          <TabsContent value="section5-notices">
            <Card>
              <CardContent className="pt-6">
                <CaseSection5Notices caseId={caseId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="section-160">
            <Card>
              <CardContent className="pt-6">
                <CaseSection160 caseId={caseId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search-warrants">
            <Card>
              <CardContent className="pt-6">
                <CaseSearchWarrants caseId={caseId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Case History
                </CardTitle>
                <CardDescription>Readable chronological record of every material case activity</CardDescription>
              </CardHeader>
              <CardContent>
                {caseHistory.length === 0 ? (
                  <p className="text-center py-12 text-slate-500">No history recorded</p>
                ) : (
                  <div className="space-y-4">
                    {caseHistory.map((entry, index) => (
                      <div key={entry.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-dlpp-purple" />
                          {index < caseHistory.length - 1 && <div className="w-0.5 h-full bg-slate-200 mt-2" />}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="rounded-lg border bg-white p-4">
                            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                              <div>
                                <h4 className="font-medium text-slate-900">{entry.action}</h4>
                                {entry.description && <p className="text-sm text-slate-600 mt-1">{entry.description}</p>}
                                {entry.reason && <p className="mt-2 text-sm text-slate-700"><span className="font-medium">Reason:</span> {entry.reason}</p>}
                                {entry.changed_fields && entry.changed_fields.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-1">
                                    {entry.changed_fields.map((field) => <Badge key={field} variant="outline" className="text-xs">{field}</Badge>)}
                                  </div>
                                )}
                                {(entry.old_value !== undefined || entry.new_value !== undefined) && (
                                  <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
                                    <div className="rounded bg-slate-50 p-2"><span className="font-medium">Previous:</span> {formatValue(entry.old_value)}</div>
                                    <div className="rounded bg-emerald-50 p-2"><span className="font-medium">New:</span> {formatValue(entry.new_value)}</div>
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 md:text-right">
                                <div>{format(new Date(entry.created_at), 'dd MMM yyyy, h:mm a')}</div>
                                <div>Changed by: {profileName(entry.performed_by || entry.created_by)}</div>
                                {entry.source_module && <div>Source: {entry.source_module}</div>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit-trail">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Audit Trail
                </CardTitle>
                <CardDescription>Technical read-only log for authorised audit users</CardDescription>
              </CardHeader>
              <CardContent>
                {caseAuditLogs.length === 0 ? (
                  <p className="text-center py-12 text-slate-500">No audit records visible for this case, or you do not have audit trail permission.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Date / Time</th>
                          <th className="px-4 py-3">User</th>
                          <th className="px-4 py-3">Action</th>
                          <th className="px-4 py-3">Table</th>
                          <th className="px-4 py-3">Changed Fields</th>
                          <th className="px-4 py-3">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {caseAuditLogs.map((log) => (
                          <tr key={log.id} className="border-t">
                            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{format(new Date(log.created_at), 'dd MMM yyyy HH:mm')}</td>
                            <td className="px-4 py-3 text-slate-700">{log.user_full_name || profileName(log.user_id)}</td>
                            <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{log.action}</Badge></td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{log.table_name || log.record_type || '—'}</td>
                            <td className="px-4 py-3 text-xs text-slate-600">{log.changed_fields?.length ? log.changed_fields.join(', ') : '—'}</td>
                            <td className="px-4 py-3 text-xs text-slate-600">{log.reason || formatValue(log.details?.reason) || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AddPartyDialog
          caseId={caseId}
          onSuccess={loadCaseData}
          open={partyDialogOpen}
          onOpenChange={setPartyDialogOpen}
        />
        <AddDocumentDialog
          caseId={caseId}
          onSuccess={loadCaseData}
          open={documentDialogOpen}
          onOpenChange={setDocumentDialogOpen}
        />
        <AddTaskDialog
          caseId={caseId}
          onSuccess={loadCaseData}
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
        />
        <AddEventDialog
          caseId={caseId}
          onSuccess={loadCaseData}
          open={eventDialogOpen}
          onOpenChange={setEventDialogOpen}
        />
        <AddLandParcelDialog
          caseId={caseId}
          onSuccess={loadCaseData}
          open={landParcelDialogOpen}
          onOpenChange={setLandParcelDialogOpen}
        />

        {selectedParty && (
          <EditPartyDialog
            party={selectedParty}
            onSuccess={loadCaseData}
            open={editPartyDialogOpen}
            onOpenChange={setEditPartyDialogOpen}
          />
        )}
        {selectedDocument && (
          <EditDocumentDialog
            document={selectedDocument}
            onSuccess={loadCaseData}
            open={editDocumentDialogOpen}
            onOpenChange={setEditDocumentDialogOpen}
          />
        )}
        {selectedTask && (
          <EditTaskDialog
            task={selectedTask}
            onSuccess={loadCaseData}
            open={editTaskDialogOpen}
            onOpenChange={setEditTaskDialogOpen}
          />
        )}
        {selectedEvent && (
          <EditEventDialog
            event={selectedEvent}
            onSuccess={loadCaseData}
            open={editEventDialogOpen}
            onOpenChange={setEditEventDialogOpen}
          />
        )}
        {selectedLandParcel && (
          <EditLandParcelDialog
            parcel={selectedLandParcel}
            onSuccess={loadCaseData}
            open={editLandParcelDialogOpen}
            onOpenChange={setEditLandParcelDialogOpen}
          />
        )}

        <AlertDialog
          open={pendingStage !== null}
          onOpenChange={(open) => {
            if (!open) setPendingStage(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Move case to “{pendingStage?.label}”?</AlertDialogTitle>
              <AlertDialogDescription>
                {caseData
                  ? `This will change the workflow stage from “${stageLabel(caseData.status)}” to “${pendingStage?.label}”. A record of this change is added to the case timeline.`
                  : ''}
                <div className="mt-4 space-y-2 text-left">
                  <Label htmlFor="stage-change-reason">Reason for stage change</Label>
                  <Textarea
                    id="stage-change-reason"
                    value={stageChangeReason}
                    onChange={(event) => setStageChangeReason(event.target.value)}
                    placeholder="Explain why this workflow stage is changing."
                    rows={3}
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={updatingStage}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  confirmStageChange();
                }}
                disabled={updatingStage}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updatingStage ? 'Updating…' : 'Confirm'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
