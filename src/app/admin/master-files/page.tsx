'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Save,
  Database,
  FileText,
  Scale,
  Calendar,
  Home,
  MapPin,
  Users,
  Briefcase,
  Gavel,
  Flag,
  AlertCircle,
  UserCheck,
} from 'lucide-react';

interface LookupItem {
  id: string;
  name: string;
  code?: string;
  description?: string;
  color?: string;
  firm?: string;
  title?: string;
  is_active: boolean;
  display_order: number;
}

interface LookupTable {
  name: string;
  displayName: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  tableName: string;
  fields: {
    name: boolean;
    code: boolean;
    description: boolean;
    color: boolean;
    firm: boolean;
    title: boolean;
  };
}

const LOOKUP_TABLES: LookupTable[] = [
  {
    name: 'matter_types',
    displayName: 'Matter Types',
    icon: FileText,
    description: 'Types of legal matters (Tort, Fraud, etc.)',
    tableName: 'matter_types',
    fields: { name: true, code: false, description: true, color: false, firm: false, title: false },
  },
  {
    name: 'case_categories',
    displayName: 'Case Categories',
    icon: Scale,
    description: 'Categories of cases (Civil, Criminal, etc.)',
    tableName: 'case_categories',
    fields: { name: true, code: false, description: true, color: false, firm: false, title: false },
  },
  {
    name: 'hearing_types',
    displayName: 'Hearing Types',
    icon: Calendar,
    description: 'Types of court hearings and sessions',
    tableName: 'hearing_types',
    fields: { name: true, code: false, description: true, color: false, firm: false, title: false },
  },
  {
    name: 'lease_types',
    displayName: 'Lease Types',
    icon: Home,
    description: 'Types of land leases',
    tableName: 'lease_types',
    fields: { name: true, code: false, description: true, color: false, firm: false, title: false },
  },
  {
    name: 'divisions',
    displayName: 'DLPP Divisions',
    icon: Briefcase,
    description: 'Department divisions',
    tableName: 'divisions',
    fields: { name: true, code: true, description: true, color: false, firm: false, title: false },
  },
  {
    name: 'regions',
    displayName: 'Regions',
    icon: MapPin,
    description: 'PNG provinces and regions',
    tableName: 'regions',
    fields: { name: true, code: true, description: false, color: false, firm: false, title: false },
  },
  {
    name: 'lawyers',
    displayName: 'External Lawyers',
    icon: Users,
    description: 'Law firms and external lawyers',
    tableName: 'lawyers',
    fields: { name: true, code: false, description: false, color: false, firm: true, title: false },
  },
  {
    name: 'sol_gen_officers',
    displayName: 'Sol Gen Officers',
    icon: Gavel,
    description: 'Solicitor General office personnel',
    tableName: 'sol_gen_officers',
    fields: { name: true, code: false, description: false, color: false, firm: false, title: true },
  },
  {
    name: 'order_types',
    displayName: 'Court Order Types',
    icon: Gavel,
    description: 'Types of court orders and judgments',
    tableName: 'order_types',
    fields: { name: true, code: true, description: true, color: false, firm: false, title: false },
  },
  {
    name: 'case_statuses',
    displayName: 'Case Statuses',
    icon: Flag,
    description: 'Case lifecycle statuses',
    tableName: 'case_statuses',
    fields: { name: true, code: true, description: true, color: true, firm: false, title: false },
  },
  {
    name: 'priority_levels',
    displayName: 'Priority Levels',
    icon: AlertCircle,
    description: 'Case priority levels',
    tableName: 'priority_levels',
    fields: { name: true, code: true, description: true, color: true, firm: false, title: false },
  },
  {
    name: 'action_officers',
    displayName: 'Action Officers',
    icon: UserCheck,
    description: 'Officers available for case assignment',
    tableName: 'action_officers',
    fields: { name: true, code: false, description: false, color: false, firm: false, title: true },
  },
];

export default function MasterFilesPage() {
  const [selectedTable, setSelectedTable] = useState<LookupTable>(LOOKUP_TABLES[0]);
  const [items, setItems] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LookupItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: '',
    firm: '',
    title: '',
    display_order: 0,
  });

  useEffect(() => {
    loadItems();
  }, [selectedTable]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from(selectedTable.tableName)
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: LookupItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        code: item.code || '',
        description: item.description || '',
        color: item.color || '',
        firm: item.firm || '',
        title: item.title || '',
        display_order: item.display_order,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        color: '',
        firm: '',
        title: '',
        display_order: items.length + 1,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const payload: any = {
        name: formData.name.trim(),
        display_order: formData.display_order,
        is_active: true,
      };

      if (selectedTable.fields.code) {
        // Auto-generate code from name if not provided
        payload.code = formData.code
          ? formData.code.trim().toLowerCase().replace(/\s+/g, '_')
          : formData.name.trim().toLowerCase().replace(/\s+/g, '_');
      }
      if (selectedTable.fields.description) payload.description = formData.description.trim() || null;
      if (selectedTable.fields.color) payload.color = formData.color.trim() || null;
      if (selectedTable.fields.firm) payload.firm = formData.firm.trim() || null;
      if (selectedTable.fields.title) payload.title = formData.title.trim() || null;

      if (editingItem) {
        // Update
        const { error } = await (supabase as any)
          .from(selectedTable.tableName)
          .update(payload)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Item updated successfully');
      } else {
        // Create
        payload.created_by = user?.id || null;
        const { error } = await (supabase as any)
          .from(selectedTable.tableName)
          .insert(payload);

        if (error) throw error;
        toast.success('Item created successfully');
      }

      setDialogOpen(false);
      loadItems();
    } catch (error: any) {
      console.error('Error saving item:', error);
      toast.error(error.message || 'Failed to save item');
    }
  };

  const handleToggleActive = async (item: LookupItem) => {
    try {
      const { error } = await (supabase as any)
        .from(selectedTable.tableName)
        .update({ is_active: !item.is_active })
        .eq('id', item.id);

      if (error) throw error;
      toast.success(item.is_active ? 'Item deactivated' : 'Item activated');
      loadItems();
    } catch (error) {
      console.error('Error toggling active status:', error);
      toast.error('Failed to update item');
    }
  };

  const handleDelete = async (item: LookupItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from(selectedTable.tableName)
        .delete()
        .eq('id', item.id);

      if (error) throw error;
      toast.success('Item deleted successfully');
      loadItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const Icon = selectedTable.icon;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Database className="h-8 w-8 text-emerald-600" />
              Master Files Management
            </h1>
            <p className="text-slate-600 mt-1">
              Manage all dropdown options and lookup tables
            </p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            size="lg"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-5 w-5" />
            Add New Item
          </Button>
        </div>

        {/* Table Selector */}
        <Tabs value={selectedTable.name} onValueChange={(value) => {
          const table = LOOKUP_TABLES.find(t => t.name === value);
          if (table) setSelectedTable(table);
        }}>
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-2 h-auto p-1">
            {LOOKUP_TABLES.map((table) => {
              const TableIcon = table.icon;
              return (
                <TabsTrigger
                  key={table.name}
                  value={table.name}
                  className="flex items-center gap-2 text-xs px-2 py-2"
                >
                  <TableIcon className="h-4 w-4" />
                  {table.displayName}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {LOOKUP_TABLES.map((table) => (
            <TabsContent key={table.name} value={table.name} className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {table.displayName}
                      </CardTitle>
                      <CardDescription>{table.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{items.length} items</Badge>
                      <Button onClick={() => handleOpenDialog()} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="h-4 w-4" />
                        Add New
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 mx-auto" />
                      <p className="mt-4 text-slate-600">Loading...</p>
                    </div>
                  ) : items.length === 0 ? (
                    <div className="text-center py-12">
                      <Icon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No items yet</h3>
                      <p className="text-slate-600 mb-6">Get started by adding your first item to this table</p>
                      <Button
                        onClick={() => handleOpenDialog()}
                        size="lg"
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Plus className="h-5 w-5" />
                        Add First Item
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Name</TableHead>
                          {table.fields.code && <TableHead>Code</TableHead>}
                          {table.fields.description && <TableHead>Description</TableHead>}
                          {table.fields.firm && <TableHead>Firm</TableHead>}
                          {table.fields.title && <TableHead>Title</TableHead>}
                          {table.fields.color && <TableHead>Color</TableHead>}
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-xs text-slate-500">
                              {item.display_order}
                            </TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            {table.fields.code && (
                              <TableCell>
                                <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                                  {item.code}
                                </code>
                              </TableCell>
                            )}
                            {table.fields.description && (
                              <TableCell className="text-sm text-slate-600 max-w-xs truncate">
                                {item.description}
                              </TableCell>
                            )}
                            {table.fields.firm && (
                              <TableCell className="text-sm">{item.firm}</TableCell>
                            )}
                            {table.fields.title && (
                              <TableCell className="text-sm">{item.title}</TableCell>
                            )}
                            {table.fields.color && (
                              <TableCell>
                                {item.color && (
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-4 h-4 rounded border"
                                      style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-xs">{item.color}</span>
                                  </div>
                                )}
                              </TableCell>
                            )}
                            <TableCell>
                              {item.is_active ? (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Inactive
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenDialog(item)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleActive(item)}
                                >
                                  {item.is_active ? (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(item)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit' : 'Add'} {selectedTable.displayName}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? 'Update the item details' : 'Add a new item to the lookup table'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter name"
                  autoFocus
                />
              </div>

              {selectedTable.fields.code && (
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., tort, fraud (auto-generated from name if empty)"
                  />
                </div>
              )}

              {selectedTable.fields.description && (
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description (optional)"
                    rows={2}
                  />
                </div>
              )}

              {selectedTable.fields.firm && (
                <div className="space-y-2">
                  <Label htmlFor="firm">Law Firm</Label>
                  <Input
                    id="firm"
                    value={formData.firm}
                    onChange={(e) => setFormData({ ...formData, firm: e.target.value })}
                    placeholder="e.g., Allens Linklaters PNG"
                  />
                </div>
              )}

              {selectedTable.fields.title && (
                <div className="space-y-2">
                  <Label htmlFor="title">Title/Position</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Senior Legal Officer"
                  />
                </div>
              )}

              {selectedTable.fields.color && (
                <div className="space-y-2">
                  <Label htmlFor="color">Color (for badges)</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="e.g., red, blue, green, amber"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
