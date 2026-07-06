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
import { ShieldAlert, Plus, Eye, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  getStatusBadgeClass,
  type SearchWarrant,
} from '@/lib/search-warrants';
import { SearchWarrantDialog } from './SearchWarrantDialog';
import { SearchWarrantDetail } from './SearchWarrantDetail';

interface CaseSearchWarrantsProps {
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

export function CaseSearchWarrants({ caseId }: CaseSearchWarrantsProps) {
  const [warrants, setWarrants] = useState<SearchWarrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [perms, setPerms] = useState(FALLBACK_PERMS);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SearchWarrant | null>(null);
  const [detail, setDetail] = useState<SearchWarrant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SearchWarrant | null>(null);

  const load = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('search_warrants')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      if (error) {
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          setMissing(true);
          setWarrants([]);
          return;
        }
        throw error;
      }
      setWarrants((data as SearchWarrant[]) || []);
    } catch (err) {
      console.error('Error loading warrants:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
    getModulePermissions('search_warrants').then((p) => {
      if (p) setPerms(p);
    });
  }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await (supabase as any)
        .from('search_warrants')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;
      await logAudit('delete', 'search_warrants', deleteTarget.id, 'search_warrant', {
        warrant_number: deleteTarget.warrant_number,
      });
      toast.success('Search warrant deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete warrant');
    }
  };

  if (missing) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold text-amber-900">Search Warrants table not set up</p>
            <p>
              Run <code className="rounded bg-amber-100 px-1">database-search-warrants.sql</code> in
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
          <ShieldAlert className="h-5 w-5 text-dlpp-purple" />
          <h3 className="font-semibold text-slate-900">
            Search Warrants ({warrants.length})
          </h3>
        </div>
        {perms.can_create && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            className="gap-1 bg-dlpp-purple hover:bg-dlpp-purple-dark text-white"
          >
            <Plus className="h-4 w-4" />
            Add Search Warrant
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
      ) : warrants.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-2 text-sm text-slate-600">No search warrants linked to this case.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {warrants.map((w) => (
            <div
              key={w.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">
                    {w.warrant_number || 'Unnumbered warrant'}
                  </span>
                  <Badge className={`border text-xs ${getStatusBadgeClass(w.status)}`}>
                    {w.status}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {w.crime_report_number ? `CR: ${w.crime_report_number} · ` : ''}
                  {w.respondent ? `Respondent: ${w.respondent} · ` : ''}
                  {w.date_received ? `Received ${format(new Date(w.date_received), 'dd MMM yyyy')}` : ''}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetail(w)}>
                <Eye className="h-4 w-4" />
              </Button>
              {perms.can_update && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setEditing(w);
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
                  onClick={() => setDeleteTarget(w)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <SearchWarrantDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={load}
        warrant={editing}
        presetCaseId={caseId}
      />

      <SearchWarrantDetail
        open={Boolean(detail)}
        onOpenChange={(o) => !o && setDetail(null)}
        warrant={detail}
        canUpload={perms.can_update || perms.can_create}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this search warrant?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes warrant{' '}
              <strong>{deleteTarget?.warrant_number}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
