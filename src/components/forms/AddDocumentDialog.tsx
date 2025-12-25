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
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

interface AddDocumentDialogProps {
  caseId: string;
  onSuccess: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function AddDocumentDialog({ caseId, onSuccess, open: controlledOpen, onOpenChange, trigger }: AddDocumentDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type: 'other',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Auto-fill title if empty
      if (!formData.title) {
        setFormData({ ...formData, title: e.target.files[0].name });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const bucketName = 'case-documents';
      let fileUrl = null;

      // Try to upload to storage, but don't fail if bucket doesn't exist
      try {
        const fileName = `${caseId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file);

        if (uploadError) {
          // If bucket doesn't exist, just log warning and continue
          if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
            console.warn('Storage bucket not configured. Document metadata will be saved without file upload.');
            toast.warning('Document record saved, but file upload disabled. Contact admin to enable storage.');
          } else {
            throw uploadError;
          }
        } else {
          // Get public URL only if upload succeeded
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);
          fileUrl = urlData?.publicUrl || null;
        }
      } catch (storageError) {
        console.warn('Storage error:', storageError);
        toast.warning('File upload failed. Saving document record only.');
      }

      // Save document metadata to database (works even if file upload failed)
      const { error: dbError } = await supabase
        .from('documents')
        .insert([
          {
            case_id: caseId,
            title: formData.title,
            description: formData.description || null,
            file_url: fileUrl,
            file_type: file.type,
            file_size: file.size,
            document_type: formData.document_type,
            uploaded_by: user.id,
          } as never,
        ]);

      if (dbError) throw dbError;

      toast.success(fileUrl ? 'Document uploaded successfully!' : 'Document record saved (file upload pending storage setup)');
      setOpen(false);
      setFile(null);
      setFormData({ title: '', description: '', document_type: 'other' });
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload document';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!controlledOpen && (
        <DialogTrigger asChild>
          {trigger || (
            <Button className="gap-2 text-white hover:opacity-90" style={{ background: '#EF5A5A' }}>
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>Upload a file related to this case</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">File *</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mp3"
              required
            />
            {file && (
              <p className="text-xs text-slate-500">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Document Title *</Label>
            <Input
              id="title"
              placeholder="Enter document title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document_type">Document Type *</Label>
            <Select value={formData.document_type} onValueChange={(value) => setFormData({ ...formData, document_type: value })}>
              <SelectTrigger id="document_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="filing">Filing</SelectItem>
                <SelectItem value="affidavit">Affidavit</SelectItem>
                <SelectItem value="correspondence">Correspondence</SelectItem>
                <SelectItem value="survey_report">Survey Report</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="evidence">Evidence</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the document"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="text-white hover:opacity-90" style={{ background: '#EF5A5A' }}>
              {loading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
