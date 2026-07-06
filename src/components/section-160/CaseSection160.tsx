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
import { Landmark, Plus, Eye, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getStatusBadgeClass, type Section160Application } from '@/lib/section-160';
import { Section160Dialog } from './Section160Dialog';
import { Section160Detail } from './Section160Detail';

interface CaseSection160Props {
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

export function CaseSection160({ caseId }: CaseSection160Props) {
  const [apps, setApps] = useState<Section160Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [perms, setPerms] = useState(FALLBACK_PERMS);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Section160Application | null>(null);
  const [detail, setDetail] = useState<Section160Application | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Section160Application | null>(null);

  const load = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('section_160_applications')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      if (error) {
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          setMissing(true);
          setApps([]);
          return;
        }
        throw error;
      }
      setApps((data as Section160Application[]) || []);
    } catch (err) {
      console.error('Error loading Section 160(2) applications:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
    getModulePermissions('section_160').then((p) => {
      if (p) setPerms(p);
    });
  }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await (supabase as any)
        .from('section_160_applications')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;
      await logAudit('delete', 'section_160', deleteTarget.id, 'section_160_application', {
        defendant: deleteTarget.defendant,
      });
      toast.success('Application deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete application');
    }
  };

  if (missing) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold text-amber-900">Section 160(2) table not set up</p>
            <p>
              Run <code className="rounded bg-amber-100 px-1">database-section-160.sql</code> in your
              Supabase SQL Editor to enable this feature.
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
          <Landmark className="h-5 w-5 text-dlpp-purple" />
          <h3 className="font-semibold text-slate-900">
            Section 160(2) Applications ({apps.length})
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
            Add Application
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
      ) : apps.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center">
          <Landmark className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-2 text-sm text-slate-600">
            No Section 160(2) applications linked to this case.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {apps.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{a.defendant || 'Unnamed defendant'}</span>
                  <Badge className={`border text-xs ${getStatusBadgeClass(a.status_of_matter)}`}>
                    {a.status_of_matter}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {a.court_file_reference_no ? `Court: ${a.court_file_reference_no} · ` : ''}
                  {a.title_file_reference ? `Title: ${a.title_file_reference} · ` : ''}
                  {a.date_received ? `Received ${format(new Date(a.date_received), 'dd MMM yyyy')}` : ''}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetail(a)}>
                <Eye className="h-4 w-4" />
              </Button>
              {perms.can_update && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setEditing(a);
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
                  onClick={() => setDeleteTarget(a)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Section160Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={load}
        application={editing}
        presetCaseId={caseId}
      />

      <Section160Detail
        open={Boolean(detail)}
        onOpenChange={(o) => !o && setDetail(null)}
        application={detail}
        canUpload={perms.can_update || perms.can_create}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this application?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the Section 160(2) application for{' '}
              <strong>{deleteTarget?.defendant}</strong>. This action cannot be undone.
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
