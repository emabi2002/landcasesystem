'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Download, Loader2, Paperclip, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  SECTION5_DOCUMENT_TYPES,
  getSection5DocTypeLabel,
} from '@/lib/section5-notices';

interface NoticeDoc {
  id: string;
  title: string;
  file_url: string;
  document_type: string | null;
  uploaded_at: string;
}

interface Section5NoticeDocumentsProps {
  noticeId: string;
  caseId: string | null;
  canUpload?: boolean;
}

export function Section5NoticeDocuments({
  noticeId,
  caseId,
  canUpload = true,
}: Section5NoticeDocumentsProps) {
  const [docs, setDocs] = useState<NoticeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState(SECTION5_DOCUMENT_TYPES[0].value);
  const [file, setFile] = useState<File | null>(null);

  const loadDocs = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('documents')
        .select('id, title, file_url, document_type, uploaded_at')
        .eq('section5_notice_id', noticeId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      setDocs((data as NoticeDoc[]) || []);
    } catch (err) {
      console.error('Error loading notice documents:', err);
    } finally {
      setLoading(false);
    }
  }, [noticeId]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please choose a file first');
      return;
    }
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      // Store under the case folder when linked, otherwise a notices folder.
      const filePath = `${caseId ?? 'section5-notices'}/${fileName}`;

      const { error: upErr } = await supabase.storage
        .from('case-documents')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage
        .from('case-documents')
        .getPublicUrl(filePath);

      const { error: insErr } = await (supabase as any).from('documents').insert({
        case_id: caseId,
        section5_notice_id: noticeId,
        title: file.name,
        file_url: publicUrl,
        file_type: file.type || ext,
        file_size: file.size,
        document_type: docType,
        uploaded_by: user?.id ?? null,
      });
      if (insErr) throw insErr;

      await logAudit('create', 'section5_notices', noticeId, 'section5_notice_document', {
        document_type: docType,
        title: file.name,
      });

      toast.success(
        caseId
          ? 'Document uploaded and linked to the case'
          : 'Document uploaded to the notice',
      );
      setFile(null);
      loadDocs();
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {canUpload && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Paperclip className="h-4 w-4" />
            Attach a document
          </div>
          {!caseId && (
            <div className="mb-3 flex items-start gap-2 rounded-md border border-sky-200 bg-sky-50 p-2.5 text-xs text-sky-800">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              This notice is not linked to a case yet. Documents are still stored on the notice and
              will also appear in the case document list once the notice is linked.
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-[220px_1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Document type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTION5_DOCUMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">File</Label>
              <Input
                type="file"
                className="h-9"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={uploading}
              />
            </div>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={uploading || !file}
              className="h-9 gap-2 bg-dlpp-purple text-white hover:bg-dlpp-purple-dark"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload
            </Button>
          </div>
        </div>
      )}

      {/* Document list */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Attached documents ({docs.length})
        </div>
        {loading ? (
          <div className="py-6 text-center text-sm text-slate-400">Loading documents...</div>
        ) : docs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
            No documents attached to this notice yet.
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 p-2.5"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-dlpp-purple/10 text-dlpp-purple">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{d.title}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[11px]">
                      {getSection5DocTypeLabel(d.document_type)}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {d.uploaded_at ? format(new Date(d.uploaded_at), 'dd MMM yyyy') : ''}
                    </span>
                  </div>
                </div>
                <a href={d.file_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
