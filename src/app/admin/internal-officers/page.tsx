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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  UserCheck,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Save,
  Search,
  Users,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Hash,
  AlertCircle,
} from 'lucide-react';

interface Officer {
  id: string;
  name: string;
  title: string;
  department: string;
  email?: string | null;
  phone?: string | null;
  office_location?: string | null;
  employee_id?: string | null;
  is_active: boolean;
  display_order: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

const DEPARTMENTS = [
  'Legal Services Division',
  'Lands Division',
  'Physical Planning Division',
  'Survey and Mapping Division',
  'Valuation Division',
  'Land Registration Division',
  'Customary Land Division',
  'Corporate Services Division',
  'Policy and Planning Division',
  'Other',
];

const TITLES = [
  'Director',
  'Manager',
  'Senior Legal Officer',
  'Legal Officer',
  'Action Officer',
  'Para-Legal Officer',
  'Assistant Legal Officer',
  'Case Officer',
  'Administrative Officer',
  'Other',
];

export default function InternalOfficersPage() {
  const [loading, setLoading] = useState(true);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [filteredOfficers, setFilteredOfficers] = useState<Officer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null);
  const [officerToDelete, setOfficerToDelete] = useState<Officer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    department: '',
    email: '',
    phone: '',
    office_location: '',
    employee_id: '',
    notes: '',
    display_order: 0,
  });

  useEffect(() => {
    loadOfficers();
  }, []);

  useEffect(() => {
    filterOfficers();
  }, [searchQuery, officers]);

  const loadOfficers = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('action_officers')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setOfficers(data || []);
    } catch (error) {
      console.error('Error loading officers:', error);
      toast.error('Failed to load officers');
    } finally {
      setLoading(false);
    }
  };

  const filterOfficers = () => {
    if (!searchQuery) {
      setFilteredOfficers(officers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = officers.filter(
      (officer) =>
        officer.name.toLowerCase().includes(query) ||
        officer.title.toLowerCase().includes(query) ||
        officer.department.toLowerCase().includes(query) ||
        officer.email?.toLowerCase().includes(query) ||
        officer.employee_id?.toLowerCase().includes(query)
    );
    setFilteredOfficers(filtered);
  };

  const handleOpenDialog = (officer?: Officer) => {
    if (officer) {
      setEditingOfficer(officer);
      setFormData({
        name: officer.name,
        title: officer.title,
        department: officer.department,
        email: officer.email || '',
        phone: officer.phone || '',
        office_location: officer.office_location || '',
        employee_id: officer.employee_id || '',
        notes: officer.notes || '',
        display_order: officer.display_order,
      });
    } else {
      setEditingOfficer(null);
      setFormData({
        name: '',
        title: '',
        department: '',
        email: '',
        phone: '',
        office_location: '',
        employee_id: '',
        notes: '',
        display_order: officers.length + 1,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.title.trim() || !formData.department.trim()) {
      toast.error('Name, Title, and Department are required');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const payload: any = {
        name: formData.name.trim(),
        title: formData.title.trim(),
        department: formData.department.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        office_location: formData.office_location.trim() || null,
        employee_id: formData.employee_id.trim() || null,
        notes: formData.notes.trim() || null,
        display_order: formData.display_order,
        is_active: true,
      };

      if (editingOfficer) {
        // Update
        payload.updated_by = user?.id || null;
        const { error } = await (supabase as any)
          .from('action_officers')
          .update(payload)
          .eq('id', editingOfficer.id);

        if (error) throw error;
        toast.success('Officer updated successfully');
      } else {
        // Create
        payload.created_by = user?.id || null;
        const { error } = await (supabase as any)
          .from('action_officers')
          .insert(payload);

        if (error) throw error;
        toast.success('Officer added successfully');
      }

      setDialogOpen(false);
      loadOfficers();
    } catch (error: any) {
      console.error('Error saving officer:', error);
      if (error.code === '23505') {
        toast.error('Employee ID already exists');
      } else {
        toast.error(error.message || 'Failed to save officer');
      }
    }
  };

  const handleToggleActive = async (officer: Officer) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from('action_officers')
        .update({
          is_active: !officer.is_active,
          updated_by: user?.id || null,
        })
        .eq('id', officer.id);

      if (error) throw error;
      toast.success(officer.is_active ? 'Officer deactivated' : 'Officer activated');
      loadOfficers();
    } catch (error) {
      console.error('Error toggling active status:', error);
      toast.error('Failed to update officer');
    }
  };

  const handleDelete = async () => {
    if (!officerToDelete) return;

    try {
      const { error } = await (supabase as any)
        .from('action_officers')
        .delete()
        .eq('id', officerToDelete.id);

      if (error) throw error;
      toast.success('Officer deleted successfully');
      setDeleteDialogOpen(false);
      setOfficerToDelete(null);
      loadOfficers();
    } catch (error) {
      console.error('Error deleting officer:', error);
      toast.error('Failed to delete officer');
    }
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Internal Officers Management</h1>
              <p className="text-slate-600 mt-1">
                Manage DLPP internal staff and officers
              </p>
            </div>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            size="lg"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-5 w-5" />
            Add New Officer
          </Button>
        </div>

        {/* Info Card */}
        <Card className="border-2 border-emerald-200 bg-emerald-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-emerald-900 mb-2">Officer Management</h3>
                <p className="text-sm text-emerald-800">
                  Add and manage internal DLPP officers who can be assigned to cases and tasks.
                  Officers added here will appear in the "Assign To" dropdowns throughout the system.
                  You can edit names, titles, departments, and contact information at any time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Officers</p>
                  <p className="text-2xl font-bold text-slate-900">{officers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {officers.filter((o) => o.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name, title, department, or employee ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Officers Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Internal Officers</CardTitle>
                <CardDescription>
                  Manage officer information, titles, and departments
                </CardDescription>
              </div>
              <Badge variant="outline">{filteredOfficers.length} officers</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 mx-auto" />
                <p className="mt-4 text-slate-600">Loading officers...</p>
              </div>
            ) : filteredOfficers.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {officers.length === 0 ? 'No officers yet' : 'No officers found'}
                </h3>
                <p className="text-slate-600 mb-6">
                  {officers.length === 0
                    ? 'Get started by adding your first internal officer'
                    : 'Try adjusting your search criteria'}
                </p>
                {officers.length === 0 && (
                  <Button
                    onClick={() => handleOpenDialog()}
                    size="lg"
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="h-5 w-5" />
                    Add First Officer
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOfficers.map((officer) => (
                      <TableRow key={officer.id}>
                        <TableCell className="font-mono text-xs text-slate-500">
                          {officer.display_order}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{officer.name}</div>
                          {officer.office_location && (
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {officer.office_location}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-slate-400" />
                            <span className="text-sm">{officer.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {officer.department}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {officer.email && (
                              <div className="flex items-center gap-1 text-xs text-slate-600">
                                <Mail className="h-3 w-3" />
                                {officer.email}
                              </div>
                            )}
                            {officer.phone && (
                              <div className="flex items-center gap-1 text-xs text-slate-600">
                                <Phone className="h-3 w-3" />
                                {officer.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {officer.employee_id && (
                            <div className="flex items-center gap-1">
                              <Hash className="h-3 w-3 text-slate-400" />
                              <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {officer.employee_id}
                              </code>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {officer.is_active ? (
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
                              onClick={() => handleOpenDialog(officer)}
                              title="Edit officer"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(officer)}
                              title={officer.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {officer.is_active ? (
                                <XCircle className="h-4 w-4 text-red-600" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setOfficerToDelete(officer);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete officer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                {editingOfficer ? 'Edit Officer' : 'Add New Officer'}
              </DialogTitle>
              <DialogDescription>
                {editingOfficer
                  ? 'Update officer information and contact details'
                  : 'Add a new internal officer to the system'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Basic Information
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., John Smith"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Select
                      value={formData.title}
                      onValueChange={(value) => setFormData({ ...formData, title: value })}
                    >
                      <SelectTrigger id="title">
                        <SelectValue placeholder="Select title" />
                      </SelectTrigger>
                      <SelectContent>
                        {TITLES.map((title) => (
                          <SelectItem key={title} value={title}>
                            {title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData({ ...formData, department: value })}
                    >
                      <SelectTrigger id="department">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Information
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john.smith@lands.gov.pg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+675 320 1234"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="office_location">Office Location</Label>
                    <Input
                      id="office_location"
                      value={formData.office_location}
                      onChange={(e) =>
                        setFormData({ ...formData, office_location: e.target.value })
                      }
                      placeholder="e.g., Building A, Room 201"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Additional Details
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="employee_id">Employee ID</Label>
                    <Input
                      id="employee_id"
                      value={formData.employee_id}
                      onChange={(e) =>
                        setFormData({ ...formData, employee_id: e.target.value })
                      }
                      placeholder="e.g., EMP-2024-001"
                    />
                    <p className="text-xs text-slate-500">Must be unique if provided</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          display_order: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                    <p className="text-xs text-slate-500">Lower numbers appear first</p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional information about this officer..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Save className="h-4 w-4" />
                {editingOfficer ? 'Update Officer' : 'Add Officer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Delete Officer
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{officerToDelete?.name}</strong>?
                <br />
                <br />
                This action cannot be undone. The officer will be permanently removed from the
                system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Yes, Delete Officer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
