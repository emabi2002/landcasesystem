'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Document {
  id: string;
  title: string;
  description?: string | null;
  file_type?: string | null;
  file_path?: string | null;
}

interface EditDocumentDialogProps {
  document: Document;
  onSuccess: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditDocumentDialog({ document, onSuccess, open, onOpenChange }: EditDocumentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: document.title,
    description: document.description || '',
    file_type: document.file_type || 'legal_document',
  });

  useEffect(() => {
    setFormData({
      title: document.title,
      description: document.description || '',
      file_type: document.file_type || 'legal_document',
    });
  }, [document]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('documents')
        .update({
          title: formData.title,
          description: formData.description || null,
          file_type: formData.file_type,
        } as never)
        .eq('id', document.id);

      if (error) throw error;

      toast.success('Document updated successfully!');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Document update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update document';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      // Delete file from storage if exists
      if (document.file_path) {
        const { error: storageError } = await supabase.storage
          .from('case-documents')
          .remove([document.file_path]);

        if (storageError) {
          console.warn('Storage delete warning:', storageError);
        }
      }

      // Delete database record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);

      if (error) throw error;

      toast.success('Document deleted successfully!');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Document delete error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete document';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!document.file_path) {
      toast.error('No file attached to this document');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('case-documents')
        .download(document.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.title;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
          <DialogDescription>Update document information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="file_type">Document Type *</Label>
            <Select value={formData.file_type} onValueChange={(value) => setFormData({ ...formData, file_type: value })}>
              <SelectTrigger id="file_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="legal_document">Legal Document</SelectItem>
                <SelectItem value="court_order">Court Order</SelectItem>
                <SelectItem value="evidence">Evidence</SelectItem>
                <SelectItem value="correspondence">Correspondence</SelectItem>
                <SelectItem value="survey_plan">Survey Plan</SelectItem>
                <SelectItem value="photo">Photo/Image</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Document details and notes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {document.file_path && (
            <div className="pt-2">
              <Button type="button" variant="outline" onClick={handleDownload} className="w-full">
                Download File
              </Button>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading} className="sm:mr-auto">
              Delete
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="text-white hover:opacity-90" style={{ background: '#EF5A5A' }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
