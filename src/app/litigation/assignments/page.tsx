'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * DEPRECATED ROUTE
 * This route has been consolidated into /cases/assignments
 * Automatically redirects to the canonical route
 */
export default function LitigationAssignmentsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to canonical route
    router.replace('/cases/assignments');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 mx-auto mb-4" />
        <p className="text-slate-600">Redirecting to Case Assignments...</p>
      </div>
    </div>
  );
}
