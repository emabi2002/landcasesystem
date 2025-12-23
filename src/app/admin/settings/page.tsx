'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, ArrowLeft, AlertCircle, Flag, Activity, MapPin, Building2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SystemSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
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
      return;
    }

    setLoading(false);
  };

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-800', description: 'Non-urgent matters' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800', description: 'Standard priority' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800', description: 'Requires attention' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800', description: 'Immediate action needed' }
  ];

  const statuses = [
    { value: 'draft', label: 'Draft', color: 'bg-slate-100 text-slate-800' },
    { value: 'registered', label: 'Registered', color: 'bg-blue-100 text-blue-800' },
    { value: 'active', label: 'Active', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-800' },
    { value: 'closed', label: 'Closed', color: 'bg-slate-100 text-slate-800' },
    { value: 'archived', label: 'Archived', color: 'bg-slate-100 text-slate-800' }
  ];

  const regions = [
    { name: 'National Capital District', code: 'NCD' },
    { name: 'Central Province', code: 'CPR' },
    { name: 'Western Province', code: 'WPR' },
    { name: 'Gulf Province', code: 'GPR' },
    { name: 'Milne Bay Province', code: 'MBP' },
    { name: 'Oro Province', code: 'OPR' },
    { name: 'Southern Highlands Province', code: 'SHP' },
    { name: 'Enga Province', code: 'EPR' },
    { name: 'Western Highlands Province', code: 'WHP' },
    { name: 'Simbu Province', code: 'SIM' },
    { name: 'Eastern Highlands Province', code: 'EHP' },
    { name: 'Morobe Province', code: 'MPR' },
    { name: 'Madang Province', code: 'MAD' },
    { name: 'East Sepik Province', code: 'ESP' },
    { name: 'Sandaun Province', code: 'SAN' },
    { name: 'Manus Province', code: 'MAN' },
    { name: 'New Ireland Province', code: 'NIR' },
    { name: 'East New Britain Province', code: 'ENB' },
    { name: 'West New Britain Province', code: 'WNB' },
    { name: 'North Solomons Province', code: 'NSP' },
    { name: 'Hela Province', code: 'HEL' },
    { name: 'Jiwaka Province', code: 'JIW' }
  ];

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
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
              <p className="text-slate-600 mt-1">Configure priorities, statuses, regions, and other reference data</p>
            </div>
          </div>
        </div>

        {/* Info Notice */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">System Reference Data</h3>
                <p className="text-sm text-blue-800">
                  These settings define the standard values used throughout the system. Changes here will affect
                  all users and all cases. Currently, these values are hardcoded but can be made dynamic in future versions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Tabs defaultValue="priorities" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="priorities" className="gap-2">
              <Flag className="h-4 w-4" />
              Priorities
            </TabsTrigger>
            <TabsTrigger value="statuses" className="gap-2">
              <Activity className="h-4 w-4" />
              Statuses
            </TabsTrigger>
            <TabsTrigger value="regions" className="gap-2">
              <MapPin className="h-4 w-4" />
              Regions
            </TabsTrigger>
            <TabsTrigger value="other" className="gap-2">
              <Building2 className="h-4 w-4" />
              Other
            </TabsTrigger>
          </TabsList>

          {/* Priorities Tab */}
          <TabsContent value="priorities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Case Priorities</CardTitle>
                <CardDescription>
                  Priority levels used for case management and escalation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {priorities.map((priority) => (
                    <Card key={priority.value} className="border-2">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={`${priority.color} border font-medium`}>
                            {priority.label}
                          </Badge>
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                            {priority.value}
                          </code>
                        </div>
                        <p className="text-sm text-slate-600">{priority.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statuses Tab */}
          <TabsContent value="statuses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Case Statuses</CardTitle>
                <CardDescription>
                  Status values representing the lifecycle of a case
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {statuses.map((status) => (
                    <Card key={status.value} className="border-2">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={`${status.color} border font-medium`}>
                            {status.label}
                          </Badge>
                        </div>
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded block mt-2">
                          {status.value}
                        </code>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Regions Tab */}
          <TabsContent value="regions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>PNG Provinces & Regions</CardTitle>
                <CardDescription>
                  Regional divisions for case management and reporting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {regions.map((region) => (
                    <div key={region.code} className="flex items-center justify-between p-3 border-2 rounded-lg hover:border-slate-300 transition-colors">
                      <span className="text-sm font-medium text-slate-900">{region.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {region.code}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other Settings Tab */}
          <TabsContent value="other" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Document Types</CardTitle>
                  <CardDescription>Types of documents that can be attached to cases</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {['Filing', 'Affidavit', 'Correspondence', 'Survey Report', 'Contract', 'Evidence', 'Other'].map((type) => (
                      <div key={type} className="flex items-center gap-2 p-2 border rounded">
                        <Badge variant="outline">{type}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Party Roles</CardTitle>
                  <CardDescription>Roles that parties can have in a case</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {['Plaintiff', 'Defendant', 'Witness', 'Legal Representative', 'Third Party', 'Other'].map((role) => (
                      <div key={role} className="flex items-center gap-2 p-2 border rounded">
                        <Badge variant="outline">{role}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Party Types</CardTitle>
                  <CardDescription>Types of entities that can be parties</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {['Individual', 'Company', 'Government Entity', 'Clan/Community', 'Other'].map((type) => (
                      <div key={type} className="flex items-center gap-2 p-2 border rounded">
                        <Badge variant="outline">{type}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Roles</CardTitle>
                  <CardDescription>System roles and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { role: 'Admin', color: 'bg-red-100 text-red-800' },
                      { role: 'Manager', color: 'bg-blue-100 text-blue-800' },
                      { role: 'Lawyer', color: 'bg-emerald-100 text-emerald-800' },
                      { role: 'Officer', color: 'bg-amber-100 text-amber-800' },
                      { role: 'Executive', color: 'bg-purple-100 text-purple-800' }
                    ].map((item) => (
                      <div key={item.role} className="flex items-center gap-2 p-2 border rounded">
                        <Badge className={item.color}>{item.role}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Technical Note */}
        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">Future Enhancement</h3>
                <p className="text-sm text-amber-800">
                  In future versions, these reference data values will be stored in database tables and can be added/edited
                  directly from this interface. Currently, they are hardcoded in the application and database schema for
                  stability and performance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
