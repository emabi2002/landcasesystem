'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Shield, Edit, Trash2, CheckCircle2, XCircle, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  role: string;
  created_at: string;
}

const ROLES = {
  executive: {
    name: 'Executive Management',
    description: 'See dashboard and comment on directions (Step 2)',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    access: ['dashboard', 'directions_view', 'directions_comment']
  },
  manager: {
    name: 'Manager',
    description: 'Full access to all modules',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    access: ['all']
  },
  lawyer: {
    name: 'Lawyer / Legal Officer',
    description: 'Step 3 through case closure',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    access: ['registration', 'officer_actions', 'external_filings', 'compliance', 'closure', 'parties_lawyers']
  },
  officer: {
    name: 'Officer / Registry Clerk',
    description: 'Step 1 - Document reception only',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    access: ['reception', 'case_view']
  },
  admin: {
    name: 'System Administrator',
    description: 'Full system access + user management',
    color: 'bg-red-100 text-red-800 border-red-300',
    access: ['all', 'admin']
  }
};

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    role: 'officer',
    password: '',
  });

  useEffect(() => {
    checkAdminAccess();
    loadUsers();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin' && userData?.role !== 'manager') {
      toast.error('Access denied. Admin or Manager role required.');
      router.push('/dashboard');
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) throw new Error(result.error);

      toast.success('User created successfully!');
      setDialogOpen(false);
      setFormData({ email: '', full_name: '', phone: '', role: 'officer', password: '' });
      loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      toast.success('User updated successfully!');
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast.success('User deleted successfully!');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = ROLES[role as keyof typeof ROLES] || ROLES.officer;
    return (
      <Badge className={`${roleConfig.color} border font-medium`}>
        {roleConfig.name}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardNav />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">User Administration</h1>
              <p className="text-slate-600 mt-1">Manage users and role-based access control</p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <UserPlus className="h-4 w-4" />
                Add New User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system and assign their role
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      placeholder="John Doe"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@lands.gov.pg"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="+675 xxx xxxx"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Initial Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min. 8 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role & Access Level *</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLES).map(([key, role]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col">
                            <span className="font-medium">{role.name}</span>
                            <span className="text-xs text-slate-500">{role.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Role Info */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mt-2">
                    <p className="text-sm font-medium text-slate-900 mb-1">
                      {ROLES[formData.role as keyof typeof ROLES].name}
                    </p>
                    <p className="text-xs text-slate-600">
                      {ROLES[formData.role as keyof typeof ROLES].description}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleCreateUser}
                    disabled={loading || !formData.email || !formData.full_name || !formData.password}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Create User
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Role Access Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Role-Based Access Control Matrix
            </CardTitle>
            <CardDescription>
              Different roles have access to different workflow modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Role</th>
                    <th className="text-center p-3 font-semibold">Step 1<br/>Reception</th>
                    <th className="text-center p-3 font-semibold">Step 2<br/>Directions</th>
                    <th className="text-center p-3 font-semibold">Step 3<br/>Registration</th>
                    <th className="text-center p-3 font-semibold">Step 4-5<br/>Actions</th>
                    <th className="text-center p-3 font-semibold">Step 6<br/>Compliance</th>
                    <th className="text-center p-3 font-semibold">Step 7<br/>Closure</th>
                    <th className="text-center p-3 font-semibold">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3">{getRoleBadge('executive')}</td>
                    <td className="text-center">—</td>
                    <td className="text-center"><CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                    <td className="text-center">—</td>
                    <td className="text-center">—</td>
                    <td className="text-center">—</td>
                    <td className="text-center">—</td>
                    <td className="text-center">—</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">{getRoleBadge('manager')}</td>
                    <td className="text-center"><CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                    <td className="text-center"><CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                    <td className="text-center"><CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                    <td className="text-center"><CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                    <td className="text-center"><CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                    <td className="text-center"><CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                    <td className="text-center">—</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">{getRoleBadge('lawyer')}</td>
                    <td className="text-center">—</td>
                    <td className="text-center">—</td>
                    <td className="text-center"><CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                    <td className="text-center"><CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                    <td className="text-center"><CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                    <td className="text-center"><CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                    <td className="text-center">—</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">{getRoleBadge('officer')}</td>
                    <td className="text-center"><CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                    <td className="text-center">—</td>
                    <td className="text-center">—</td>
                    <td className="text-center">—</td>
                    <td className="text-center">—</td>
                    <td className="text-center">—</td>
                    <td className="text-center">—</td>
                  </tr>
                  <tr>
                    <td className="p-3">{getRoleBadge('admin')}</td>
                    <td className="text-center"><CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                    <td className="text-center"><CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                    <td className="text-center"><CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                    <td className="text-center"><CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                    <td className="text-center"><CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                    <td className="text-center"><CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                    <td className="text-center"><CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Users ({users.length})
            </CardTitle>
            <CardDescription>
              Manage system users and their access levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No users found. Create your first user above.
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{user.full_name}</h3>
                          {getRoleBadge(user.role)}
                          {user.is_active ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300 border">Active</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border-red-300 border">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{user.email}</p>
                        {user.phone && <p className="text-xs text-slate-500">{user.phone}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleUpdateUser(user.id, { role: value })}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ROLES).map(([key, role]) => (
                            <SelectItem key={key} value={key}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateUser(user.id, { is_active: !user.is_active })}
                      >
                        {user.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
