'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Shield, Users, Check, X, AlertTriangle, UserCheck, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Group } from '@/lib/rbac-types';

interface ModulePermission {
  module_key: string;
  module_name: string;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

interface ManageUserGroupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
  userEmail: string;
  currentGroups: Group[];
  allGroups: Group[];
}

export function ManageUserGroupsDialog({
  open,
  onOpenChange,
  onSuccess,
  userId,
  userEmail,
  currentGroups,
  allGroups,
}: ManageUserGroupsDialogProps) {
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [previewPermissions, setPreviewPermissions] = useState<ModulePermission[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Initialize selected groups when dialog opens
  useEffect(() => {
    if (open) {
      const currentGroupIds = new Set(currentGroups.map(g => g.id));
      setSelectedGroupIds(currentGroupIds);
      loadPermissionPreview(Array.from(currentGroupIds));
    }
  }, [open, currentGroups]);

  const loadPermissionPreview = async (groupIds: string[]) => {
    if (groupIds.length === 0) {
      setPreviewPermissions([]);
      return;
    }

    try {
      setLoadingPreview(true);

      // Get all permissions for the selected groups
      const { data, error } = await supabase
        .from('group_module_permissions')
        .select(`
          module_id,
          can_create,
          can_read,
          can_update,
          can_delete,
          modules (
            module_key,
            module_name
          )
        `)
        .in('group_id', groupIds);

      if (error) throw error;

      // Aggregate permissions (BOOL_OR logic - if any group has permission, user gets it)
      const permissionMap = new Map<string, ModulePermission>();

      (data || []).forEach((perm: any) => {
        const moduleKey = perm.modules?.module_key;
        const moduleName = perm.modules?.module_name;

        if (!moduleKey) return;

        const existing = permissionMap.get(moduleKey);
        if (existing) {
          permissionMap.set(moduleKey, {
            module_key: moduleKey,
            module_name: moduleName,
            can_read: existing.can_read || perm.can_read,
            can_create: existing.can_create || perm.can_create,
            can_update: existing.can_update || perm.can_update,
            can_delete: existing.can_delete || perm.can_delete,
          });
        } else {
          permissionMap.set(moduleKey, {
            module_key: moduleKey,
            module_name: moduleName,
            can_read: perm.can_read,
            can_create: perm.can_create,
            can_update: perm.can_update,
            can_delete: perm.can_delete,
          });
        }
      });

      setPreviewPermissions(Array.from(permissionMap.values()));
    } catch (error) {
      console.error('Error loading permission preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    const newSelectedIds = new Set(selectedGroupIds);
    if (newSelectedIds.has(groupId)) {
      newSelectedIds.delete(groupId);
    } else {
      newSelectedIds.add(groupId);
    }
    setSelectedGroupIds(newSelectedIds);
    loadPermissionPreview(Array.from(newSelectedIds));
  };

  const setUserToGroupOnly = async (groupId: string, groupName: string) => {
    if (!confirm(`Set ${userEmail} to "${groupName}" group ONLY?\n\nThis will remove them from all other groups.`)) {
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      // Remove from all groups first
      const { error: deleteError } = await (supabase as any)
        .from('user_groups')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Add to the selected group only
      const { error: insertError } = await (supabase as any)
        .from('user_groups')
        .insert({
          user_id: userId,
          group_id: groupId,
          assigned_by: user?.id || null,
          is_active: true,
        });

      if (insertError) throw insertError;

      toast.success(`${userEmail} is now ${groupName} ONLY`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error setting user group:', error);
      toast.error(error.message || 'Failed to update user groups');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      const currentGroupIds = new Set(currentGroups.map(g => g.id));

      // Groups to add
      const toAdd = Array.from(selectedGroupIds).filter(id => !currentGroupIds.has(id));

      // Groups to remove
      const toRemove = Array.from(currentGroupIds).filter(id => !selectedGroupIds.has(id));

      // Remove from groups
      if (toRemove.length > 0) {
        const { error: removeError } = await (supabase as any)
          .from('user_groups')
          .delete()
          .eq('user_id', userId)
          .in('group_id', toRemove);

        if (removeError) throw removeError;
      }

      // Add to groups
      if (toAdd.length > 0) {
        const inserts = toAdd.map(groupId => ({
          user_id: userId,
          group_id: groupId,
          assigned_by: user?.id || null,
          is_active: true,
        }));

        const { error: addError } = await (supabase as any)
          .from('user_groups')
          .insert(inserts);

        if (addError) throw addError;
      }

      toast.success('User groups updated successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating user groups:', error);
      toast.error(error.message || 'Failed to update user groups');
    } finally {
      setLoading(false);
    }
  };

  const changesCount = () => {
    const currentIds = new Set(currentGroups.map(g => g.id));
    const added = Array.from(selectedGroupIds).filter(id => !currentIds.has(id)).length;
    const removed = Array.from(currentIds).filter(id => !selectedGroupIds.has(id)).length;
    return { added, removed, total: added + removed };
  };

  const changes = changesCount();
  const hasChanges = changes.total > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            Manage Groups for {userEmail}
          </DialogTitle>
          <DialogDescription>
            Select which groups this user belongs to. Permissions are additive - users get ALL permissions from ALL their groups.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Left: Group Selection */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Available Groups
              </h3>

              <ScrollArea className="h-[400px] border rounded-md p-4">
                <div className="space-y-3">
                  {allGroups.map((group) => {
                    const isSelected = selectedGroupIds.has(group.id);
                    const wasPrevious = currentGroups.some(g => g.id === group.id);

                    return (
                      <Card key={group.id} className={isSelected ? 'border-emerald-500 bg-emerald-50' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleGroup(group.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm">{group.group_name}</h4>
                                {isSelected && !wasPrevious && (
                                  <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                                    +Adding
                                  </Badge>
                                )}
                                {!isSelected && wasPrevious && (
                                  <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-300">
                                    -Removing
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 mt-1">{group.description}</p>

                              {/* Quick action button */}
                              {!isSelected && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setUserToGroupOnly(group.id, group.group_name)}
                                  disabled={loading}
                                  className="mt-2 h-7 text-xs gap-1"
                                >
                                  <Zap className="h-3 w-3" />
                                  Set as {group.group_name} ONLY
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Right: Permission Preview */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Permission Preview
              </h3>

              {selectedGroupIds.size === 0 ? (
                <Card className="border-amber-300 bg-amber-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-amber-900">No groups selected</p>
                        <p className="text-xs text-amber-700 mt-1">
                          User will have no access to any modules
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-[400px] border rounded-md p-4">
                  {loadingPreview ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                      <p className="text-sm text-slate-600 mt-2">Loading permissions...</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-600 mb-3">
                        User will have access to {previewPermissions.length} module(s):
                      </p>
                      {previewPermissions.map((perm) => (
                        <Card key={perm.module_key} className="border-slate-200">
                          <CardContent className="p-3">
                            <h5 className="font-medium text-sm mb-2">{perm.module_name}</h5>
                            <div className="flex flex-wrap gap-1">
                              {perm.can_read && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  <Check className="h-3 w-3 mr-1" />
                                  Read
                                </Badge>
                              )}
                              {perm.can_create && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  <Check className="h-3 w-3 mr-1" />
                                  Create
                                </Badge>
                              )}
                              {perm.can_update && (
                                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                  <Check className="h-3 w-3 mr-1" />
                                  Update
                                </Badge>
                              )}
                              {perm.can_delete && (
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                  <Check className="h-3 w-3 mr-1" />
                                  Delete
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              )}
            </div>
          </div>
        </div>

        {hasChanges && (
          <Card className="border-blue-300 bg-blue-50">
            <CardContent className="p-3">
              <p className="text-sm font-medium text-blue-900">
                {changes.added > 0 && `Adding to ${changes.added} group(s)`}
                {changes.added > 0 && changes.removed > 0 && ' • '}
                {changes.removed > 0 && `Removing from ${changes.removed} group(s)`}
              </p>
            </CardContent>
          </Card>
        )}

        <Separator />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !hasChanges}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? 'Saving...' : `Save Changes${hasChanges ? ` (${changes.total})` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
