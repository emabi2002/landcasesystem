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
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  department: string | null;
  status: string;
}

interface EditUserDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditUserDialog({ user, open, onOpenChange, onSuccess }: EditUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    email: user.email,
    role: user.role,
    department: user.department || '',
    status: user.status,
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    setFormData({
      full_name: user.full_name || '',
      email: user.email,
      role: user.role,
      department: user.department || '',
      status: user.status,
      new_password: '',
      confirm_password: '',
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.new_password && formData.new_password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.new_password && formData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      // Update user profile
      const { error: profileError } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          role: formData.role,
          department: formData.department || null,
          status: formData.status,
        } as never)
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update password if provided
      if (formData.new_password) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(user.id, {
          password: formData.new_password,
        });

        if (passwordError) throw passwordError;
      }

      toast.success('User updated successfully!');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('User update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      // Delete user profile first
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

      if (authError) throw authError;

      toast.success('User deleted successfully!');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('User delete error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user information and permissions</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-slate-100"
            />
            <p className="text-xs text-slate-500">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="case_manager">Case Manager</SelectItem>
                <SelectItem value="legal_officer">Legal Officer</SelectItem>
                <SelectItem value="document_clerk">Document Clerk</SelectItem>
                <SelectItem value="viewer">Viewer (Read Only)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              placeholder="e.g., Legal Services, Land Registry"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Account Status *</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-sm mb-3">Reset Password (Optional)</h4>

            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                placeholder="Leave blank to keep current"
                value={formData.new_password}
                onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                minLength={8}
              />
            </div>

            <div className="space-y-2 mt-3">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="Re-enter new password"
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                minLength={8}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading} className="sm:mr-auto">
              Delete User
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="text-white" style={{ background: '#EF5A5A' }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
