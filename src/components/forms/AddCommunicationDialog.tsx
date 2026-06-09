'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { FileText, Upload, X, Paperclip, Loader2 } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  file_url: string;
  document_type: string;
}

interface AddCommunicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddCommunicationDialog({ open, onOpenChange, onSuccess }: AddCommunicationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cases, setCases] = useState<{ id: string; case_number: string; title: string }[]>([]);
  const [caseDocuments, setCaseDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    case_id: '',
    communication_type: 'email',
    direction: 'outgoing',
    party_type: 'plaintiff',
    party_name: '',
    subject: '',
    content: '',
    communication_date: new Date().toISOString().split('T')[0],
    response_required: false,
    response_deadline: '',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      void loadCases();
    }
  }, [open]);

  // Load documents when case is selected
  useEffect(() => {
    if (formData.case_id) {
      void loadCaseDocuments(formData.case_id);
    } else {
      setCaseDocuments([]);
      setSelectedDocuments([]);
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

  const loadCaseDocuments = async (caseId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('documents')
        .select('id, title, file_url, document_type')
        .eq('case_id', caseId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setCaseDocuments(data || []);
    } catch (error) {
      console.error('Error loading case documents:', error);
      setCaseDocuments([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
  };

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const uploadAttachment = async (caseId: string, userId: string): Promise<string | null> => {
    if (!attachedFile) return null;

    setUploading(true);
    try {
      const bucketName = 'case-documents';
      const fileName = `${caseId}/${Date.now()}-${attachedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, attachedFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.warning('Could not upload attachment, but communication will be saved');
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
          title: attachedFile.name,
          file_url: urlData?.publicUrl,
          file_type: attachedFile.type,
          file_size: attachedFile.size,
          document_type: 'correspondence',
          uploaded_by: userId,
        }]);

      return urlData?.publicUrl || null;
    } catch (error) {
      console.error('Error uploading attachment:', error);
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

      // Upload attachment if present
      let attachmentUrl = null;
      if (attachedFile) {
        attachmentUrl = await uploadAttachment(formData.case_id, user.id);
      }

      // Build attachments JSON
      const attachments: any = {};
      if (attachmentUrl) {
        attachments.uploaded = attachmentUrl;
      }
      if (selectedDocuments.length > 0) {
        attachments.linked_documents = selectedDocuments;
      }

      const { error } = await supabase.from('communications').insert([
        {
          ...formData,
          handled_by: user.id,
          response_status: formData.response_required ? 'pending' : 'no_response_needed',
          response_deadline: formData.response_deadline || null,
          attachments: Object.keys(attachments).length > 0 ? attachments : null,
        } as never,
      ]);

      if (error) throw error;

      toast.success('Communication logged successfully!');
      onSuccess();
      resetForm();
    } catch (error) {
      console.error('Error logging communication:', error);
      toast.error('Failed to log communication');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      case_id: '',
      communication_type: 'email',
      direction: 'outgoing',
      party_type: 'plaintiff',
      party_name: '',
      subject: '',
      content: '',
      communication_date: new Date().toISOString().split('T')[0],
      response_required: false,
      response_deadline: '',
      notes: '',
    });
    setSelectedDocuments([]);
    setAttachedFile(null);
    setCaseDocuments([]);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Communication</DialogTitle>
          <DialogDescription>
            Record a communication with parties, lawyers, or the court
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

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="communication_type">Type *</Label>
              <Select value={formData.communication_type} onValueChange={(value) => handleChange('communication_type', value)}>
                <SelectTrigger id="communication_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="letter">Letter</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="in_person">In Person</SelectItem>
                  <SelectItem value="fax">Fax</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direction">Direction *</Label>
              <Select value={formData.direction} onValueChange={(value) => handleChange('direction', value)}>
                <SelectTrigger id="direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incoming">Incoming</SelectItem>
                  <SelectItem value="outgoing">Outgoing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="party_type">Party Type *</Label>
              <Select value={formData.party_type} onValueChange={(value) => handleChange('party_type', value)}>
                <SelectTrigger id="party_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plaintiff">Plaintiff</SelectItem>
                  <SelectItem value="defendant">Defendant</SelectItem>
                  <SelectItem value="solicitor_general">Solicitor General</SelectItem>
                  <SelectItem value="private_lawyer">Private Lawyer</SelectItem>
                  <SelectItem value="witness">Witness</SelectItem>
                  <SelectItem value="court">Court</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="party_name">Party Name</Label>
              <Input
                id="party_name"
                value={formData.party_name}
                onChange={(e) => handleChange('party_name', e.target.value)}
                placeholder="Name of person/organization"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="communication_date">Date *</Label>
              <Input
                id="communication_date"
                type="date"
                value={formData.communication_date}
                onChange={(e) => handleChange('communication_date', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              placeholder="Communication subject"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content/Summary</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="Details of the communication"
              rows={4}
            />
          </div>

          {/* Document Attachments Section */}
          <div className="space-y-3 p-4 border rounded-lg bg-slate-50">
            <Label className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Attachments
            </Label>

            {/* Upload New File */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Upload New File</Label>
              {attachedFile ? (
                <div className="flex items-center gap-2 p-2 bg-white border rounded">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm flex-1 truncate">{attachedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(attachedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={removeAttachedFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xlsx,.xls,.txt"
                    className="flex-1"
                  />
                </div>
              )}
            </div>

            {/* Link Existing Documents */}
            {formData.case_id && caseDocuments.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Link Existing Documents ({caseDocuments.length} available)
                </Label>
                <div className="max-h-32 overflow-y-auto space-y-1 bg-white border rounded p-2">
                  {caseDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer"
                      onClick={() => toggleDocumentSelection(doc.id)}
                    >
                      <Checkbox
                        checked={selectedDocuments.includes(doc.id)}
                        onCheckedChange={() => toggleDocumentSelection(doc.id)}
                      />
                      <FileText className="h-4 w-4 text-slate-500 flex-shrink-0" />
                      <span className="text-sm truncate flex-1">{doc.title}</span>
                      <span className="text-xs text-muted-foreground">{doc.document_type}</span>
                    </div>
                  ))}
                </div>
                {selectedDocuments.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedDocuments.length} document(s) selected
                  </p>
                )}
              </div>
            )}

            {formData.case_id && caseDocuments.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No existing documents for this case
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="response_required"
                checked={formData.response_required}
                onCheckedChange={(checked) => handleChange('response_required', checked === true)}
              />
              <Label htmlFor="response_required">Response Required</Label>
            </div>

            {formData.response_required && (
              <div className="flex-1 space-y-2">
                <Label htmlFor="response_deadline">Response Deadline</Label>
                <Input
                  id="response_deadline"
                  type="date"
                  value={formData.response_deadline}
                  onChange={(e) => handleChange('response_deadline', e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes"
              rows={3}
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
                  {uploading ? 'Uploading...' : 'Logging...'}
                </>
              ) : (
                'Log Communication'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
