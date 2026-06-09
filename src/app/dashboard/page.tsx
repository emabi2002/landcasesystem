'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardOverview } from '@/components/dashboard';
import { hasPermission } from '@/lib/permissions';
import { AppLayout } from '@/components/layout/AppLayout';
import { LayoutDashboard } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      const canViewDashboard = await hasPermission('dashboard', 'read');

      if (!canViewDashboard) {
        router.push('/cases');
      }
    };

    checkAccess();
  }, [router]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">
        {/* Sticky Header Bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <LayoutDashboard className="h-5 w-5 text-slate-600" />
              <div className="h-6 w-px bg-slate-300" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
                <p className="text-xs text-slate-500">Overview and analytics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <DashboardOverview />
        </div>
      </div>
    </AppLayout>
  );
}
