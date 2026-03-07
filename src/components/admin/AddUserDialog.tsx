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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertCircle, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Group } from '@/lib/rbac-types';

interface GroupModulePermission {
  module_id: string;
  module_name: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  groups: Group[];
}

export function AddUserDialog({ open, onOpenChange, onSuccess, groups }: AddUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [groupPermissions, setGroupPermissions] = useState<GroupModulePermission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    confirm_password: '',
    department: '',
  });

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupPermissions(selectedGroupId);
    } else {
      setGroupPermissions([]);
    }
  }, [selectedGroupId]);

  const loadGroupPermissions = async (groupId: string) => {
    try {
      setLoadingPermissions(true);
      const { data, error } = await supabase
        .from('group_module_permissions')
        .select(`
          module_id,
          can_create,
          can_read,
          can_update,
          can_delete,
          modules (
            module_name
          )
        `)
        .eq('group_id', groupId);

      if (error) throw error;

      const permissions = (data || []).map((p: any) => ({
        module_id: p.module_id,
        module_name: p.modules?.module_name || 'Unknown',
        can_create: p.can_create,
        can_read: p.can_read,
        can_update: p.can_update,
        can_delete: p.can_delete,
      }));

      setGroupPermissions(permissions);
    } catch (error) {
      console.error('Error loading group permissions:', error);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGroupId) {
      toast.error('Please select a group for this user');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      // Call server-side API to create user
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          group_id: selectedGroupId,
          department: formData.department || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      toast.success('User created and assigned to group successfully!');
      onOpenChange(false);
      onSuccess();

      // Reset form
      setFormData({
        email: '',
        full_name: '',
        password: '',
        confirm_password: '',
        department: '',
      });
      setSelectedGroupId('');
      setGroupPermissions([]);
    } catch (error) {
      console.error('User creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Create a new user account with role and permissions</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              placeholder="Enter full name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@dlpp.gov.pg"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 8 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm Password *</Label>
            <Input
              id="confirm_password"
              type="password"
              placeholder="Re-enter password"
              value={formData.confirm_password}
              onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Group Assignment *
            </Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger id="group">
                <SelectValue placeholder="Select a group..." />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.group_name}
                    {group.description && (
                      <span className="text-xs text-slate-500 ml-2">
                        - {group.description}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedGroupId && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <p className="text-xs text-amber-800">
                  <strong>Required:</strong> Every user must be assigned to a group.
                  The group determines what modules and features this user can access.
                </p>
              </div>
            )}
            {selectedGroupId && !loadingPermissions && groupPermissions.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-blue-900 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Group Permissions Preview
                </p>
                <div className="flex flex-wrap gap-1">
                  {groupPermissions
                    .filter(p => p.can_read)
                    .map((perm) => (
                      <Badge
                        key={perm.module_id}
                        variant="outline"
                        className="text-xs bg-white border-blue-300 text-blue-700"
                      >
                        {perm.module_name}
                        {perm.can_create && ' +C'}
                        {perm.can_update && ' +U'}
                        {perm.can_delete && ' +D'}
                      </Badge>
                    ))}
                </div>
                <p className="text-xs text-blue-700">
                  C = Create, U = Update, D = Delete
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department (Optional)</Label>
            <Input
              id="department"
              placeholder="e.g., Legal Services, Land Registry"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>
          </div>

          <DialogFooter className="mt-4 pt-4 border-t bg-white sticky bottom-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedGroupId}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
