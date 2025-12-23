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
  AlertCircle,
  Lock,
  Unlock,
  Grid3x3
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface UserGroup {
  id: string;
  group_name: string;
  group_code: string;
  description: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
  updated_at: string;
}

interface SystemModule {
  id: string;
  module_name: string;
  module_code: string;
  description: string;
  module_url: string;
  icon: string;
  parent_module_id: string | null;
  display_order: number;
  is_active: boolean;
}

interface GroupModuleAccess {
  id: string;
  group_id: string;
  module_id: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_admin: boolean;
}

interface UserGroupMembership {
  id: string;
  user_id: string;
  group_id: string;
  is_active: boolean;
  profiles: {
    full_name: string;
    email: string;
    role: string;
  };
}

export default function RBACAdminPage() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('groups');

  // Data states
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);

  // Selected items
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [selectedModule, setSelectedModule] = useState<SystemModule | null>(null);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);

  // Form data
  const [groupForm, setGroupForm] = useState({
    group_name: '',
    group_code: '',
    description: '',
    is_active: true
  });

  const [moduleForm, setModuleForm] = useState({
    module_name: '',
    module_code: '',
    description: '',
    module_url: '',
    icon: '',
    display_order: 0,
    is_active: true
  });

  const [groupPermissions, setGroupPermissions] = useState<GroupModuleAccess[]>([]);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);

  useEffect(() => {
    checkAdminAccess();
    loadAllData();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    setCurrentUserId(user.id);

    const { data: userData } = await (supabase as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      toast.error('Access denied. Administrator privileges required.');
      router.push('/admin');
    }
  };

  const loadAllData = async () => {
    await Promise.all([
      loadGroups(),
      loadModules(),
      loadAllUsers()
    ]);
    setLoading(false);
  };

  // ===== GROUPS =====
  const loadGroups = async () => {
    try {
      const response = await fetch('/api/rbac/groups');
      const result = await response.json();
      if (result.success) {
        setGroups(result.groups);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Failed to load user groups');
    }
  };

  const handleCreateGroup = async () => {
    try {
      if (!groupForm.group_name || !groupForm.group_code) {
        toast.error('Group name and code are required');
        return;
      }

      const response = await fetch('/api/rbac/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...groupForm, created_by: currentUserId })
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Group created successfully!');
        setGroupDialogOpen(false);
        loadGroups();
        resetGroupForm();
      } else {
        toast.error(result.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    }
  };

  const handleUpdateGroup = async () => {
    try {
      if (!editingGroup) return;

      const response = await fetch('/api/rbac/groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingGroup.id,
          ...groupForm,
          updated_by: currentUserId
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Group updated successfully!');
        setGroupDialogOpen(false);
        loadGroups();
        setEditingGroup(null);
        resetGroupForm();
      } else {
        toast.error(result.error || 'Failed to update group');
      }
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('Failed to update group');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This will remove all associated permissions and memberships.')) {
      return;
    }

    try {
      const response = await fetch(`/api/rbac/groups?id=${groupId}&deleted_by=${currentUserId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Group deleted successfully!');
        loadGroups();
      } else {
        toast.error(result.error || 'Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  const resetGroupForm = () => {
    setGroupForm({
      group_name: '',
      group_code: '',
      description: '',
      is_active: true
    });
  };

  // ===== MODULES =====
  const loadModules = async () => {
    try {
      const response = await fetch('/api/rbac/modules');
      const result = await response.json();
      if (result.success) {
        setModules(result.modules);
      }
    } catch (error) {
      console.error('Error loading modules:', error);
      toast.error('Failed to load modules');
    }
  };

  // ===== PERMISSIONS =====
  const loadGroupPermissions = async (groupId: string) => {
    try {
      const response = await fetch(`/api/rbac/access?group_id=${groupId}`);
      const result = await response.json();
      if (result.success) {
        setGroupPermissions(result.access);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  };

  const handleOpenPermissions = async (group: UserGroup) => {
    setSelectedGroup(group);
    await loadGroupPermissions(group.id);
    setPermissionsDialogOpen(true);
  };

  const handleTogglePermission = async (moduleId: string, permission: string, currentValue: boolean) => {
    try {
      if (!selectedGroup) return;

      const response = await fetch('/api/rbac/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: selectedGroup.id,
          module_id: moduleId,
          [permission]: !currentValue,
          granted_by: currentUserId
        })
      });

      const result = await response.json();
      if (result.success) {
        await loadGroupPermissions(selectedGroup.id);
        toast.success('Permission updated!');
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Failed to update permission');
    }
  };

  // ===== MEMBERS =====
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

  const loadGroupMembers = async (groupId: string) => {
    try {
      const response = await fetch(`/api/rbac/members?group_id=${groupId}`);
      const result = await response.json();
      if (result.success) {
        const memberIds = result.memberships.map((m: any) => m.user_id);
        setGroupMembers(memberIds);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const handleOpenMembers = async (group: UserGroup) => {
    setSelectedGroup(group);
    await loadGroupMembers(group.id);
    setMembersDialogOpen(true);
  };

  const handleToggleMember = async (userId: string, isCurrentlyMember: boolean) => {
    try {
      if (!selectedGroup) return;

      if (isCurrentlyMember) {
        // Remove member
        const membership = groupMembers.find(m => m === userId);
        if (membership) {
          await fetch(`/api/rbac/members?id=${membership}&removed_by=${currentUserId}`, {
            method: 'DELETE'
          });
        }
      } else {
        // Add member
        await fetch('/api/rbac/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            group_id: selectedGroup.id,
            assigned_by: currentUserId
          })
        });
      }

      await loadGroupMembers(selectedGroup.id);
      toast.success(isCurrentlyMember ? 'User removed from group' : 'User added to group');
    } catch (error) {
      console.error('Error updating membership:', error);
      toast.error('Failed to update membership');
    }
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
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">RBAC Management</h1>
                <p className="text-slate-600 mt-1">Role-Based Access Control - Groups, Modules & Permissions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">About RBAC System</h3>
                <p className="text-sm text-blue-800">
                  This system allows fine-grained control over user permissions. Users are assigned to groups,
                  and groups are granted specific permissions (view, create, edit, delete, admin) for each module.
                  Users inherit all permissions from their assigned groups.
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
                  <p className="text-sm font-medium text-slate-600">User Groups</p>
                  <p className="text-2xl font-bold text-slate-900">{groups.length}</p>
                </div>
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">System Modules</p>
                  <p className="text-2xl font-bold text-slate-900">{modules.length}</p>
                </div>
                <Grid3x3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Users</p>
                  <p className="text-2xl font-bold text-slate-900">{allUsers.length}</p>
                </div>
                <UserPlus className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Groups</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {groups.filter(g => g.is_active).length}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="groups" className="gap-2">
              <Users className="h-4 w-4" />
              User Groups
            </TabsTrigger>
            <TabsTrigger value="modules" className="gap-2">
              <Grid3x3 className="h-4 w-4" />
              System Modules
            </TabsTrigger>
          </TabsList>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Groups ({groups.length})</CardTitle>
                    <CardDescription>Manage user groups and their permissions</CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingGroup(null);
                      resetGroupForm();
                      setGroupDialogOpen(true);
                    }}
                    className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4" />
                    Create Group
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-slate-500">Loading...</div>
                ) : groups.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-500 mb-4">No user groups yet</p>
                    <Button onClick={() => setGroupDialogOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create First Group
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groups.map((group) => (
                      <Card key={group.id} className="border-2 hover:border-indigo-300 transition-colors">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-slate-900 text-lg">{group.group_name}</h3>
                                  <Badge variant="outline" className="text-xs">{group.group_code}</Badge>
                                  {group.is_active ? (
                                    <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>
                                  ) : (
                                    <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-slate-600">{group.description || 'No description'}</p>
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
                                Members
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenPermissions(group)}
                                className="gap-2"
                              >
                                <Lock className="h-4 w-4" />
                                Permissions
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingGroup(group);
                                  setGroupForm({
                                    group_name: group.group_name,
                                    group_code: group.group_code,
                                    description: group.description || '',
                                    is_active: group.is_active
                                  });
                                  setGroupDialogOpen(true);
                                }}
                                className="gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteGroup(group.id)}
                                className="gap-2 text-red-600 hover:text-red-700"
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
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>System Modules ({modules.length})</CardTitle>
                    <CardDescription>System features and pages that can be controlled</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-slate-500">Loading...</div>
                ) : modules.length === 0 ? (
                  <div className="text-center py-12">
                    <Grid3x3 className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-500">No modules configured yet. Run database-rbac-system.sql to create default modules.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {modules.map((module) => (
                      <Card key={module.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Grid3x3 className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-900">{module.module_name}</h4>
                              <p className="text-xs text-slate-500">{module.module_code}</p>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600">{module.description || 'No description'}</p>
                          {module.module_url && (
                            <p className="text-xs text-slate-500 mt-2">URL: {module.module_url}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Group Create/Edit Dialog */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Edit Group' : 'Create New Group'}</DialogTitle>
            <DialogDescription>
              {editingGroup ? 'Update group information' : 'Create a new user group'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="group_name">Group Name *</Label>
                <Input
                  id="group_name"
                  placeholder="e.g., Legal Officers"
                  value={groupForm.group_name}
                  onChange={(e) => setGroupForm({ ...groupForm, group_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="group_code">Group Code *</Label>
                <Input
                  id="group_code"
                  placeholder="e.g., LEGAL_OFF"
                  value={groupForm.group_code}
                  onChange={(e) => setGroupForm({ ...groupForm, group_code: e.target.value.toUpperCase() })}
                  disabled={!!editingGroup}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose of this group..."
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={groupForm.is_active}
                onChange={(e) => setGroupForm({ ...groupForm, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active" className="cursor-pointer">Active (group is available)</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}
                disabled={!groupForm.group_name || !groupForm.group_code}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {editingGroup ? 'Update' : 'Create'} Group
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setGroupDialogOpen(false);
                  setEditingGroup(null);
                  resetGroupForm();
                }}
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
            <DialogTitle>Module Permissions - {selectedGroup?.group_name}</DialogTitle>
            <DialogDescription>
              Configure permissions for each system module
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-6 gap-4 p-3 bg-slate-50 rounded-lg font-semibold text-sm">
              <div className="col-span-2">Module</div>
              <div className="text-center">View</div>
              <div className="text-center">Create</div>
              <div className="text-center">Edit</div>
              <div className="text-center">Delete</div>
            </div>

            {modules.map((module) => {
              const permission = groupPermissions.find(p => p.module_id === module.id);

              return (
                <div key={module.id} className="grid grid-cols-6 gap-4 p-3 border-2 rounded-lg">
                  <div className="col-span-2 font-medium text-slate-900 flex items-center">
                    {module.module_name}
                  </div>
                  {['can_view', 'can_create', 'can_edit', 'can_delete'].map((perm) => (
                    <div key={perm} className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={permission?.[perm as keyof GroupModuleAccess] as boolean || false}
                        onChange={() => handleTogglePermission(module.id, perm, permission?.[perm as keyof GroupModuleAccess] as boolean || false)}
                        className="rounded w-5 h-5"
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setPermissionsDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Members Dialog */}
      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Members - {selectedGroup?.group_name}</DialogTitle>
            <DialogDescription>
              Add or remove users from this group
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {allUsers.map((user) => {
              const isMember = groupMembers.includes(user.id);

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border-2 rounded-lg hover:border-slate-300"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isMember}
                      onChange={() => handleToggleMember(user.id, isMember)}
                      className="rounded"
                    />
                    <div>
                      <p className="font-medium text-slate-900">{user.full_name}</p>
                      <p className="text-sm text-slate-600">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{user.role}</Badge>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setMembersDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
