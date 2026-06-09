'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Shield, Save, X, Wand2, Copy, FolderOpen, FileText, MessageSquare, Scale, DollarSign, BarChart3, Settings, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import type { Group, Module, GroupModulePermission, PermissionMatrixRow } from '@/lib/rbac-types';

// Module categories - same as Module Management page
const MODULE_CATEGORIES = [
  { value: 'case_management', label: 'Case Management', icon: FolderOpen, color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'documents', label: 'Document Management', icon: FileText, color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { value: 'communications', label: 'Communications', icon: MessageSquare, color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'legal', label: 'Legal Operations', icon: Scale, color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'finance', label: 'Finance', icon: DollarSign, color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { value: 'reporting', label: 'Reporting & Analytics', icon: BarChart3, color: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
  { value: 'administration', label: 'Administration', icon: Settings, color: 'bg-slate-100 text-slate-700 border-slate-300' },
  { value: 'property', label: 'Property & Land', icon: MapPin, color: 'bg-rose-100 text-rose-700 border-rose-300' },
];

const getCategoryInfo = (categoryValue: string) => {
  return MODULE_CATEGORIES.find(c => c.value === categoryValue) || MODULE_CATEGORIES[0];
};

// Default group templates
const DEFAULT_GROUP_TEMPLATES = [
  {
    group_name: 'Super Admin',
    description: 'Full system access including user management, configuration, and all modules. Intended for system administrators and IT staff.',
    permissionLevel: 'full'
  },
  {
    group_name: 'Manager',
    description: 'Department heads and supervisors. Can view all cases, approve actions, generate reports, and monitor team performance.',
    permissionLevel: 'manager'
  },
  {
    group_name: 'Case Officer',
    description: 'Legal officers who handle case assignments. Full case management capabilities including registration, updates, and document handling.',
    permissionLevel: 'case_officer'
  },
  {
    group_name: 'Legal Clerk',
    description: 'Support staff assisting with case processing. Can manage documents, tasks, and correspondence but limited case modification rights.',
    permissionLevel: 'legal_clerk'
  },
  {
    group_name: 'Document Clerk',
    description: 'Document management specialists. Primary focus on uploading, organizing, and tracking documents and physical files.',
    permissionLevel: 'document_clerk'
  },
  {
    group_name: 'Viewer',
    description: 'Read-only access for external observers, auditors, or consultants. Can view cases and generate reports but cannot modify any data.',
    permissionLevel: 'viewer'
  }
];

export default function GroupManagementPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [permissions, setPermissions] = useState<PermissionMatrixRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state for new/edit group
  const [isCreating, setIsCreating] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState({ group_name: '', description: '' });

  // Quick setup wizard state
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [settingUpGroups, setSettingUpGroups] = useState(false);

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

      const [groupsRes, modulesRes] = await Promise.all([
        supabase.from('groups').select('*').order('group_name'),
        supabase.from('modules').select('*').order('module_name')
      ]);

      if (groupsRes.error) throw groupsRes.error;
      if (modulesRes.error) throw modulesRes.error;

      setGroups(groupsRes.data || []);
      setModules(modulesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load groups and modules');
    } finally {
      setLoading(false);
    }
  };

  const loadGroupPermissions = async (group: Group) => {
    try {
      const { data, error } = await supabase
        .from('group_module_permissions')
        .select('*')
        .eq('group_id', group.id);

      if (error) throw error;

      const permissionsMap = new Map((data as GroupModulePermission[] || []).map(p => [p.module_id, p]));

      const matrixRows: PermissionMatrixRow[] = modules.map(module => {
        const perm = permissionsMap.get(module.id);
        return {
          module_id: module.id,
          module_name: module.module_name,
          module_key: module.module_key,
          permissions: {
            can_create: perm?.can_create || false,
            can_read: perm?.can_read || false,
            can_update: perm?.can_update || false,
            can_delete: perm?.can_delete || false,
            can_print: perm?.can_print || false,
            can_approve: perm?.can_approve || false,
            can_export: perm?.can_export || false,
          }
        };
      });

      setPermissions(matrixRows);
      setSelectedGroup(group);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast.error('Failed to load permissions');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupForm.group_name.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('groups')
        .insert({
          group_name: groupForm.group_name,
          description: groupForm.description || null
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Group created successfully');
      setGroupForm({ group_name: '', description: '' });
      setIsCreating(false);
      loadData();
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast.error(error.message || 'Failed to create group');
    }
  };

  const handleUpdateGroup = async (groupId: string) => {
    if (!groupForm.group_name.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('groups')
        .update({
          group_name: groupForm.group_name,
          description: groupForm.description || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId);

      if (error) throw error;

      toast.success('Group updated successfully');
      setEditingGroupId(null);
      setGroupForm({ group_name: '', description: '' });
      loadData();
    } catch (error: any) {
      console.error('Error updating group:', error);
      toast.error(error.message || 'Failed to update group');
    }
  };

  const startEditGroup = (group: Group) => {
    setEditingGroupId(group.id);
    setGroupForm({
      group_name: group.group_name,
      description: group.description || ''
    });
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingGroupId(null);
    setIsCreating(false);
    setGroupForm({ group_name: '', description: '' });
  };

  const handleDeleteGroup = async (group: Group) => {
    if (!confirm(`Are you sure you want to delete "${group.group_name}"? This will remove all associated permissions.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', group.id);

      if (error) throw error;

      toast.success('Group deleted successfully');
      if (selectedGroup?.id === group.id) {
        setSelectedGroup(null);
        setPermissions([]);
      }
      loadData();
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast.error(error.message || 'Failed to delete group');
    }
  };

  const togglePermission = (moduleId: string, permission: keyof PermissionMatrixRow['permissions']) => {
    setPermissions(prev => prev.map(row => {
      if (row.module_id === moduleId) {
        return {
          ...row,
          permissions: {
            ...row.permissions,
            [permission]: !row.permissions[permission]
          }
        };
      }
      return row;
    }));
  };

  const toggleAllForModule = (moduleId: string, enabled: boolean) => {
    setPermissions(prev => prev.map(row => {
      if (row.module_id === moduleId) {
        return {
          ...row,
          permissions: {
            can_create: enabled,
            can_read: enabled,
            can_update: enabled,
            can_delete: enabled,
            can_print: enabled,
            can_approve: enabled,
            can_export: enabled,
          }
        };
      }
      return row;
    }));
  };

  const savePermissions = async () => {
    if (!selectedGroup) return;

    try {
      setSaving(true);

      // Delete existing permissions
      await (supabase as any)
        .from('group_module_permissions')
        .delete()
        .eq('group_id', selectedGroup.id);

      // Insert new permissions
      const permissionsToInsert = permissions.map(row => ({
        group_id: selectedGroup.id,
        module_id: row.module_id,
        ...row.permissions
      }));

      const { error } = await (supabase as any)
        .from('group_module_permissions')
        .insert(permissionsToInsert);

      if (error) throw error;

      toast.success('Permissions saved successfully');
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      toast.error(error.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickSetup = async () => {
    if (selectedTemplates.length === 0) {
      toast.error('Please select at least one group template');
      return;
    }

    try {
      setSettingUpGroups(true);

      // Create selected groups
      for (const templateName of selectedTemplates) {
        const template = DEFAULT_GROUP_TEMPLATES.find(t => t.group_name === templateName);
        if (!template) continue;

        const { data: newGroup, error: groupError } = await (supabase as any)
          .from('groups')
          .insert({
            group_name: template.group_name,
            description: template.description
          })
          .select()
          .single();

        if (groupError) {
          console.error(`Error creating ${template.group_name}:`, groupError);
          continue;
        }

        // Apply default permissions based on template level
        await applyTemplatePermissions(newGroup.id, template.permissionLevel, modules);
      }

      toast.success(`Successfully created ${selectedTemplates.length} group(s)!`);
      setShowQuickSetup(false);
      setSelectedTemplates([]);
      loadData();
    } catch (error: any) {
      console.error('Error in quick setup:', error);
      toast.error(error.message || 'Failed to create groups');
    } finally {
      setSettingUpGroups(false);
    }
  };

  const applyTemplatePermissions = async (groupId: string, level: string, modules: Module[]) => {
    const permissionsToInsert = modules.map(module => {
      const moduleKey = module.module_key;

      switch (level) {
        case 'full': // Super Admin - all permissions
          return {
            group_id: groupId,
            module_id: module.id,
            can_create: true,
            can_read: true,
            can_update: true,
            can_delete: true,
            can_print: true,
            can_approve: true,
            can_export: true
          };

        case 'manager': // Manager - view all, approve all, selective modify
          return {
            group_id: groupId,
            module_id: module.id,
            can_create: ['tasks', 'correspondence', 'notifications'].includes(moduleKey),
            can_read: !['user_management', 'groups_management'].includes(moduleKey),
            can_update: ['case_management', 'tasks', 'calendar', 'correspondence', 'compliance'].includes(moduleKey),
            can_delete: false,
            can_print: true,
            can_approve: true,
            can_export: true
          };

        case 'case_officer': // Case Officer - full case management
          return {
            group_id: groupId,
            module_id: module.id,
            can_create: ['case_management', 'documents', 'tasks', 'calendar', 'correspondence', 'court_filings', 'directions_hearings', 'compliance', 'file_requests', 'notifications'].includes(moduleKey),
            can_read: ['dashboard', 'case_management', 'documents', 'tasks', 'calendar', 'correspondence', 'lawyers', 'land_parcels', 'court_filings', 'directions_hearings', 'compliance', 'litigation_costs', 'reports', 'notifications', 'file_requests', 'internal_officers'].includes(moduleKey),
            can_update: ['case_management', 'documents', 'tasks', 'calendar', 'correspondence', 'court_filings', 'directions_hearings', 'compliance', 'file_requests'].includes(moduleKey),
            can_delete: ['tasks', 'correspondence', 'file_requests'].includes(moduleKey),
            can_print: ['case_management', 'documents', 'court_filings', 'reports', 'calendar'].includes(moduleKey),
            can_approve: ['court_filings', 'documents', 'compliance'].includes(moduleKey),
            can_export: ['reports', 'case_management', 'documents'].includes(moduleKey)
          };

        case 'legal_clerk': // Legal Clerk - document & task support
          return {
            group_id: groupId,
            module_id: module.id,
            can_create: ['documents', 'tasks', 'correspondence', 'file_requests', 'calendar'].includes(moduleKey),
            can_read: ['dashboard', 'case_management', 'documents', 'tasks', 'calendar', 'correspondence', 'lawyers', 'land_parcels', 'directions_hearings', 'notifications', 'file_requests', 'internal_officers'].includes(moduleKey),
            can_update: ['documents', 'tasks', 'correspondence', 'file_requests', 'calendar'].includes(moduleKey),
            can_delete: ['tasks', 'correspondence'].includes(moduleKey),
            can_print: ['documents', 'case_management', 'calendar'].includes(moduleKey),
            can_approve: false,
            can_export: ['documents', 'tasks'].includes(moduleKey)
          };

        case 'document_clerk': // Document Clerk - document focused
          return {
            group_id: groupId,
            module_id: module.id,
            can_create: ['documents', 'file_requests'].includes(moduleKey),
            can_read: ['dashboard', 'case_management', 'documents', 'tasks', 'file_requests', 'notifications'].includes(moduleKey),
            can_update: ['documents', 'file_requests'].includes(moduleKey),
            can_delete: false,
            can_print: ['documents', 'case_management'].includes(moduleKey),
            can_approve: false,
            can_export: moduleKey === 'documents'
          };

        case 'viewer': // Viewer - read only
          return {
            group_id: groupId,
            module_id: module.id,
            can_create: false,
            can_read: ['dashboard', 'case_management', 'documents', 'calendar', 'reports', 'land_parcels', 'notifications'].includes(moduleKey),
            can_update: false,
            can_delete: false,
            can_print: ['case_management', 'reports', 'documents'].includes(moduleKey),
            can_approve: false,
            can_export: moduleKey === 'reports'
          };

        default:
          return {
            group_id: groupId,
            module_id: module.id,
            can_create: false,
            can_read: false,
            can_update: false,
            can_delete: false,
            can_print: false,
            can_approve: false,
            can_export: false
          };
      }
    });

    // Insert permissions
    const { error } = await (supabase as any)
      .from('group_module_permissions')
      .insert(permissionsToInsert);

    if (error) {
      console.error('Error applying template permissions:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading groups...</p>
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
            <h1 className="text-3xl font-bold text-slate-900">Group Management</h1>
            <p className="text-slate-600 mt-1">Manage user groups and module permissions</p>
          </div>
          <div className="flex gap-3">
            {groups.length === 0 && (
              <Button
                onClick={() => setShowQuickSetup(true)}
                size="lg"
                variant="outline"
                className="gap-2"
              >
                <Wand2 className="h-5 w-5" />
                Quick Setup
              </Button>
            )}
            <Button
              onClick={() => {
                setIsCreating(true);
                setEditingGroupId(null);
                setGroupForm({ group_name: '', description: '' });
              }}
              size="lg"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-5 w-5" />
              Create New Group
            </Button>
          </div>
        </div>

        {/* Quick Setup Banner */}
        {groups.length === 0 && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <Wand2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-emerald-900 mb-1">
                    Welcome! Let's set up your first groups
                  </h3>
                  <p className="text-sm text-emerald-700 mb-3">
                    You can use our Quick Setup wizard to create common group templates, or create your own custom groups from scratch.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowQuickSetup(true)}
                      variant="default"
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      Use Quick Setup
                    </Button>
                    <Button
                      onClick={() => {
                        setIsCreating(true);
                        setGroupForm({ group_name: '', description: '' });
                      }}
                      variant="outline"
                      className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Custom Group
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Panel: Groups List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Groups</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (isCreating) {
                        cancelEdit();
                      } else {
                        setIsCreating(true);
                        setEditingGroupId(null);
                        setGroupForm({ group_name: '', description: '' });
                      }
                    }}
                  >
                    {isCreating ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                    {isCreating ? 'Cancel' : 'New Group'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isCreating && (
                  <div className="mb-4 p-4 border rounded-lg space-y-3 bg-slate-50">
                    <div>
                      <Label>Group Name *</Label>
                      <Input
                        value={groupForm.group_name}
                        onChange={(e) => setGroupForm({ ...groupForm, group_name: e.target.value })}
                        placeholder="e.g., Case Officer"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={groupForm.description}
                        onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                        placeholder="Describe the group's role..."
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleCreateGroup} className="w-full">
                      <Plus className="h-4 w-4 mr-1" />
                      Create Group
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  {groups.map(group => (
                    <div
                      key={group.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        selectedGroup?.id === group.id
                          ? 'bg-emerald-50 border-emerald-600'
                          : editingGroupId === group.id
                          ? 'bg-blue-50 border-blue-300'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {editingGroupId === group.id ? (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs">Group Name *</Label>
                            <Input
                              value={groupForm.group_name}
                              onChange={(e) => setGroupForm({ ...groupForm, group_name: e.target.value })}
                              placeholder="Group name"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Description</Label>
                            <Textarea
                              value={groupForm.description}
                              onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                              placeholder="Description..."
                              rows={2}
                              className="mt-1"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateGroup(group.id)}
                              className="flex-1"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEdit}
                              className="flex-1"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer"
                          onClick={() => loadGroupPermissions(group)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-slate-900">{group.group_name}</div>
                              {group.description && (
                                <div className="text-xs text-slate-600 mt-1">{group.description}</div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditGroup(group);
                                }}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteGroup(group);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {groups.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      No groups found. Create one to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Permission Matrix */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Permission Matrix
                    </CardTitle>
                    <CardDescription>
                      {selectedGroup ? `Configuring permissions for: ${selectedGroup.group_name}` : 'Select a group to configure permissions'}
                    </CardDescription>
                  </div>
                  {selectedGroup && (
                    <Button onClick={savePermissions} disabled={saving}>
                      <Save className="h-4 w-4 mr-1" />
                      {saving ? 'Saving...' : 'Save Permissions'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedGroup ? (
                  <div className="space-y-6">
                    {MODULE_CATEGORIES.map((category) => {
                      const categoryPermissions = permissions.filter(p => {
                        const foundModule = modules.find(m => m.id === p.module_id);
                        return (foundModule as any)?.category === category.value;
                      });

                      if (categoryPermissions.length === 0) return null;

                      const CategoryIcon = category.icon;

                      return (
                        <div key={category.value} className="space-y-2">
                          <div className={`flex items-center gap-2 p-2 rounded-lg border ${category.color}`}>
                            <CategoryIcon className="h-4 w-4" />
                            <h4 className="font-semibold text-sm">{category.label}</h4>
                            <Badge variant="outline" className="ml-auto text-xs">{categoryPermissions.length}</Badge>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b bg-slate-50">
                                  <th className="text-left py-2 px-2 font-semibold text-xs">Module</th>
                                  <th className="text-center py-2 px-2 font-semibold text-xs">Create</th>
                                  <th className="text-center py-2 px-2 font-semibold text-xs">Read</th>
                                  <th className="text-center py-2 px-2 font-semibold text-xs">Update</th>
                                  <th className="text-center py-2 px-2 font-semibold text-xs">Delete</th>
                                  <th className="text-center py-2 px-2 font-semibold text-xs">Print</th>
                                  <th className="text-center py-2 px-2 font-semibold text-xs">Approve</th>
                                  <th className="text-center py-2 px-2 font-semibold text-xs">Export</th>
                                  <th className="text-center py-2 px-2 font-semibold text-xs">All</th>
                                </tr>
                              </thead>
                              <tbody>
                                {categoryPermissions.map(row => {
                                  const allEnabled = Object.values(row.permissions).every(v => v);
                                  return (
                                    <tr key={row.module_id} className="border-b hover:bg-slate-50">
                                      <td className="py-2 px-2 font-medium text-xs">{row.module_name}</td>
                                      <td className="text-center py-2 px-2">
                                        <Switch
                                          checked={row.permissions.can_create}
                                          onCheckedChange={() => togglePermission(row.module_id, 'can_create')}
                                        />
                                      </td>
                                      <td className="text-center py-2 px-2">
                                        <Switch
                                          checked={row.permissions.can_read}
                                          onCheckedChange={() => togglePermission(row.module_id, 'can_read')}
                                        />
                                      </td>
                                      <td className="text-center py-2 px-2">
                                        <Switch
                                          checked={row.permissions.can_update}
                                          onCheckedChange={() => togglePermission(row.module_id, 'can_update')}
                                        />
                                      </td>
                                      <td className="text-center py-2 px-2">
                                        <Switch
                                          checked={row.permissions.can_delete}
                                          onCheckedChange={() => togglePermission(row.module_id, 'can_delete')}
                                        />
                                      </td>
                                      <td className="text-center py-2 px-2">
                                        <Switch
                                          checked={row.permissions.can_print}
                                          onCheckedChange={() => togglePermission(row.module_id, 'can_print')}
                                        />
                                      </td>
                                      <td className="text-center py-2 px-2">
                                        <Switch
                                          checked={row.permissions.can_approve}
                                          onCheckedChange={() => togglePermission(row.module_id, 'can_approve')}
                                        />
                                      </td>
                                      <td className="text-center py-2 px-2">
                                        <Switch
                                          checked={row.permissions.can_export}
                                          onCheckedChange={() => togglePermission(row.module_id, 'can_export')}
                                        />
                                      </td>
                                      <td className="text-center py-2 px-2">
                                        <Switch
                                          checked={allEnabled}
                                          onCheckedChange={(checked) => toggleAllForModule(row.module_id, checked)}
                                        />
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Shield className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>Select a group from the left to configure its permissions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Quick Setup Dialog */}
      <Dialog open={showQuickSetup} onOpenChange={setShowQuickSetup}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Wand2 className="h-6 w-6 text-emerald-600" />
              Quick Setup - Create Default Groups
            </DialogTitle>
            <DialogDescription>
              Select which groups you'd like to create. Each group comes with pre-configured permissions that you can customize later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm font-medium text-slate-700">
              Select the groups you need (you can create more custom groups later):
            </p>

            <div className="grid gap-3">
              {DEFAULT_GROUP_TEMPLATES.map((template) => (
                <Card
                  key={template.group_name}
                  className={`cursor-pointer transition-all ${
                    selectedTemplates.includes(template.group_name)
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'hover:border-slate-300'
                  }`}
                  onClick={() => {
                    setSelectedTemplates(prev =>
                      prev.includes(template.group_name)
                        ? prev.filter(name => name !== template.group_name)
                        : [...prev, template.group_name]
                    );
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedTemplates.includes(template.group_name)
                              ? 'bg-emerald-600 border-emerald-600'
                              : 'border-slate-300'
                          }`}
                        >
                          {selectedTemplates.includes(template.group_name) && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900">{template.group_name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {template.permissionLevel === 'full' && 'Full Access'}
                            {template.permissionLevel === 'manager' && 'Supervisor'}
                            {template.permissionLevel === 'case_officer' && 'Operational'}
                            {template.permissionLevel === 'legal_clerk' && 'Support'}
                            {template.permissionLevel === 'document_clerk' && 'Limited'}
                            {template.permissionLevel === 'viewer' && 'Read-Only'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{template.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> After creation, you can customize each group's permissions in the Permission Matrix.
                You can also create additional custom groups anytime.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowQuickSetup(false);
                setSelectedTemplates([]);
              }}
              disabled={settingUpGroups}
            >
              Cancel
            </Button>
            <Button
              onClick={handleQuickSetup}
              disabled={selectedTemplates.length === 0 || settingUpGroups}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {settingUpGroups ? (
                <>Creating Groups...</>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Create {selectedTemplates.length} Group{selectedTemplates.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
