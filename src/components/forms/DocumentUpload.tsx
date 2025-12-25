'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, File, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentUploadProps {
  caseId?: string;
  filingId?: string;
  onUploadComplete?: (filePath: string) => void;
  accept?: string;
  maxSize?: number;
}

export function DocumentUpload({ caseId, filingId, onUploadComplete, accept, maxSize = 50 * 1024 * 1024 }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size
      if (file.size > maxSize) {
        toast.error(`File size must be less than ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
        return;
      }
      setSelectedFile(file);
      setUploadedUrl(null);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create unique file path
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const folderPath = caseId || 'pending';
      const filePath = `${folderPath}/${fileName}`;

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('case-documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('case-documents')
        .getPublicUrl(filePath);

      setUploadProgress(100);
      setUploadedUrl(publicUrl);

      // Only save document record if we have a caseId
      if (caseId) {
        await (supabase as any)
          .from('documents')
          .insert({
            case_id: caseId,
            title: selectedFile.name,
            file_url: publicUrl,
            file_path: filePath,
            file_type: fileExt,
            uploaded_by: user.id,
          });

        // If filing_id provided, update the filing record
        if (filingId) {
          await (supabase as any)
            .from('filings')
            .update({ file_url: publicUrl })
            .eq('id', filingId);
        }
      }

      toast.success('Document uploaded successfully!');

      if (onUploadComplete) {
        onUploadComplete(filePath);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setUploadedUrl(null);
    setUploadProgress(0);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file-upload">Upload Document</Label>
        <div className="flex gap-2">
          <Input
            id="file-upload"
            type="file"
            onChange={handleFileSelect}
            disabled={uploading}
            accept={accept || ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"}
          />
          {selectedFile && !uploadedUrl && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearSelection}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Accepted formats: PDF, Word, Excel, Images (Max 50MB)
        </p>
      </div>

      {selectedFile && !uploadedUrl && (
        <div className="p-4 bg-slate-50 rounded-lg border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <File className="h-8 w-8 text-slate-400" />
            <div>
              <p className="font-medium text-sm">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button
            onClick={uploadFile}
            disabled={uploading}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-xs text-center text-slate-500">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      {uploadedUrl && (
        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <div className="flex-1">
            <p className="font-medium text-sm text-emerald-900">Document uploaded successfully!</p>
            <p className="text-xs text-emerald-700">File is now attached to this case</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSelection}
          >
            Upload Another
          </Button>
        </div>
      )}
    </div>
  );
}
