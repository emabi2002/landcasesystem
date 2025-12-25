'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle2, Clock, FileText, Send, Users } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface WorkflowCase {
  id: string;
  workflow_id: string;
  case_number: string;
  title: string;
  court_file_number: string | null;
  is_new_case: boolean;
  stage: string;
  officer_role: string;
  created_at: string;
  days_pending: number;
  case_summary: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export default function ExecutiveReviewPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingCases, setPendingCases] = useState<WorkflowCase[]>([]);
  const [completedCases, setCompletedCases] = useState<WorkflowCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<WorkflowCase | null>(null);
  const [adviceDialogOpen, setAdviceDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Advice form state
  const [commentary, setCommentary] = useState('');
  const [advice, setAdvice] = useState('');
  const [recommendations, setRecommendations] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (userProfile) {
      loadPendingCases();
      loadCompletedCases();
    }
  }, [userProfile]);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (!profile) throw new Error('Profile not found');

      // Type assertion for profile data
      const typedProfile = profile as UserProfile;

      // Check if user has executive role
      if (!['secretary_lands', 'director_legal', 'manager_legal', 'admin'].includes(typedProfile.role || '')) {
        toast.error('Access denied. This page is for executive officers only.');
        window.location.href = '/dashboard';
        return;
      }

      setUserProfile(typedProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingCases = async () => {
    if (!userProfile) return;

    try {
      const { data, error } = await supabase
        .from('pending_executive_reviews')
        .select('*')
        .eq('officer_id', userProfile.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPendingCases(data || []);
    } catch (error) {
      console.error('Error loading pending cases:', error);
      toast.error('Failed to load pending cases');
    }
  };

  const loadCompletedCases = async () => {
    if (!userProfile) return;

    try {
      const { data, error } = await supabase
        .from('executive_workflow')
        .select(`
          id,
          case_id,
          stage,
          officer_role,
          created_at,
          completed_at,
          status,
          cases:case_id (
            id,
            case_number,
            title,
            court_file_number
          )
        `)
        .eq('officer_id', userProfile.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formatted = (data || []).map((item: any) => ({
        id: item.cases?.id || item.case_id || '',
        workflow_id: item.id,
        case_number: item.cases?.case_number || '',
        title: item.cases?.title || '',
        court_file_number: item.cases?.court_file_number,
        is_new_case: false,
        stage: item.stage,
        officer_role: item.officer_role,
        created_at: item.created_at,
        days_pending: 0,
        case_summary: ''
      }));

      setCompletedCases(formatted);
    } catch (error) {
      console.error('Error loading completed cases:', error);
    }
  };

  const handleOpenAdviceDialog = (caseItem: WorkflowCase) => {
    setSelectedCase(caseItem);
    setCommentary('');
    setAdvice('');
    setRecommendations('');
    setAdviceDialogOpen(true);
  };

  const handleSubmitAdvice = async () => {
    if (!selectedCase || !userProfile) return;

    if (!commentary && !advice && !recommendations) {
      toast.error('Please provide at least one type of input');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/executive/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: selectedCase.id,
          user_id: userProfile.id,
          officer_role: userProfile.role,
          commentary,
          advice,
          recommendations,
          workflow_stage: getWorkflowStage(userProfile.role),
          notify_next_officer: true
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit advice');
      }

      toast.success('Executive advice submitted successfully');

      if (result.nextOfficerNotified) {
        toast.info('Next officer in chain has been notified');
      }

      setAdviceDialogOpen(false);
      loadPendingCases();
      loadCompletedCases();
    } catch (error) {
      console.error('Error submitting advice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit advice');
    } finally {
      setSubmitting(false);
    }
  };

  const getWorkflowStage = (role: string): string => {
    const stages: Record<string, string> = {
      'secretary_lands': 'secretary_review',
      'director_legal': 'director_guidance',
      'manager_legal': 'manager_instruction'
    };
    return stages[role] || 'case_registered';
  };

  const getRoleName = (role: string): string => {
    const names: Record<string, string> = {
      'secretary_lands': 'Secretary for Lands',
      'director_legal': 'Director, Legal Services',
      'manager_legal': 'Manager, Legal Services'
    };
    return names[role] || role;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />
        <div className="p-8 flex items-center justify-center">
          <div className="text-center">
            <Clock className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Executive Review Dashboard</h1>
          <p className="text-slate-600 mt-1">
            {userProfile && getRoleName(userProfile.role)} - Review and provide guidance on cases
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCases.length}</div>
              <p className="text-xs text-slate-600">Awaiting your input</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCases.length}</div>
              <p className="text-xs text-slate-600">Cases reviewed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent</CardTitle>
              <Clock className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pendingCases.filter(c => c.days_pending > 3).length}
              </div>
              <p className="text-xs text-slate-600">Over 3 days pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Reviews ({pendingCases.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedCases.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingCases.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">All Caught Up!</h3>
                    <p className="text-slate-600">You have no pending case reviews at this time.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              pendingCases.map(caseItem => (
                <Card key={caseItem.workflow_id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{caseItem.case_number}</CardTitle>
                          {caseItem.is_new_case && (
                            <Badge variant="default" className="bg-blue-600">NEW CASE</Badge>
                          )}
                          {caseItem.days_pending > 3 && (
                            <Badge variant="destructive">Urgent - {caseItem.days_pending} days</Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm">{caseItem.title}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-slate-700">Court Reference:</span>
                          <p className="text-slate-600">{caseItem.court_file_number || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Registered:</span>
                          <p className="text-slate-600">
                            {new Date(caseItem.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {caseItem.case_summary && (
                        <div className="bg-slate-50 p-3 rounded-md">
                          <p className="text-sm font-medium text-slate-700 mb-1">Case Summary:</p>
                          <p className="text-sm text-slate-600 whitespace-pre-line">{caseItem.case_summary}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Link href={`/cases/${caseItem.id}`}>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            View Case
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => handleOpenAdviceDialog(caseItem)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Provide Advice
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedCases.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No completed reviews yet.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              completedCases.map(caseItem => (
                <Card key={caseItem.workflow_id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{caseItem.case_number}</CardTitle>
                        <CardDescription>{caseItem.title}</CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Completed
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/cases/${caseItem.id}`}>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        View Case
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Advice Dialog */}
      <Dialog open={adviceDialogOpen} onOpenChange={setAdviceDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Provide Executive Advice</DialogTitle>
            <DialogDescription>
              Case: {selectedCase?.case_number} - {selectedCase?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="commentary">Commentary</Label>
              <Textarea
                id="commentary"
                placeholder="Provide your general commentary on this case..."
                value={commentary}
                onChange={(e) => setCommentary(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="advice">Legal Advice</Label>
              <Textarea
                id="advice"
                placeholder="Provide specific legal advice or guidance..."
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendations">Recommendations</Label>
              <Textarea
                id="recommendations"
                placeholder="Provide recommendations for handling this case..."
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdviceDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAdvice}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? 'Submitting...' : 'Submit Advice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
