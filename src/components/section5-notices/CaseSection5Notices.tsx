'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getModulePermissions, logAudit } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FileWarning, Plus, Eye, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  getStatusBadgeClass,
  getClaimantTypeBadgeClass,
  type Section5Notice,
} from '@/lib/section5-notices';
import { Section5NoticeDialog } from './Section5NoticeDialog';
import { Section5NoticeDetail } from './Section5NoticeDetail';

interface CaseSection5NoticesProps {
  caseId: string;
}

const FALLBACK_PERMS = {
  can_read: true,
  can_create: true,
  can_update: true,
  can_delete: false,
  can_print: true,
  can_approve: false,
  can_export: true,
};

export function CaseSection5Notices({ caseId }: CaseSection5NoticesProps) {
  const [notices, setNotices] = useState<Section5Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [perms, setPerms] = useState(FALLBACK_PERMS);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Section5Notice | null>(null);
  const [detail, setDetail] = useState<Section5Notice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Section5Notice | null>(null);

  const load = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('section5_notices')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      if (error) {
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          setMissing(true);
          setNotices([]);
          return;
        }
        throw error;
      }
      setNotices((data as Section5Notice[]) || []);
    } catch (err) {
      console.error('Error loading Section 5 Notices:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
    getModulePermissions('section5_notices').then((p) => {
      if (p) setPerms(p);
    });
  }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await (supabase as any)
        .from('section5_notices')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;
      await logAudit('delete', 'section5_notices', deleteTarget.id, 'section5_notice', {
        notice_number: deleteTarget.notice_number,
      });
      toast.success('Section 5 Notice deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete notice');
    }
  };

  if (missing) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold text-amber-900">Section 5 Notices table not set up</p>
            <p>
              Run <code className="rounded bg-amber-100 px-1">database-section5-notices.sql</code> in
              your Supabase SQL Editor to enable this feature.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileWarning className="h-5 w-5 text-dlpp-purple" />
          <h3 className="font-semibold text-slate-900">
            Section 5 Notices ({notices.length})
          </h3>
        </div>
        {perms.can_create && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            className="gap-1 bg-dlpp-purple text-white hover:bg-dlpp-purple-dark"
          >
            <Plus className="h-4 w-4" />
            Add Section 5 Notice
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
      ) : notices.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center">
          <FileWarning className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-2 text-sm text-slate-600">No Section 5 Notices linked to this case.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notices.map((n) => (
            <div
              key={n.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">
                    {n.notice_number || 'Unnumbered notice'}
                  </span>
                  <Badge className={`border text-xs ${getStatusBadgeClass(n.current_status)}`}>
                    {n.current_status}
                  </Badge>
                  {n.claimant_type && (
                    <Badge className={`border text-xs ${getClaimantTypeBadgeClass(n.claimant_type)}`}>
                      {n.claimant_type}
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {n.claimant_name ? `Claimant: ${n.claimant_name} · ` : ''}
                  {n.ilg_registration_number ? `ILG: ${n.ilg_registration_number} · ` : ''}
                  {n.date_received ? `Received ${format(new Date(n.date_received), 'dd MMM yyyy')}` : ''}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetail(n)}>
                <Eye className="h-4 w-4" />
              </Button>
              {perms.can_update && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setEditing(n);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {perms.can_delete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700"
                  onClick={() => setDeleteTarget(n)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Section5NoticeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={load}
        notice={editing}
        presetCaseId={caseId}
      />

      <Section5NoticeDetail
        open={Boolean(detail)}
        onOpenChange={(o) => !o && setDetail(null)}
        notice={detail}
        canUpload={perms.can_update || perms.can_create}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Section 5 Notice?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes notice <strong>{deleteTarget?.notice_number}</strong>. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
