'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AddUserDialog } from '@/components/admin/AddUserDialog';
import { EditUserDialog } from '@/components/admin/EditUserDialog';
import { Users, UserPlus, Search, Shield, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  department: string | null;
  status: string;
  created_at: string;
  last_sign_in_at: string | null;
}

export default function UsersAdminPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data as User[] || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus } as never)
        .eq('id', user.id);

      if (error) throw error;

      toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      admin: { className: 'bg-purple-100 text-purple-800', label: 'Admin' },
      case_manager: { className: 'bg-blue-100 text-blue-800', label: 'Case Manager' },
      legal_officer: { className: 'bg-green-100 text-green-800', label: 'Legal Officer' },
      document_clerk: { className: 'bg-yellow-100 text-yellow-800', label: 'Document Clerk' },
      viewer: { className: 'bg-gray-100 text-gray-800', label: 'Viewer' },
    };
    return variants[role] || { className: 'bg-gray-100 text-gray-800', label: role };
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const filteredUsers = users.filter((user) =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    inactive: users.filter((u) => u.status === 'inactive').length,
    admins: users.filter((u) => u.role === 'admin').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto" />
            <p className="mt-4 text-slate-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Shield className="h-8 w-8 text-purple-600" />
              User Management
            </h1>
            <p className="text-slate-600 mt-2">Manage system users, roles, and permissions</p>
          </div>
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="gap-2 text-white"
            style={{ background: '#EF5A5A' }}
          >
            <UserPlus className="h-4 w-4" />
            Add New User
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Users</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Users</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Inactive Users</p>
                  <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
                </div>
                <UserX className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Administrators</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
                </div>
                <Shield className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>System Users</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">
                  {searchQuery ? 'No users found matching your search' : 'No users created yet'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setAddDialogOpen(true)}
                    variant="outline"
                    className="gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add First User
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-slate-600">User</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Department</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Last Sign In</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-slate-50">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-slate-900">
                              {user.full_name || 'Unnamed User'}
                            </div>
                            <div className="text-sm text-slate-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={getRoleBadge(user.role).className}>
                            {getRoleBadge(user.role).label}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          {user.department || 'Not assigned'}
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={getStatusBadge(user.status)}>
                            {user.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-slate-600 text-sm">
                          {user.last_sign_in_at
                            ? new Date(user.last_sign_in_at).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant={user.status === 'active' ? 'outline' : 'default'}
                              size="sm"
                              onClick={() => handleToggleStatus(user)}
                              className={
                                user.status === 'active'
                                  ? ''
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }
                            >
                              {user.status === 'active' ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AddUserDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onSuccess={loadUsers} />
      {selectedUser && (
        <EditUserDialog
          user={selectedUser}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={loadUsers}
        />
      )}
    </div>
  );
}
