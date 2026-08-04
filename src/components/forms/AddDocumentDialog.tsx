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
import { Upload, Loader2 } from 'lucide-react';
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

    if (!formData.title.trim()) {
      toast.error('Please enter a document title');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        toast.error('Authentication error. Please log in again.');
        return;
      }
      if (!user) {
        toast.error('Not authenticated. Please log in.');
        return;
      }

      console.log('📤 Starting document upload for case:', caseId);
      console.log('📄 File:', file.name, 'Size:', file.size, 'Type:', file.type);

      // Step 2: Upload file to storage
      const bucketName = 'case-documents';
      const fileName = `${caseId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      console.log('📦 Uploading to bucket:', bucketName, 'Path:', fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);

        // Check for specific storage errors
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('bucket')) {
          toast.error('Storage bucket "case-documents" not found. Please contact administrator to create it.');
          return;
        }
        if (uploadError.message?.includes('row-level security') || uploadError.message?.includes('policy')) {
          toast.error('Storage permission denied. Please contact administrator.');
          return;
        }
        if (uploadError.message?.includes('exceeded') || uploadError.message?.includes('size')) {
          toast.error('File too large. Maximum size is 50MB.');
          return;
        }

        toast.error(`Storage error: ${uploadError.message}`);
        return;
      }

      console.log('✅ File uploaded successfully:', uploadData);

      // Step 3: Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      const fileUrl = urlData?.publicUrl;

      if (!fileUrl) {
        console.error('❌ Could not get public URL');
        toast.error('Failed to get file URL after upload');
        return;
      }

      console.log('🔗 File URL:', fileUrl);

      // Step 4: Save document record to database
      const documentRecord = {
        case_id: caseId,
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        file_url: fileUrl,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        document_type: formData.document_type,
        uploaded_by: user.id,
      };

      console.log('💾 Saving document record:', documentRecord);

      const { data: insertData, error: dbError } = await (supabase as any)
        .from('documents')
        .insert([documentRecord])
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database error:', dbError);

        // Try to clean up the uploaded file since DB insert failed
        try {
          await supabase.storage.from(bucketName).remove([fileName]);
          console.log('🧹 Cleaned up orphaned file');
        } catch (cleanupError) {
          console.warn('Could not clean up file:', cleanupError);
        }

        if (dbError.code === '42501' || dbError.message?.includes('row-level security')) {
          toast.error('Permission denied. You may not have access to upload documents.');
          return;
        }
        if (dbError.code === '23503' || dbError.message?.includes('foreign key')) {
          toast.error('Invalid case or user reference.');
          return;
        }
        if (dbError.code === '23505' || dbError.message?.includes('duplicate')) {
          toast.error('A document with this information already exists.');
          return;
        }

        toast.error(`Database error: ${dbError.message}`);
        return;
      }

      console.log('✅ Document saved successfully:', insertData);

      toast.success('Document uploaded successfully!');
      setOpen(false);
      setFile(null);
      setFormData({ title: '', description: '', document_type: 'other' });
      onSuccess();

    } catch (error: any) {
      console.error('❌ Unexpected error:', error);
      toast.error(error?.message || 'An unexpected error occurred');
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
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.xlsx,.xls,.csv,.txt"
              required
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document_type">Document Type *</Label>
            <Select
              value={formData.document_type}
              onValueChange={(value) => setFormData({ ...formData, document_type: value })}
              disabled={loading}
            >
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
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !file}
              className="text-white hover:opacity-90"
              style={{ background: '#EF5A5A' }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
