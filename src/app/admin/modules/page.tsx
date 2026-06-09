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
import { Plus, Edit, Trash2, Save, X, Package, FolderOpen, FileText, MessageSquare, Scale, DollarSign, BarChart3, Settings, MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { Module } from '@/lib/rbac-types';

// Module categories with icons and colors
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

export default function ModuleManagementPage() {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState({
    module_name: '',
    module_key: '',
    description: '',
    category: 'case_management'
  });

  useEffect(() => {
    checkAuth();
    loadModules();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/login');
  };

  const loadModules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('module_name');

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error('Error loading modules:', error);
      toast.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModule = async () => {
    if (!moduleForm.module_name.trim() || !moduleForm.module_key.trim()) {
      toast.error('Module name and key are required');
      return;
    }

    // Convert module_key to lowercase with underscores
    const sanitizedKey = moduleForm.module_key
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_');

    try {
      const { error } = await (supabase as any)
        .from('modules')
        .insert({
          module_name: moduleForm.module_name,
          module_key: sanitizedKey,
          description: moduleForm.description || null,
          category: moduleForm.category
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('A module with this key already exists');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Module created successfully');
      setModuleForm({ module_name: '', module_key: '', description: '', category: 'case_management' });
      setIsCreating(false);
      loadModules();
    } catch (error: any) {
      console.error('Error creating module:', error);
      toast.error(error.message || 'Failed to create module');
    }
  };

  const handleUpdateModule = async (moduleId: string) => {
    if (!moduleForm.module_name.trim() || !moduleForm.module_key.trim()) {
      toast.error('Module name and key are required');
      return;
    }

    const sanitizedKey = moduleForm.module_key
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_');

    try {
      const { error } = await (supabase as any)
        .from('modules')
        .update({
          module_name: moduleForm.module_name,
          module_key: sanitizedKey,
          description: moduleForm.description || null,
          category: moduleForm.category
        })
        .eq('id', moduleId);

      if (error) throw error;

      toast.success('Module updated successfully');
      setEditingModuleId(null);
      setModuleForm({ module_name: '', module_key: '', description: '', category: 'case_management' });
      loadModules();
    } catch (error: any) {
      console.error('Error updating module:', error);
      toast.error(error.message || 'Failed to update module');
    }
  };

  const handleDeleteModule = async (module: Module) => {
    if (!confirm(`Are you sure you want to delete "${module.module_name}"? This will remove all associated permissions.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', module.id);

      if (error) throw error;

      toast.success('Module deleted successfully');
      loadModules();
    } catch (error: any) {
      console.error('Error deleting module:', error);
      toast.error(error.message || 'Failed to delete module');
    }
  };

  const startEditModule = (module: Module) => {
    setEditingModuleId(module.id);
    setModuleForm({
      module_name: module.module_name,
      module_key: module.module_key,
      description: module.description || '',
      category: (module as any).category || 'case_management'
    });
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingModuleId(null);
    setIsCreating(false);
    setModuleForm({ module_name: '', module_key: '', description: '', category: 'case_management' });
  };

  // Group modules by category
  const groupedModules = modules.reduce((acc, module) => {
    const category = (module as any).category || 'case_management';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading modules...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Module Management</h1>
          <p className="text-slate-600 mt-1">Manage system modules and features</p>
        </div>

        {/* Module List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>System Modules</CardTitle>
                <CardDescription>
                  Modules represent different features of the system that can be assigned permissions
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  if (isCreating) {
                    cancelEdit();
                  } else {
                    setIsCreating(true);
                    setEditingModuleId(null);
                    setModuleForm({ module_name: '', module_key: '', description: '', category: 'case_management' });
                  }
                }}
                size="sm"
              >
                {isCreating ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                {isCreating ? 'Cancel' : 'New Module'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isCreating && (
              <div className="mb-6 p-4 border rounded-lg space-y-3 bg-slate-50">
                <div>
                  <Label>Module Name *</Label>
                  <Input
                    value={moduleForm.module_name}
                    onChange={(e) => setModuleForm({ ...moduleForm, module_name: e.target.value })}
                    placeholder="e.g., Case Management"
                  />
                </div>
                <div>
                  <Label>Module Key *</Label>
                  <Input
                    value={moduleForm.module_key}
                    onChange={(e) => setModuleForm({ ...moduleForm, module_key: e.target.value })}
                    placeholder="e.g., case_management"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Lowercase letters, numbers, and underscores only. Will be automatically formatted.
                  </p>
                </div>
                <div>
                  <Label>Category *</Label>
                  <Select value={moduleForm.category} onValueChange={(value) => setModuleForm({ ...moduleForm, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODULE_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {cat.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={moduleForm.description}
                    onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                    placeholder="Describe what this module does..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleCreateModule} className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Module
                </Button>
              </div>
            )}

            <div className="space-y-6">
              {modules.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>No modules found. Create one to get started.</p>
                </div>
              ) : (
                MODULE_CATEGORIES.map((category) => {
                  const categoryModules = groupedModules[category.value] || [];
                  if (categoryModules.length === 0) return null;

                  const CategoryIcon = category.icon;

                  return (
                    <div key={category.value} className="space-y-3">
                      <div className={`flex items-center gap-2 p-2 rounded-lg border ${category.color}`}>
                        <CategoryIcon className="h-5 w-5" />
                        <h3 className="font-semibold">{category.label}</h3>
                        <Badge variant="outline" className="ml-auto">{categoryModules.length}</Badge>
                      </div>

                      <div className="space-y-2 pl-4">
                        {categoryModules.map(module => (
                          <div
                            key={module.id}
                            className={`p-4 rounded-lg border transition-colors ${
                              editingModuleId === module.id
                                ? 'bg-blue-50 border-blue-300'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            {editingModuleId === module.id ? (
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-xs">Module Name *</Label>
                                  <Input
                                    value={moduleForm.module_name}
                                    onChange={(e) => setModuleForm({ ...moduleForm, module_name: e.target.value })}
                                    placeholder="Module name"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Module Key *</Label>
                                  <Input
                                    value={moduleForm.module_key}
                                    onChange={(e) => setModuleForm({ ...moduleForm, module_key: e.target.value })}
                                    placeholder="module_key"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Category *</Label>
                                  <Select value={moduleForm.category} onValueChange={(value) => setModuleForm({ ...moduleForm, category: value })}>
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {MODULE_CATEGORIES.map((cat) => {
                                        const Icon = cat.icon;
                                        return (
                                          <SelectItem key={cat.value} value={cat.value}>
                                            <div className="flex items-center gap-2">
                                              <Icon className="h-4 w-4" />
                                              {cat.label}
                                            </div>
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs">Description</Label>
                                  <Textarea
                                    value={moduleForm.description}
                                    onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                                    placeholder="Description..."
                                    rows={2}
                                    className="mt-1"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateModule(module.id)}
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
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-emerald-600" />
                                    <h3 className="font-semibold text-lg">{module.module_name}</h3>
                                    <Badge variant="outline" className="text-xs font-mono">
                                      {module.module_key}
                                    </Badge>
                                  </div>
                                  {module.description && (
                                    <p className="text-sm text-slate-600 mt-2 ml-7">{module.description}</p>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => startEditModule(module)}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteModule(module)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-900 mb-2">About Modules</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Modules represent different features or sections of your system</li>
              <li>• Each module can have 7 types of permissions: Create, Read, Update, Delete, Print, Approve, Export</li>
              <li>• Groups are assigned permissions for specific modules</li>
              <li>• Module keys should be unique and use lowercase_with_underscores format</li>
              <li>• Deleting a module will remove all associated group permissions</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
