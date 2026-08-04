'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import {
  FileText,
  Upload,
  Loader2,
  Trash2,
  Download,
  Eye,
  Paperclip,
  X
} from 'lucide-react';
import { format } from 'date-fns';

interface CostDocument {
  id: string;
  cost_id: string;
  document_name: string;
  document_type: string;
  file_path: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by: string | null;
}

interface CostDocumentManagerProps {
  costId: string;
  costType: string;
  onDocumentChange?: () => void;
}

export function CostDocumentManager({ costId, costType, onDocumentChange }: CostDocumentManagerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<CostDocument[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadDocuments();
    }
  }, [open, costId]);

  async function loadDocuments() {
    setLoading(true);
    try {
      const { data, error: fetchError } = await (supabase as any)
        .from('cost_documents')
        .select('*')
        .eq('cost_id', costId)
        .order('uploaded_at', { ascending: false });

      if (fetchError) throw fetchError;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${costId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('cost-documents')
        .upload(fileName, file);

      if (uploadError) {
        // If bucket doesn't exist, try creating document record anyway
        console.warn('Storage upload failed, creating document record only');
      }

      // Create document record
      const { error: insertError } = await (supabase as any)
        .from('cost_documents')
        .insert({
          cost_id: costId,
          document_name: file.name,
          document_type: file.type || 'application/octet-stream',
          file_path: fileName,
          file_size: file.size,
          uploaded_by: user?.id || null,
        });

      if (insertError) throw insertError;

      loadDocuments();
      onDocumentChange?.();
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  }

  async function handleDelete(doc: CostDocument) {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      // Delete from storage
      await supabase.storage
        .from('cost-documents')
        .remove([doc.file_path]);

      // Delete record
      const { error } = await (supabase as any)
        .from('cost_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      loadDocuments();
      onDocumentChange?.();
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document');
    }
  }

  async function handleDownload(doc: CostDocument) {
    try {
      const { data } = supabase.storage
        .from('cost-documents')
        .getPublicUrl(doc.file_path);

      if (data?.publicUrl) {
        window.open(data.publicUrl, '_blank');
      }
    } catch (err) {
      console.error('Error downloading document:', err);
      setError('Failed to download document');
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function getFileIcon(type: string) {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    return '📎';
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1">
          <Paperclip className="h-4 w-4" />
          {documents.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
              {documents.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#8B2332]" />
            Documents for: {costType}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm flex items-center justify-between">
              {error}
              <button onClick={() => setError(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
            <input
              type="file"
              id="doc-upload"
              className="hidden"
              onChange={handleUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              disabled={uploading}
            />
            <label
              htmlFor="doc-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-[#8B2332]" />
              ) : (
                <Upload className="h-8 w-8 text-gray-400" />
              )}
              <span className="text-sm text-gray-600">
                {uploading ? 'Uploading...' : 'Click to upload receipt/invoice'}
              </span>
              <span className="text-xs text-gray-400">
                PDF, Word, Excel, or Images (max 10MB)
              </span>
            </label>
          </div>

          {/* Documents List */}
          {loading ? (
            <div className="text-center py-6">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
            </div>
          ) : documents.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xl">{getFileIcon(doc.document_type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.document_name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(doc.file_size)} • {format(new Date(doc.uploaded_at), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <FileText className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No documents attached</p>
              <p className="text-xs">Upload receipts, invoices, or court orders</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
