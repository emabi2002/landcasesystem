'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  FileText,
  Settings,
  Database,
  BarChart3,
  Shield,
  MapPin,
  Building2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalCases: number;
  caseTypes: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalCases: 0,
    caseTypes: 9
  });
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkAdminAccess();
    loadStats();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user is admin
    const { data: userData } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin' && userData?.role !== 'manager') {
      toast.error('Access denied. Administrator privileges required.');
      router.push('/dashboard');
      return;
    }

    setCurrentUser(userData);
  };

  const loadStats = async () => {
    try {
      // Get user counts
      const { count: totalUsers } = await (supabase as any)
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: activeUsers } = await (supabase as any)
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get case counts
      const { count: totalCases } = await (supabase as any)
        .from('cases')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalCases: totalCases || 0,
        caseTypes: 9
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setLoading(false);
    }
  };

  const adminSections = [
    {
      title: 'User Management',
      description: 'Create, edit, and manage user accounts and permissions',
      icon: Users,
      href: '/admin/users',
      color: 'from-blue-500 to-blue-600',
      stats: `${stats.activeUsers}/${stats.totalUsers} active`,
      badge: 'Core',
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    {
      title: 'RBAC Management',
      description: 'Role-Based Access Control - manage groups, modules & permissions',
      icon: Shield,
      href: '/admin/rbac',
      color: 'from-indigo-500 to-indigo-600',
      stats: 'Full RBAC system',
      badge: 'New',
      badgeColor: 'bg-indigo-100 text-indigo-800'
    },
    {
      title: 'Case Types',
      description: 'Manage case type categories and classifications',
      icon: FileText,
      href: '/admin/case-types',
      color: 'from-emerald-500 to-emerald-600',
      stats: `${stats.caseTypes} types`,
      badge: 'New',
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      title: 'System Settings',
      description: 'Configure regions, courts, priorities, and other reference data',
      icon: Settings,
      href: '/admin/settings',
      color: 'from-purple-500 to-purple-600',
      stats: 'Multiple datasets',
      badge: 'New',
      badgeColor: 'bg-purple-100 text-purple-800'
    },
    {
      title: 'Regions & Courts',
      description: 'Manage regional offices and court information',
      icon: MapPin,
      href: '/admin/locations',
      color: 'from-orange-500 to-orange-600',
      stats: 'Geographic data',
      badge: 'New',
      badgeColor: 'bg-orange-100 text-orange-800'
    },
    {
      title: 'Departments',
      description: 'Manage departments and organizational structure',
      icon: Building2,
      href: '/admin/departments',
      color: 'from-cyan-500 to-cyan-600',
      stats: 'Organization',
      badge: 'New',
      badgeColor: 'bg-cyan-100 text-cyan-800'
    },
    {
      title: 'Case Statuses',
      description: 'Define case statuses, priorities, and workflow states',
      icon: Briefcase,
      href: '/admin/case-statuses',
      color: 'from-indigo-500 to-indigo-600',
      stats: 'Workflow config',
      badge: 'New',
      badgeColor: 'bg-indigo-100 text-indigo-800'
    },
    {
      title: 'Database Management',
      description: 'View database health, run maintenance, and backups',
      icon: Database,
      href: '/admin/database',
      color: 'from-red-500 to-red-600',
      stats: `${stats.totalCases} cases`,
      badge: 'Advanced',
      badgeColor: 'bg-red-100 text-red-800'
    },
    {
      title: 'Reports & Analytics',
      description: 'System usage reports and administrative analytics',
      icon: BarChart3,
      href: '/admin/reports',
      color: 'from-amber-500 to-amber-600',
      stats: 'Insights',
      badge: 'Coming Soon',
      badgeColor: 'bg-amber-100 text-amber-800'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardNav />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">System Administration</h1>
                <p className="text-slate-600 mt-1">Manage users, case types, and system settings</p>
              </div>
            </div>
          </div>
          {currentUser && (
            <Badge className="bg-red-100 text-red-800 border-red-300 px-4 py-2">
              <Shield className="h-4 w-4 mr-2" />
              {currentUser.role === 'admin' ? 'Administrator' : 'Manager'}
            </Badge>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Users</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700">Active Users</p>
                  <p className="text-2xl font-bold text-emerald-900">{stats.activeUsers}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Total Cases</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.totalCases}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Case Types</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.caseTypes}</p>
                </div>
                <Briefcase className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Sections Grid */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Administration Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminSections.map((section, index) => {
              const Icon = section.icon;
              const isComingSoon = section.badge === 'Coming Soon';

              return (
                <Card
                  key={index}
                  className="border-2 border-slate-200 hover:border-slate-300 transition-all duration-200 hover:shadow-lg group"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className={`p-3 bg-gradient-to-br ${section.color} rounded-xl shadow-md group-hover:shadow-lg transition-shadow`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge className={`${section.badgeColor} border`}>
                        {section.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{section.stats}</span>
                      {!isComingSoon ? (
                        <Link href={section.href}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 group-hover:gap-3 transition-all"
                          >
                            Manage
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="ghost" size="sm" disabled>
                          Coming Soon
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Important Notice */}
        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">Administrative Access</h3>
                <p className="text-sm text-amber-800">
                  You have administrator privileges. Please be careful when making changes to users, case types,
                  or system settings as they affect all users. Always test changes in a non-production environment first.
                  Changes to reference data (case types, statuses, etc.) will immediately affect all active cases.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
