'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  Trash2,
  Download,
  Eye,
  Loader2,
  Paperclip,
  File,
  FileImage,
  FileSpreadsheet,
} from 'lucide-react';
import { format } from 'date-fns';
import { LitigationCostDocument } from '@/types/litigation-costs';

interface CostDocumentUploadProps {
  costId: string;
  documents: LitigationCostDocument[];
  onDocumentsChanged: () => void;
  compact?: boolean;
}

const DOCUMENT_TYPES = [
  { value: 'invoice', label: 'Invoice' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'court_order', label: 'Court Order' },
  { value: 'payment_voucher', label: 'Payment Voucher' },
  { value: 'other', label: 'Other' },
];

export function CostDocumentUpload({
  costId,
  documents,
  onDocumentsChanged,
  compact = false
}: CostDocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [documentType, setDocumentType] = useState('invoice');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <File className="h-4 w-4" />;
    if (mimeType.startsWith('image/')) return <FileImage className="h-4 w-4" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
      return <FileSpreadsheet className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate unique file name
      const timestamp = Date.now();
      const fileName = `cost-docs/${costId}/${timestamp}-${file.name}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('case-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('case-documents')
        .getPublicUrl(fileName);

      // Insert document record
      const { error: insertError } = await (supabase as any)
        .from('litigation_cost_documents')
        .insert({
          cost_id: costId,
          document_name: file.name,
          document_type: documentType,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          description: description || null,
          uploaded_by: user.id,
        });

      if (insertError) throw insertError;

      toast.success('Document uploaded successfully');
      setDialogOpen(false);
      setDescription('');
      setDocumentType('invoice');
      onDocumentsChanged();
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (docId: string, fileUrl: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      // Delete from database
      const { error } = await (supabase as any)
        .from('litigation_cost_documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;

      // Try to delete from storage (extract path from URL)
      try {
        const urlParts = fileUrl.split('/case-documents/');
        if (urlParts[1]) {
          await supabase.storage.from('case-documents').remove([urlParts[1]]);
        }
      } catch (storageErr) {
        console.warn('Could not delete file from storage:', storageErr);
      }

      toast.success('Document deleted');
      onDocumentsChanged();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete document');
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">
          {documents.length} document{documents.length !== 1 ? 's' : ''}
        </span>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Paperclip className="h-4 w-4 mr-1" />
              Attach
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Attach Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the document"
                />
              </div>
              <div className="space-y-2">
                <Label>Select File</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500">
                  Max file size: 10MB. Supported: PDF, Word, Excel, Images
                </p>
              </div>
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Supporting Documents</h4>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Supporting Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the document"
                />
              </div>
              <div className="space-y-2">
                <Label>Select File</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500">
                  Max file size: 10MB. Supported: PDF, Word, Excel, Images
                </p>
              </div>
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-6 text-gray-500 border border-dashed rounded-lg">
          <Paperclip className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No documents attached</p>
          <p className="text-xs">Upload invoices, receipts, or court orders</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                {getFileIcon(doc.mime_type)}
                <div>
                  <p className="text-sm font-medium">{doc.document_name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="capitalize">{doc.document_type?.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{formatFileSize(doc.file_size)}</span>
                    <span>•</span>
                    <span>{format(new Date(doc.uploaded_at), 'dd MMM yyyy')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(doc.file_url, '_blank')}
                  title="View"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = doc.file_url;
                    link.download = doc.document_name;
                    link.click();
                  }}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(doc.id, doc.file_url)}
                  className="text-red-600 hover:text-red-700"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
