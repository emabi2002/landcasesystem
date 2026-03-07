'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardOverview } from '@/components/dashboard';
import { hasPermission } from '@/lib/permissions';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      // Check if user has permission to view dashboard
      const canViewDashboard = await hasPermission('dashboard', 'read');

      if (!canViewDashboard) {
        // Redirect to Cases page if no dashboard access
        router.push('/cases');
      }
    };

    checkAccess();
  }, [router]);

  return <DashboardOverview />;
}
