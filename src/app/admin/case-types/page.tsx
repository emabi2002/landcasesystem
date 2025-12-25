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
import { FileText, Plus, Edit, Trash2, ArrowLeft, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface CaseType {
  id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  created_at: string;
  usage_count?: number;
}

export default function CaseTypesPage() {
  const router = useRouter();
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<CaseType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true
  });

  // Predefined case types
  const predefinedTypes = [
    { name: 'Court Matter', code: 'court_matter', description: 'General court proceedings and litigation matters' },
    { name: 'Dispute', code: 'dispute', description: 'Land disputes and boundary conflicts' },
    { name: 'Title Claim', code: 'title_claim', description: 'Land title claims and ownership disputes' },
    { name: 'Administrative Review', code: 'administrative_review', description: 'Review of administrative decisions' },
    { name: 'Judicial Review', code: 'judicial_review', description: 'Judicial review of government decisions' },
    { name: 'Tort', code: 'tort', description: 'Civil wrongs and liability claims' },
    { name: 'Compensation Claim', code: 'compensation_claim', description: 'Claims for compensation or damages' },
    { name: 'Fraud', code: 'fraud', description: 'Fraud and misrepresentation cases' },
    { name: 'Other', code: 'other', description: 'Other case types not specified above' }
  ];

  useEffect(() => {
    checkAdminAccess();
    loadCaseTypes();
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

  const loadCaseTypes = async () => {
    try {
      // Since case types are hardcoded in the database constraint,
      // we'll use the predefined list and check usage
      const typesWithUsage = await Promise.all(
        predefinedTypes.map(async (type) => {
          const { count } = await (supabase as any)
            .from('cases')
            .select('*', { count: 'exact', head: true })
            .eq('case_type', type.code);

          return {
            id: type.code,
            ...type,
            is_active: true,
            usage_count: count || 0,
            created_at: new Date().toISOString()
          };
        })
      );

      setCaseTypes(typesWithUsage);
      setLoading(false);
    } catch (error) {
      console.error('Error loading case types:', error);
      toast.error('Failed to load case types');
      setLoading(false);
    }
  };

  const handleOpenDialog = (type?: CaseType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        code: type.code,
        description: type.description,
        is_active: type.is_active
      });
    } else {
      setEditingType(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.code) {
        toast.error('Please fill in all required fields');
        return;
      }

      // For this version, we'll show a message that case types need database schema changes
      toast.info(
        'Case types are currently hardcoded in the database schema. To add new types, you need to update the database constraint.',
        { duration: 5000 }
      );

      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving case type:', error);
      toast.error('Failed to save case type');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardNav />

      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
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
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Case Types Management</h1>
                <p className="text-slate-600 mt-1">Manage case type categories and classifications</p>
              </div>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Add Case Type
            </Button>
          </div>
        </div>

        {/* Info Notice */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">About Case Types</h3>
                <p className="text-sm text-blue-800">
                  Case types are used to categorize and identify cases throughout the system. They appear in case registration,
                  reporting, and filtering. The current types are defined in the database schema. To add new types, you'll need to
                  update the database constraint in the cases table.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-2 border-emerald-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Types</p>
                  <p className="text-2xl font-bold text-slate-900">{caseTypes.length}</p>
                </div>
                <FileText className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Types</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {caseTypes.filter(t => t.is_active).length}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Cases</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {caseTypes.reduce((sum, t) => sum + (t.usage_count || 0), 0)}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Case Types List */}
        <Card>
          <CardHeader>
            <CardTitle>All Case Types ({caseTypes.length})</CardTitle>
            <CardDescription>
              Manage case type definitions used throughout the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading case types...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {caseTypes.map((type) => (
                  <Card key={type.id} className="border-2 border-slate-200 hover:border-slate-300 transition-colors">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-slate-900">{type.name}</h3>
                              {type.is_active ? (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Active</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800 border-red-300">Inactive</Badge>
                              )}
                            </div>
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">
                              {type.code}
                            </code>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(type)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm text-slate-600">{type.description}</p>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs text-slate-500">
                            Used in {type.usage_count || 0} case{type.usage_count !== 1 ? 's' : ''}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            System Type
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Technical Note */}
        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">Technical Note</h3>
                <p className="text-sm text-amber-800 mb-2">
                  Case types are currently defined in the database schema as a CHECK constraint. To add new types:
                </p>
                <ol className="text-sm text-amber-800 space-y-1 ml-4 list-decimal">
                  <li>Update the database schema in Supabase SQL Editor</li>
                  <li>Add the new type to the CHECK constraint on the cases table</li>
                  <li>Update the case registration form to include the new type</li>
                  <li>Refresh this page to see the new type</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingType ? 'Edit Case Type' : 'Add New Case Type'}</DialogTitle>
            <DialogDescription>
              {editingType ? 'Update the case type information below' : 'Create a new case type category'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Type Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Land Dispute"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Type Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g., land_dispute"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  disabled={!!editingType}
                />
                <p className="text-xs text-slate-500">
                  {editingType ? 'Code cannot be changed after creation' : 'Use lowercase with underscores'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this case type is used for..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active" className="cursor-pointer">Active (available for selection)</Label>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> To save this case type, you'll need to update the database schema to include
                this type in the CHECK constraint on the cases table.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={!formData.name || !formData.code}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {editingType ? 'Update' : 'Create'} Case Type
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
  );
}
