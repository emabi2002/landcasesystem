'use client';

import { useEffect, useState } from 'react';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/permissions';
import type { PermissionAction } from '@/lib/rbac-types';

interface PermissionGateProps {
  moduleKey: string;
  action?: PermissionAction;
  anyOf?: PermissionAction[];
  allOf?: PermissionAction[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

/**
 * PermissionGate Component
 *
 * Conditionally renders children based on user permissions.
 *
 * Usage:
 * ```tsx
 * // Check single permission
 * <PermissionGate moduleKey="case_management" action="create">
 *   <Button>Create Case</Button>
 * </PermissionGate>
 *
 * // Check if user has ANY of the permissions
 * <PermissionGate moduleKey="case_management" anyOf={['create', 'update']}>
 *   <Button>Edit</Button>
 * </PermissionGate>
 *
 * // Check if user has ALL of the permissions
 * <PermissionGate moduleKey="case_management" allOf={['update', 'approve']}>
 *   <Button>Approve and Save</Button>
 * </PermissionGate>
 *
 * // With fallback
 * <PermissionGate
 *   moduleKey="case_management"
 *   action="delete"
 *   fallback={<p>You don't have permission to delete</p>}
 * >
 *   <Button>Delete Case</Button>
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  moduleKey,
  action,
  anyOf,
  allOf,
  children,
  fallback = null,
  loading = null,
}: PermissionGateProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    checkPermission();
  }, [moduleKey, action, anyOf, allOf]);

  const checkPermission = async () => {
    try {
      let result = false;

      if (action) {
        result = await hasPermission(moduleKey, action);
      } else if (anyOf && anyOf.length > 0) {
        result = await hasAnyPermission(moduleKey, anyOf);
      } else if (allOf && allOf.length > 0) {
        result = await hasAllPermissions(moduleKey, allOf);
      } else {
        // If no specific action is provided, check if user has read access
        result = await hasPermission(moduleKey, 'read');
      }

      setHasAccess(result);
    } catch (error) {
      console.error('Error checking permission:', error);
      setHasAccess(false);
    }
  };

  if (hasAccess === null) {
    return <>{loading}</>;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
