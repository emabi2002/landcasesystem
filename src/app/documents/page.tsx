'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Search, X, FolderOpen, Calendar, File } from 'lucide-react';
import { format } from 'date-fns';

interface Document {
  id: string;
  title: string;
  description: string | null;
  document_type: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_at: string;
  file_url: string | null;
  case_id: string;
  cases?: { case_number: string; title: string | null };
}

export default function DocumentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    checkAuth();
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/login');
  };

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*, cases(case_number, title)')
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.cases?.case_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || doc.document_type === filterType;
    return matchesSearch && matchesType;
  });

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      pleading: 'Pleading', evidence: 'Evidence', survey_report: 'Survey Report',
      title_document: 'Title Document', correspondence: 'Correspondence',
      court_order: 'Court Order', photo: 'Photo', other: 'Other'
    };
    return types[type] || type;
  };

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      pleading: 'bg-blue-100 text-blue-800', evidence: 'bg-purple-100 text-purple-800',
      survey_report: 'bg-green-100 text-green-800', title_document: 'bg-orange-100 text-orange-800',
      correspondence: 'bg-yellow-100 text-yellow-800', court_order: 'bg-red-100 text-red-800',
      photo: 'bg-pink-100 text-pink-800', other: 'bg-slate-100 text-slate-800'
    };
    return colors[type] || colors.other;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  };

  const typeCounts = documents.reduce((acc, doc) => {
    acc[doc.document_type] = (acc[doc.document_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading documents...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-600 mt-1">View and manage all documents across cases</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Documents</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: '#4A4284' }}>{documents.length}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: '#F3F2F7' }}>
                  <FileText className="h-5 w-5" style={{ color: '#4A4284' }} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pleadings</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{typeCounts.pleading || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50">
                  <File className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Evidence</p>
                  <p className="text-2xl font-bold mt-1 text-purple-600">{typeCounts.evidence || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50">
                  <File className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Survey Reports</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{typeCounts.survey_report || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50">
                  <File className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by title, description, or case number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setSearchQuery('')}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types ({documents.length})</SelectItem>
                  <SelectItem value="pleading">Pleading ({typeCounts.pleading || 0})</SelectItem>
                  <SelectItem value="evidence">Evidence ({typeCounts.evidence || 0})</SelectItem>
                  <SelectItem value="survey_report">Survey Report ({typeCounts.survey_report || 0})</SelectItem>
                  <SelectItem value="other">Other ({typeCounts.other || 0})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(searchQuery || filterType !== 'all') && (
              <p className="text-sm text-slate-600 mt-3">
                Showing {filteredDocuments.length} of {documents.length} documents
              </p>
            )}
          </CardContent>
        </Card>

        {/* Documents Grid */}
        {filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {documents.length === 0 ? 'No documents yet' : 'No matching documents'}
              </h3>
              <p className="text-slate-600">
                {documents.length === 0 ? 'Upload documents from case pages' : 'Try different search terms'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 truncate mb-1">{doc.title}</h3>
                      {doc.description && (
                        <p className="text-sm text-slate-600 line-clamp-2 mb-2">{doc.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge className={getDocumentTypeColor(doc.document_type)}>
                          {getDocumentTypeLabel(doc.document_type)}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <FolderOpen className="h-3 w-3" />
                          <span className="truncate">{doc.cases?.case_number || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}</span>
                        </div>
                        {doc.file_size && (
                          <div className="flex items-center gap-1">
                            <File className="h-3 w-3" />
                            <span>{formatFileSize(doc.file_size)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push(`/cases/${doc.case_id}?tab=documents`)}>
                      <FolderOpen className="h-4 w-4 mr-1" />
                      View Case
                    </Button>
                    {doc.file_url && (
                      <Button size="sm" className="flex-1 text-white hover:opacity-90" style={{ background: '#EF5A5A' }} onClick={() => window.open(doc.file_url!, '_blank')}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
