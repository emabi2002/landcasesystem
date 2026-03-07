'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Users, UserPlus, Search, Shield, UserCheck, UserX, X, Edit, Trash2, Settings } from 'lucide-react';
import { toast } from 'sonner';
import type { Group } from '@/lib/rbac-types';
import { format } from 'date-fns';
import { AddUserDialog } from '@/components/admin/AddUserDialog';
import { EditUserDialog } from '@/components/admin/EditUserDialog';

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

interface UserWithGroups extends AuthUser {
  groups: Group[];
}

export default function UsersAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithGroups[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithGroups | null>(null);
  const [editingUser, setEditingUser] = useState<UserWithGroups | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/login');
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .order('group_name');

      if (groupsError) throw groupsError;
      setGroups(groupsData || []);

      // Load all users from API route
      const response = await fetch('/api/admin/users/list');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load users');
      }

      setUsers(data.users || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const openAssignDialog = (user: UserWithGroups) => {
    setSelectedUser(user);
    setSelectedGroupId('');
    setAssignDialogOpen(true);
  };

  const openEditDialog = (user: UserWithGroups) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const assignUserToGroup = async () => {
    if (!selectedUser || !selectedGroupId) {
      toast.error('Please select a group');
      return;
    }

    try {
      setAssigning(true);

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await (supabase as any)
        .from('user_groups')
        .insert({
          user_id: selectedUser.id,
          group_id: selectedGroupId,
          assigned_by: user?.id || null,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('User is already in this group');
        } else {
          throw error;
        }
        return;
      }

      toast.success('User assigned to group successfully');
      setAssignDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error assigning user:', error);
      toast.error(error.message || 'Failed to assign user to group');
    } finally {
      setAssigning(false);
    }
  };

  const removeUserFromGroup = async (userId: string, groupId: string) => {
    if (!confirm('Are you sure you want to remove this user from the group?')) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('user_groups')
        .delete()
        .eq('user_id', userId)
        .eq('group_id', groupId);

      if (error) throw error;

      toast.success('User removed from group');
      loadData();
    } catch (error: any) {
      console.error('Error removing user:', error);
      toast.error(error.message || 'Failed to remove user from group');
    }
  };

  const handleDeleteUser = async (user: UserWithGroups) => {
    if (!confirm(`Are you sure you want to delete user "${user.email}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      toast.success('User deleted successfully');
      loadData();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading users...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
            <p className="text-slate-600 mt-1">Manage users and their group assignments</p>
          </div>
          <Button
            onClick={() => setCreateUserDialogOpen(true)}
            size="lg"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <UserPlus className="h-5 w-5" />
            Create New User
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search users by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="grid gap-4">
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No users found</h3>
                <p className="text-slate-600">
                  {users.length === 0
                    ? 'No users have been created yet'
                    : 'Try adjusting your search criteria'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <Users className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{user.email}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                            <span>
                              Joined: {format(new Date(user.created_at), 'MMM dd, yyyy')}
                            </span>
                            {user.last_sign_in_at && (
                              <span>
                                Last login: {format(new Date(user.last_sign_in_at), 'MMM dd, yyyy')}
                              </span>
                            )}
                            {!user.email_confirmed_at && (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Unverified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* User's Groups */}
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">Groups:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {user.groups.length > 0 ? (
                            user.groups.map((group) => (
                              <Badge
                                key={group.id}
                                className="bg-blue-100 text-blue-800 border-blue-200 gap-2"
                              >
                                {group.group_name}
                                <button
                                  onClick={() => removeUserFromGroup(user.id, group.id)}
                                  className="hover:text-blue-900"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-slate-500 italic">No groups assigned</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => openEditDialog(user)}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => openAssignDialog(user)}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        Assign Group
                      </Button>
                      <Button
                        onClick={() => handleDeleteUser(user)}
                        size="sm"
                        variant="outline"
                        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary */}
        {filteredUsers.length > 0 && (
          <p className="text-sm text-slate-600 text-center">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        )}
      </div>

      {/* Assign Group Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign User to Group</DialogTitle>
            <DialogDescription>
              Add {selectedUser?.email} to a group to grant permissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Group</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a group..." />
                </SelectTrigger>
                <SelectContent>
                  {groups
                    .filter(group => !selectedUser?.groups.some(ug => ug.id === group.id))
                    .map((group) => (
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
            </div>

            {selectedUser && selectedUser.groups.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> This user is already in {selectedUser.groups.length} group(s).
                  Adding to another group will grant additional permissions.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
              disabled={assigning}
            >
              Cancel
            </Button>
            <Button
              onClick={assignUserToGroup}
              disabled={!selectedGroupId || assigning}
            >
              {assigning ? 'Assigning...' : 'Assign to Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <AddUserDialog
        open={createUserDialogOpen}
        onOpenChange={setCreateUserDialogOpen}
        onSuccess={loadData}
        groups={groups}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={loadData}
        user={editingUser}
      />
    </AppLayout>
  );
}
