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
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  groups: any[];
}

interface EditUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditUserDialog({ user, open, onOpenChange, onSuccess }: EditUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        password: '',
        confirm_password: '',
      });
      setChangePassword(false);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('No user selected');
      return;
    }

    if (changePassword) {
      if (formData.password !== formData.confirm_password) {
        toast.error('Passwords do not match');
        return;
      }

      if (formData.password.length < 8) {
        toast.error('Password must be at least 8 characters');
        return;
      }
    }

    setLoading(true);

    try {
      const updatePayload: any = {
        userId: user.id,
        email: formData.email,
      };

      if (changePassword && formData.password) {
        updatePayload.password = formData.password;
      }

      const response = await fetch('/api/admin/users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user information and settings</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit_email">Email Address *</Label>
            <Input
              id="edit_email"
              type="email"
              placeholder="user@dlpp.gov.pg"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <p className="text-xs text-slate-500">Changing email will require re-verification</p>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox
                id="change_password"
                checked={changePassword}
                onCheckedChange={(checked) => setChangePassword(checked as boolean)}
              />
              <Label
                htmlFor="change_password"
                className="text-sm font-medium cursor-pointer"
              >
                Change Password
              </Label>
            </div>

            {changePassword && (
              <div className="space-y-3 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="edit_password">New Password *</Label>
                  <Input
                    id="edit_password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={changePassword}
                    minLength={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_confirm_password">Confirm New Password *</Label>
                  <Input
                    id="edit_confirm_password"
                    type="password"
                    placeholder="Re-enter new password"
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    required={changePassword}
                    minLength={8}
                  />
                </div>

                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    User will be able to login with the new password immediately.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> To change user groups, use the "Assign Group" button on the user list. Group assignments determine what modules and permissions the user has.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>Updating...</>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Update User
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
