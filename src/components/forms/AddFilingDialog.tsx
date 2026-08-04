'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LabelWithHelp } from '@/components/help';
import { toast } from 'sonner';
import { FileText, Upload, X, Paperclip, Loader2, Check, FolderOpen, File, FileImage, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Document {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  document_type: string;
  uploaded_at: string;
}

interface AddFilingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddFilingDialog({ open, onOpenChange, onSuccess }: AddFilingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cases, setCases] = useState<{ id: string; case_number: string; title: string }[]>([]);
  const [lawyers, setLawyers] = useState<{ id: string; name: string; organization: string }[]>([]);
  const [caseDocuments, setCaseDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [attachNewFile, setAttachNewFile] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    case_id: '',
    filing_type: 'instruction_letter',
    title: '',
    description: '',
    filing_number: '',
    submitted_to: '',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      void loadCases();
      void loadLawyers();
    }
  }, [open]);

  // Load documents when case is selected
  useEffect(() => {
    if (formData.case_id) {
      void loadCaseDocuments(formData.case_id);
    } else {
      setCaseDocuments([]);
      setSelectedDocumentId('');
    }
  }, [formData.case_id]);

  const loadCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_number, title')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  };

  const loadLawyers = async () => {
    try {
      const { data, error } = await supabase
        .from('external_lawyers')
        .select('id, name, organization')
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setLawyers(data || []);
    } catch (error) {
      console.error('Error loading lawyers:', error);
    }
  };

  const loadCaseDocuments = async (caseId: string) => {
    setLoadingDocs(true);
    try {
      const { data, error } = await (supabase as any)
        .from('documents')
        .select('id, title, file_url, file_type, file_size, document_type, uploaded_at')
        .eq('case_id', caseId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setCaseDocuments(data || []);
    } catch (error) {
      console.error('Error loading case documents:', error);
      setCaseDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewFile(e.target.files[0]);
      setSelectedDocumentId(''); // Deselect existing document
    }
  };

  const removeNewFile = () => {
    setNewFile(null);
  };

  const selectExistingDocument = (docId: string) => {
    setSelectedDocumentId(docId);
    setNewFile(null); // Remove new file if selecting existing
    setAttachNewFile(false);
  };

  const uploadNewDocument = async (caseId: string, userId: string): Promise<string | null> => {
    if (!newFile) return null;

    setUploading(true);
    try {
      const bucketName = 'case-documents';
      const fileName = `${caseId}/${Date.now()}-${newFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, newFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.warning('Could not upload document');
        return null;
      }

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      // Save document record
      await (supabase as any)
        .from('documents')
        .insert([{
          case_id: caseId,
          title: newFile.name,
          file_url: urlData?.publicUrl,
          file_type: newFile.type,
          file_size: newFile.size,
          document_type: 'filing',
          uploaded_by: userId,
        }]);

      return urlData?.publicUrl || null;
    } catch (error) {
      console.error('Error uploading document:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Determine file URL
      let fileUrl = '';

      if (newFile) {
        // Upload new file
        const uploadedUrl = await uploadNewDocument(formData.case_id, user.id);
        if (uploadedUrl) {
          fileUrl = uploadedUrl;
        }
      } else if (selectedDocumentId) {
        // Use existing document URL
        const selectedDoc = caseDocuments.find(d => d.id === selectedDocumentId);
        if (selectedDoc) {
          fileUrl = selectedDoc.file_url;
        }
      }

      const { error } = await supabase.from('filings').insert([
        {
          ...formData,
          file_url: fileUrl || null,
          prepared_by: user.id,
          prepared_date: new Date().toISOString(),
          status: 'draft',
          submitted_to: formData.submitted_to || null,
        } as never,
      ]);

      if (error) throw error;

      toast.success('Filing created successfully!');
      onSuccess();
      resetForm();
    } catch (error) {
      console.error('Error creating filing:', error);
      toast.error('Failed to create filing');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      case_id: '',
      filing_type: 'instruction_letter',
      title: '',
      description: '',
      filing_number: '',
      submitted_to: '',
      notes: '',
    });
    setSelectedDocumentId('');
    setNewFile(null);
    setAttachNewFile(false);
    setCaseDocuments([]);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      filing: 'Filing',
      affidavit: 'Affidavit',
      correspondence: 'Correspondence',
      survey_report: 'Survey Report',
      contract: 'Contract',
      evidence: 'Evidence',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const getDocumentTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      filing: 'bg-blue-100 text-blue-800',
      affidavit: 'bg-purple-100 text-purple-800',
      correspondence: 'bg-amber-100 text-amber-800',
      survey_report: 'bg-emerald-100 text-emerald-800',
      contract: 'bg-rose-100 text-rose-800',
      evidence: 'bg-orange-100 text-orange-800',
      other: 'bg-slate-100 text-slate-800',
    };
    return colors[type] || colors.other;
  };

  const getFileIcon = (fileType: string) => {
    if (!fileType) return <File className="h-5 w-5 text-slate-500" />;
    if (fileType.includes('image')) return <FileImage className="h-5 w-5 text-green-600" />;
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-600" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('xlsx')) {
      return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />;
    }
    if (fileType.includes('word') || fileType.includes('doc')) return <FileText className="h-5 w-5 text-blue-600" />;
    return <File className="h-5 w-5 text-slate-500" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Filing</DialogTitle>
          <DialogDescription>
            Create instruction letter, affidavit, or other legal filing
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="case_id">Case *</Label>
            <Select value={formData.case_id} onValueChange={(value) => handleChange('case_id', value)} required>
              <SelectTrigger id="case_id">
                <SelectValue placeholder="Select a case" />
              </SelectTrigger>
              <SelectContent>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.case_number} - {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Case Documents Section - Shows immediately when case is selected */}
          {formData.case_id && (
            <div className="space-y-3 p-4 border-2 border-slate-200 rounded-lg bg-gradient-to-b from-slate-50 to-white">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                  <FolderOpen className="h-5 w-5 text-amber-600" />
                  Case Documents
                </Label>
                {caseDocuments.length > 0 && (
                  <Badge variant="outline" className="bg-white">
                    {caseDocuments.length} document{caseDocuments.length !== 1 ? 's' : ''} available
                  </Badge>
                )}
              </div>

              {loadingDocs ? (
                <div className="flex items-center justify-center gap-3 py-8 text-sm text-muted-foreground bg-white rounded-lg border">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  <span>Loading case documents...</span>
                </div>
              ) : caseDocuments.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Select a document to attach to this filing:
                  </p>
                  <div className="max-h-56 overflow-y-auto space-y-2 bg-white border rounded-lg p-2">
                    {caseDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200',
                          selectedDocumentId === doc.id
                            ? 'bg-emerald-50 border-2 border-emerald-400 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent hover:border-slate-200'
                        )}
                        onClick={() => selectExistingDocument(doc.id)}
                      >
                        {/* Selection indicator */}
                        <div className={cn(
                          'flex items-center justify-center h-6 w-6 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors',
                          selectedDocumentId === doc.id
                            ? 'border-emerald-600 bg-emerald-600'
                            : 'border-slate-300 bg-white'
                        )}>
                          {selectedDocumentId === doc.id && (
                            <Check className="h-4 w-4 text-white" />
                          )}
                        </div>

                        {/* File icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getFileIcon(doc.file_type)}
                        </div>

                        {/* Document details */}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            selectedDocumentId === doc.id ? "text-emerald-900" : "text-slate-900"
                          )}>
                            {doc.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge className={cn("text-xs px-1.5 py-0", getDocumentTypeBadgeColor(doc.document_type))}>
                              {getDocumentTypeLabel(doc.document_type)}
                            </Badge>
                            {doc.file_size && (
                              <span className="text-xs text-slate-500">
                                {formatFileSize(doc.file_size)}
                              </span>
                            )}
                            <span className="text-xs text-slate-400">
                              {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedDocumentId && (
                    <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                      <Check className="h-4 w-4" />
                      <span className="font-medium">Document selected</span>
                      <span className="text-emerald-600">- {caseDocuments.find(d => d.id === selectedDocumentId)?.title}</span>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs text-slate-400 uppercase font-medium">or upload new</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-white border border-dashed border-slate-300 rounded-lg">
                  <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-600">No documents found for this case</p>
                  <p className="text-xs text-slate-400 mt-1">Upload a new document below</p>
                </div>
              )}

              {/* Upload New Document */}
              <div className="space-y-2 pt-2">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload New Document
                </Label>
                {newFile ? (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    {getFileIcon(newFile.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-900 truncate">{newFile.name}</p>
                      <p className="text-xs text-blue-600">
                        {formatFileSize(newFile.size)} - New upload
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-blue-100"
                      onClick={removeNewFile}
                    >
                      <X className="h-4 w-4 text-blue-700" />
                    </Button>
                  </div>
                ) : (
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xlsx,.xls,.txt"
                    className="cursor-pointer"
                  />
                )}
              </div>
            </div>
          )}

          {/* Show prompt to select case if not selected */}
          {!formData.case_id && (
            <div className="p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50 text-center">
              <Paperclip className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Select a case above to view and attach documents</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <LabelWithHelp
                htmlFor="filing_type"
                helpTitle="Filing Type"
                help="The kind of document being filed (Affidavit, Motion, Response, Brief, Notice, etc.). This helps organise and find filings on the case."
              >
                Filing Type *
              </LabelWithHelp>
              <Select value={formData.filing_type} onValueChange={(value) => handleChange('filing_type', value)}>
                <SelectTrigger id="filing_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instruction_letter">Instruction Letter</SelectItem>
                  <SelectItem value="affidavit">Affidavit</SelectItem>
                  <SelectItem value="motion">Motion</SelectItem>
                  <SelectItem value="response">Response</SelectItem>
                  <SelectItem value="brief">Brief</SelectItem>
                  <SelectItem value="notice">Notice</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <LabelWithHelp
                htmlFor="filing_number"
                helpTitle="Filing Number"
                help="The reference number for the filing. If the court returns a stamped filing number, record it here so the document can be traced."
              >
                Filing Number
              </LabelWithHelp>
              <Input
                id="filing_number"
                value={formData.filing_number}
                onChange={(e) => handleChange('filing_number', e.target.value)}
                placeholder="e.g., FL-2025-001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Filing title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Detailed description of the filing"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <LabelWithHelp
              htmlFor="submitted_to"
              helpTitle="Submit to (Lawyer)"
              help="The external lawyer or body the filing is being sent to. Leave blank if it is being filed directly with the court."
            >
              Submit to (Lawyer)
            </LabelWithHelp>
            <Select value={formData.submitted_to} onValueChange={(value) => handleChange('submitted_to', value)}>
              <SelectTrigger id="submitted_to">
                <SelectValue placeholder="Select a lawyer (optional)" />
              </SelectTrigger>
              <SelectContent>
                {lawyers.map((lawyer) => (
                  <SelectItem key={lawyer.id} value={lawyer.id}>
                    {lawyer.name} - {lawyer.organization}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploading} style={{ background: '#EF5A5A' }}>
              {loading || uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploading ? 'Uploading...' : 'Creating...'}
                </>
              ) : (
                'Create Filing'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
