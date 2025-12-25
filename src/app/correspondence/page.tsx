'use client';

import { useEffect, useState } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { CaseSelector } from '@/components/forms/CaseSelector';
import { FileText, MessageSquare, Download, Printer, AlertCircle, Send, Eye, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface CaseDocument {
  id: string;
  title: string;
  description: string | null;
  file_path: string | null;
  file_type: string | null;
  uploaded_at: string;
  uploaded_by: string;
}

interface Correspondence {
  id: string;
  case_id: string;
  document_id: string | null;
  correspondence_type: 'comment' | 'advice' | 'instruction';
  subject: string;
  content: string;
  created_at: string;
  created_by: string;
  document_title?: string;
}

export default function CorrespondencePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [caseTitle, setCaseTitle] = useState('');
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [correspondence, setCorrespondence] = useState<Correspondence[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    correspondence_type: 'comment' as 'comment' | 'advice' | 'instruction',
    subject: '',
    content: '',
    document_id: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      loadCaseData();
      loadDocuments();
      loadCorrespondence();
    }
  }, [selectedCaseId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
  };

  const loadCaseData = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('cases')
        .select('case_number, title')
        .eq('id', selectedCaseId)
        .single();

      if (error) throw error;

      if (data) {
        setCaseNumber(data.case_number);
        setCaseTitle(data.title);
      }
    } catch (error) {
      console.error('Error loading case data:', error);
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const { data, error} = await (supabase as any)
        .from('documents')
        .select('*')
        .eq('case_id', selectedCaseId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments((data as CaseDocument[]) || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const loadCorrespondence = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('communications')
        .select(`
          *,
          documents(title)
        `)
        .eq('case_id', selectedCaseId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = ((data as any) || []).map((c: any) => ({
        id: c.id,
        case_id: c.case_id,
        document_id: c.document_id,
        correspondence_type: c.communication_type || 'comment',
        subject: c.subject || '',
        content: c.content || '',
        created_at: c.created_at,
        created_by: c.handled_by,
        document_title: c.documents?.title,
      }));

      setCorrespondence(formatted);
    } catch (error) {
      console.error('Error loading correspondence:', error);
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
          case_id: selectedCaseId,
          document_id: formData.document_id || null,
          communication_type: formData.correspondence_type,
          direction: 'internal',
          subject: formData.subject,
          content: formData.content,
          communication_date: new Date().toISOString(),
          handled_by: user.id,
          response_required: false,
          response_status: 'no_response_needed',
        }]);

      if (error) throw error;

      toast.success('Correspondence added successfully!');
      setShowForm(false);
      setFormData({
        correspondence_type: 'comment',
        subject: '',
        content: '',
        document_id: '',
      });
      loadCorrespondence();
    } catch (error) {
      console.error('Error adding correspondence:', error);
      toast.error('Failed to add correspondence');
    } finally {
      setLoading(false);
    }
  };

  const getCorrespondenceTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      comment: { label: 'Comment', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      advice: { label: 'Advice', color: 'bg-green-100 text-green-800 border-green-300' },
      instruction: { label: 'Instruction', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    };
    const badge = badges[type] || badges.comment;
    return <Badge className={`${badge.color} border`}>{badge.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardNav />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Case Correspondence</h1>
              <p className="text-slate-600 mt-1">Comments, Advice & Instructions on Case Documents</p>
            </div>
          </div>
        </div>

        {/* Case Selection */}
        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100/50">
          <CardHeader>
            <CardTitle>Select Case</CardTitle>
            <CardDescription>Choose a case to view its documents and add correspondence</CardDescription>
          </CardHeader>
          <CardContent>
            <CaseSelector
              value={selectedCaseId}
              onValueChange={setSelectedCaseId}
              label="Case"
              placeholder="Search and select a case..."
              required
            />
            {selectedCaseId && (
              <div className="mt-4 p-4 bg-white rounded-lg border">
                <p className="text-sm font-medium text-slate-900">{caseNumber}</p>
                <p className="text-sm text-slate-600">{caseTitle}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedCaseId && (
          <>
            {/* Info Card */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">How to Use</h3>
                    <ul className="text-sm text-blue-800 space-y-1.5">
                      <li>• View all originating and attached documents for this case below</li>
                      <li>• Click <strong>View</strong> to preview, <strong>Download</strong> to save, or <strong>Print</strong> to print any document</li>
                      <li>• Add <strong>Comments</strong>, <strong>Advice</strong>, or <strong>Instructions</strong> on specific documents or the entire case</li>
                      <li>• All correspondence is saved and linked to the case for audit trail</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Case Documents */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Case Documents ({documents.length})</CardTitle>
                    <CardDescription>All documents attached to this case</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-slate-500">Loading documents...</div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No documents found for this case</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="bg-indigo-50 p-2 rounded">
                            <FileText className="h-5 w-5 text-indigo-600" />
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
                            onClick={() => {
                              if (doc.file_path) {
                                const { data } = supabase.storage
                                  .from('case-documents')
                                  .getPublicUrl(doc.file_path);
                                if (data?.publicUrl) {
                                  window.open(data.publicUrl, '_blank');
                                }
                              }
                            }}
                            title="View document"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
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
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
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
                                }
                              }
                            }}
                            title="Print document"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setFormData({ ...formData, document_id: doc.id });
                              setShowForm(true);
                              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            title="Add correspondence for this document"
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Add Note
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add Correspondence Form */}
            {showForm && (
              <Card className="border-2 border-indigo-300">
                <CardHeader>
                  <CardTitle>Add Correspondence</CardTitle>
                  <CardDescription>
                    Add a comment, advice, or instruction for this case
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="correspondence_type">Type *</Label>
                        <Select
                          value={formData.correspondence_type}
                          onValueChange={(value: 'comment' | 'advice' | 'instruction') =>
                            setFormData({ ...formData, correspondence_type: value })
                          }
                        >
                          <SelectTrigger id="correspondence_type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="comment">Comment</SelectItem>
                            <SelectItem value="advice">Advice</SelectItem>
                            <SelectItem value="instruction">Instruction</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="document">Linked Document (Optional)</Label>
                        <Select
                          value={formData.document_id}
                          onValueChange={(value) => setFormData({ ...formData, document_id: value })}
                        >
                          <SelectTrigger id="document">
                            <SelectValue placeholder="Select a document..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">General (not linked to a document)</SelectItem>
                            {documents.map((doc) => (
                              <SelectItem key={doc.id} value={doc.id}>
                                {doc.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        placeholder="Brief subject of your correspondence..."
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">Content *</Label>
                      <Textarea
                        id="content"
                        placeholder="Your comment, advice, or instruction..."
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        required
                        rows={6}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Submit Correspondence
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

            {!showForm && (
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowForm(true)}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus className="h-4 w-4" />
                  Add New Correspondence
                </Button>
              </div>
            )}

            {/* Correspondence History */}
            <Card>
              <CardHeader>
                <CardTitle>Correspondence History ({correspondence.length})</CardTitle>
                <CardDescription>All comments, advice, and instructions for this case</CardDescription>
              </CardHeader>
              <CardContent>
                {correspondence.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No correspondence added yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {correspondence.map((item) => (
                      <div key={item.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getCorrespondenceTypeBadge(item.correspondence_type)}
                            {item.document_title && (
                              <Badge variant="outline" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                {item.document_title}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-slate-500">
                            {format(new Date(item.created_at), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                        <h4 className="font-medium text-slate-900 mb-2">{item.subject}</h4>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{item.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
