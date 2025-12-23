'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Shield,
  UserPlus,
  Settings,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface UserGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  is_active: boolean;
  created_at: string;
  member_count?: number;
}

interface GroupMember {
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
}

interface ModulePermission {
  module_name: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export default function UserGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'bg-blue-100 text-blue-800',
    is_active: true
  });

  const [permissions, setPermissions] = useState<ModulePermission[]>([
    { module_name: 'Cases', can_create: false, can_read: true, can_update: false, can_delete: false },
    { module_name: 'Documents', can_create: false, can_read: true, can_update: false, can_delete: false },
    { module_name: 'Parties', can_create: false, can_read: true, can_update: false, can_delete: false },
    { module_name: 'Tasks', can_create: false, can_read: true, can_update: false, can_delete: false },
    { module_name: 'Events', can_create: false, can_read: true, can_update: false, can_delete: false },
    { module_name: 'Calendar', can_create: false, can_read: true, can_update: false, can_delete: false },
    { module_name: 'Reports', can_create: false, can_read: true, can_update: false, can_delete: false },
    { module_name: 'Land Parcels', can_create: false, can_read: true, can_update: false, can_delete: false },
    { module_name: 'Lawyers', can_create: false, can_read: true, can_update: false, can_delete: false },
    { module_name: 'Compliance', can_create: false, can_read: true, can_update: false, can_delete: false }
  ]);

  const colorOptions = [
    { value: 'bg-blue-100 text-blue-800', label: 'Blue', preview: 'bg-blue-500' },
    { value: 'bg-emerald-100 text-emerald-800', label: 'Emerald', preview: 'bg-emerald-500' },
    { value: 'bg-purple-100 text-purple-800', label: 'Purple', preview: 'bg-purple-500' },
    { value: 'bg-orange-100 text-orange-800', label: 'Orange', preview: 'bg-orange-500' },
    { value: 'bg-red-100 text-red-800', label: 'Red', preview: 'bg-red-500' },
    { value: 'bg-amber-100 text-amber-800', label: 'Amber', preview: 'bg-amber-500' },
    { value: 'bg-cyan-100 text-cyan-800', label: 'Cyan', preview: 'bg-cyan-500' },
    { value: 'bg-pink-100 text-pink-800', label: 'Pink', preview: 'bg-pink-500' }
  ];

  useEffect(() => {
    checkAdminAccess();
    loadGroups();
    loadAllUsers();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: userData } = await (supabase as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin' && userData?.role !== 'manager') {
      toast.error('Access denied. Administrator privileges required.');
      router.push('/admin');
    }
  };

  const loadGroups = async () => {
    try {
      // For now, using localStorage to persist groups
      const storedGroups = localStorage.getItem('user_groups');
      if (storedGroups) {
        setGroups(JSON.parse(storedGroups));
      } else {
        // Initialize with default groups
        const defaultGroups: UserGroup[] = [
          {
            id: '1',
            name: 'Administrators',
            description: 'Full system access with all permissions',
            color: 'bg-red-100 text-red-800',
            is_active: true,
            created_at: new Date().toISOString(),
            member_count: 0
          },
          {
            id: '2',
            name: 'Legal Officers',
            description: 'Case management and legal operations',
            color: 'bg-emerald-100 text-emerald-800',
            is_active: true,
            created_at: new Date().toISOString(),
            member_count: 0
          },
          {
            id: '3',
            name: 'Registry Staff',
            description: 'Document reception and basic case viewing',
            color: 'bg-blue-100 text-blue-800',
            is_active: true,
            created_at: new Date().toISOString(),
            member_count: 0
          },
          {
            id: '4',
            name: 'Read Only',
            description: 'View-only access to cases and documents',
            color: 'bg-amber-100 text-amber-800',
            is_active: true,
            created_at: new Date().toISOString(),
            member_count: 0
          }
        ];
        setGroups(defaultGroups);
        localStorage.setItem('user_groups', JSON.stringify(defaultGroups));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Failed to load user groups');
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('id, email, full_name, role')
        .order('full_name');

      if (error) throw error;
      setAllUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleOpenDialog = (group?: UserGroup) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        description: group.description,
        color: group.color,
        is_active: group.is_active
      });
    } else {
      setEditingGroup(null);
      setFormData({
        name: '',
        description: '',
        color: 'bg-blue-100 text-blue-800',
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error('Please enter a group name');
      return;
    }

    const updatedGroups = editingGroup
      ? groups.map(g => g.id === editingGroup.id ? { ...g, ...formData } : g)
      : [...groups, {
          id: Date.now().toString(),
          ...formData,
          created_at: new Date().toISOString(),
          member_count: 0
        }];

    setGroups(updatedGroups);
    localStorage.setItem('user_groups', JSON.stringify(updatedGroups));

    toast.success(editingGroup ? 'Group updated successfully!' : 'Group created successfully!');
    setDialogOpen(false);
  };

  const handleDelete = (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? Users in this group will lose their assigned permissions.')) {
      return;
    }

    const updatedGroups = groups.filter(g => g.id !== groupId);
    setGroups(updatedGroups);
    localStorage.setItem('user_groups', JSON.stringify(updatedGroups));
    toast.success('Group deleted successfully!');
  };

  const handleOpenPermissions = (group: UserGroup) => {
    setSelectedGroup(group);
    // Load saved permissions for this group
    const savedPermissions = localStorage.getItem(`group_permissions_${group.id}`);
    if (savedPermissions) {
      setPermissions(JSON.parse(savedPermissions));
    }
    setPermissionsDialogOpen(true);
  };

  const handleSavePermissions = () => {
    if (selectedGroup) {
      localStorage.setItem(`group_permissions_${selectedGroup.id}`, JSON.stringify(permissions));
      toast.success('Permissions updated successfully!');
      setPermissionsDialogOpen(false);
    }
  };

  const handleOpenMembers = (group: UserGroup) => {
    setSelectedGroup(group);
    // Load saved members for this group
    const savedMembers = localStorage.getItem(`group_members_${group.id}`);
    if (savedMembers) {
      setGroupMembers(JSON.parse(savedMembers));
    } else {
      setGroupMembers([]);
    }
    setMembersDialogOpen(true);
  };

  const handleSaveMembers = () => {
    if (selectedGroup) {
      localStorage.setItem(`group_members_${selectedGroup.id}`, JSON.stringify(groupMembers));

      // Update member count
      const updatedGroups = groups.map(g =>
        g.id === selectedGroup.id ? { ...g, member_count: groupMembers.length } : g
      );
      setGroups(updatedGroups);
      localStorage.setItem('user_groups', JSON.stringify(updatedGroups));

      toast.success('Group members updated successfully!');
      setMembersDialogOpen(false);
    }
  };

  const toggleUserInGroup = (userId: string) => {
    setGroupMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const togglePermission = (index: number, field: keyof ModulePermission) => {
    setPermissions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: !updated[index][field] };
      return updated;
    });
  };

  const setAllPermissions = (field: keyof ModulePermission, value: boolean) => {
    setPermissions(prev => prev.map(p => ({ ...p, [field]: value })));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardNav />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/admin">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">User Groups Management</h1>
                <p className="text-slate-600 mt-1">Create groups and assign granular permissions</p>
              </div>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Create Group
            </Button>
          </div>
        </div>

        {/* Info Notice */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">About User Groups</h3>
                <p className="text-sm text-blue-800">
                  User Groups allow you to organize users and assign permissions at the group level. Each group can have
                  granular CRUD (Create, Read, Update, Delete) permissions for each module in the system. Users inherit
                  all permissions from the groups they belong to.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-indigo-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Groups</p>
                  <p className="text-2xl font-bold text-slate-900">{groups.length}</p>
                </div>
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Groups</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {groups.filter(g => g.is_active).length}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Users</p>
                  <p className="text-2xl font-bold text-slate-900">{allUsers.length}</p>
                </div>
                <UserPlus className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Modules</p>
                  <p className="text-2xl font-bold text-slate-900">{permissions.length}</p>
                </div>
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Groups List */}
        <Card>
          <CardHeader>
            <CardTitle>All User Groups ({groups.length})</CardTitle>
            <CardDescription>
              Manage groups and their permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading groups...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group) => (
                  <Card key={group.id} className="border-2 border-slate-200 hover:border-slate-300 transition-colors">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-slate-900 text-lg">{group.name}</h3>
                              <Badge className={`${group.color} border`}>
                                {group.member_count || 0} members
                              </Badge>
                              {group.is_active ? (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Active</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800 border-red-300">Inactive</Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-600">{group.description}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenMembers(group)}
                            className="gap-2"
                          >
                            <UserPlus className="h-4 w-4" />
                            Manage Members
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPermissions(group)}
                            className="gap-2"
                          >
                            <Shield className="h-4 w-4" />
                            Permissions
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(group)}
                            className="gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(group.id)}
                            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Group Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Edit Group' : 'Create New Group'}</DialogTitle>
            <DialogDescription>
              {editingGroup ? 'Update the group information below' : 'Create a new user group with custom permissions'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Legal Officers"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose of this group..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Group Color</Label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: option.value })}
                    className={`flex items-center gap-2 p-2 border-2 rounded-lg transition-all ${
                      formData.color === option.value
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded ${option.preview}`} />
                    <span className="text-sm">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active" className="cursor-pointer">Active (group is available for assignment)</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={!formData.name}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {editingGroup ? 'Update' : 'Create'} Group
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

      {/* Manage Members Dialog */}
      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Group Members - {selectedGroup?.name}</DialogTitle>
            <DialogDescription>
              Select users to add to this group. Users will inherit all group permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              {allUsers.length === 0 ? (
                <p className="text-center py-8 text-slate-500">No users available</p>
              ) : (
                allUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border-2 rounded-lg hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={groupMembers.includes(user.id)}
                        onChange={() => toggleUserInGroup(user.id)}
                        className="rounded"
                      />
                      <div>
                        <p className="font-medium text-slate-900">{user.full_name}</p>
                        <p className="text-sm text-slate-600">{user.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleSaveMembers}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Save Members ({groupMembers.length} selected)
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMembersDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Module Permissions - {selectedGroup?.name}</DialogTitle>
            <DialogDescription>
              Configure granular CRUD (Create, Read, Update, Delete) permissions for each module
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Select All Row */}
            <div className="flex items-center gap-4 p-3 bg-slate-100 rounded-lg border-2 border-slate-200">
              <div className="w-40 font-semibold">Select All:</div>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAllPermissions('can_create', true)}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  All Create
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAllPermissions('can_read', true)}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  All Read
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAllPermissions('can_update', true)}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  All Update
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAllPermissions('can_delete', true)}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  All Delete
                </Button>
              </div>
            </div>

            {/* Permissions Table */}
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-4 p-3 bg-slate-50 rounded-lg font-semibold text-sm">
                <div>Module</div>
                <div className="text-center">Create</div>
                <div className="text-center">Read</div>
                <div className="text-center">Update</div>
                <div className="text-center">Delete</div>
              </div>

              {permissions.map((perm, index) => (
                <div key={perm.module_name} className="grid grid-cols-5 gap-4 p-3 border-2 rounded-lg hover:border-slate-300 transition-colors">
                  <div className="font-medium text-slate-900 flex items-center">{perm.module_name}</div>
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={perm.can_create}
                      onChange={() => togglePermission(index, 'can_create')}
                      className="rounded w-5 h-5"
                    />
                  </div>
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={perm.can_read}
                      onChange={() => togglePermission(index, 'can_read')}
                      className="rounded w-5 h-5"
                    />
                  </div>
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={perm.can_update}
                      onChange={() => togglePermission(index, 'can_update')}
                      className="rounded w-5 h-5"
                    />
                  </div>
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={perm.can_delete}
                      onChange={() => togglePermission(index, 'can_delete')}
                      className="rounded w-5 h-5"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleSavePermissions}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Save Permissions
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPermissionsDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
