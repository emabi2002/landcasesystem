'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * DEPRECATED ROUTE
 * Case closure is now a tab in /cases/[id]
 * Redirects to the cases list where users can access closure from case details
 */
export default function ClosurePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to cases list - closure is now a tab in case details
    router.replace('/cases');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 mx-auto mb-4" />
        <p className="text-slate-600">Redirecting to Cases...</p>
        <p className="text-xs text-slate-500 mt-2">Case closure is now accessible from case details</p>
      </div>
    </div>
  );
}
