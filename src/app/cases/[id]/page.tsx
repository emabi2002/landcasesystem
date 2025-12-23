'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import {
  ArrowLeft,
  Edit,
  FileText,
  Users,
  MapPin,
  Calendar,
  CheckSquare,
  History,
  Upload,
  Plus,
  Edit2,
  MousePointerClick,
  Link as LinkIcon,
  Bell,
  Send,
} from 'lucide-react';

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
  const [respondingToAlert, setRespondingToAlert] = useState<string | null>(null);
  const [alertResponse, setAlertResponse] = useState('');

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
      // Case
      const { data: caseDetail, error: caseError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single();

      if (caseError) throw caseError;
      setCaseData(caseDetail as CaseData);

      // Related
      const [
        { data: partiesData },
        { data: documentsData },
        { data: tasksData },
        { data: eventsData },
        { data: parcelsData },
        { data: historyData },
        { data: alertsData },
      ] = await Promise.all([
        supabase.from('parties').select('*').eq('case_id', caseId),
        supabase.from('documents').select('*').eq('case_id', caseId).order('uploaded_at', { ascending: false }),
        supabase.from('tasks').select('*').eq('case_id', caseId).order('due_date', { ascending: true }),
        supabase.from('events').select('*').eq('case_id', caseId).order('event_date', { ascending: true }),
        supabase.from('land_parcels').select('*').eq('case_id', caseId),
        supabase.from('case_history').select('*').eq('case_id', caseId).order('created_at', { ascending: false }),
        (supabase as any).from('communications').select('*').eq('case_id', caseId).eq('communication_type', 'alert').order('created_at', { ascending: false }),
      ]);

      setParties((partiesData as Party[]) ?? []);
      setDocuments((documentsData as DocumentItem[]) ?? []);
      setTasks((tasksData as TaskItem[]) ?? []);
      setEvents((eventsData as EventItem[]) ?? []);
      setLandParcels((parcelsData as Parcel[]) ?? []);
      setCaseHistory((historyData as HistoryItem[]) ?? []);
      setAlerts((alertsData as Alert[]) ?? []);
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
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto" />
            <p className="mt-4 text-slate-600">Loading case details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Case not found</h2>
            <p className="text-slate-600 mb-6">The case you&apos;re looking for doesn&apos;t exist</p>
            <Link href="/cases">
              <Button>Back to Cases</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link href="/cases">
              <Button variant="ghost" className="gap-2 mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Cases
              </Button>
            </Link>

            <div className="flex items-center gap-3 mb-2">
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

          <EditCaseDialog caseData={caseData} onSuccess={loadCaseData} />
        </div>

        {/* Case Info Cards */}
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

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-9 lg:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="parties">Parties ({parties.length})</TabsTrigger>
            <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
            <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="events">Events ({events.length})</TabsTrigger>
            <TabsTrigger value="land">Land ({landParcels.length})</TabsTrigger>
            <TabsTrigger value="alerts">
              <Bell className="h-4 w-4 mr-1" />
              Alerts ({alerts.length})
            </TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
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
          </TabsContent>

          {/* Parties Tab */}
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
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => setPartyDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Add First Party
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {parties.map((party) => (
                      <div
                        key={party.id}
                        className="flex items-start justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{party.name}</h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                            <span className="capitalize">
                              Type: {party.party_type.replace('_', ' ')}
                            </span>
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

          {/* Documents Tab */}
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
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => setDocumentDialogOpen(true)}
                    >
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
                              <span>
                                Uploaded: {format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}
                              </span>
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
                                  // Delete from storage
                                  if (doc.file_path) {
                                    await supabase.storage
                                      .from('case-documents')
                                      .remove([doc.file_path]);
                                  }
                                  // Delete from database
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

          {/* Tasks Tab */}
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
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => setTaskDialogOpen(true)}
                    >
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

          {/* Events Tab */}
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
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => setEventDialogOpen(true)}
                    >
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

          {/* Land Parcels Tab */}
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
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => setLandParcelDialogOpen(true)}
                    >
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

          {/* Alerts Tab */}
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

          {/* Compliance Tab */}
          <TabsContent value="compliance">
            <LinkedRecommendations caseId={caseId} />
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Case History
                </CardTitle>
                <CardDescription>Timeline of all actions and changes</CardDescription>
              </CardHeader>
              <CardContent>
                {caseHistory.length === 0 ? (
                  <p className="text-center py-12 text-slate-500">No history recorded</p>
                ) : (
                  <div className="space-y-4">
                    {caseHistory.map((entry, index) => (
                      <div key={entry.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-blue-600" />
                          {index < caseHistory.length - 1 && (
                            <div className="w-0.5 h-full bg-slate-200 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{entry.action}</h4>
                              {entry.description && (
                                <p className="text-sm text-slate-600 mt-1">{entry.description}</p>
                              )}
                            </div>
                            <time className="text-xs text-slate-500 whitespace-nowrap ml-4">
                              {format(new Date(entry.created_at), 'MMM dd, yyyy h:mm a')}
                            </time>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Hidden controlled dialogs */}
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

        {/* Edit dialogs */}
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
      </div>
    </div>
  );
}
