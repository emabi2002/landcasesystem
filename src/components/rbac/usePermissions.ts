'use client';

import { useEffect, useState } from 'react';
import {
  hasPermission,
  getModulePermissions,
  getUserPermissions
} from '@/lib/permissions';
import type { PermissionAction, ModulePermission } from '@/lib/rbac-types';

export function usePermissions(moduleKey: string) {
  const [permissions, setPermissions] = useState({
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
    canPrint: false,
    canApprove: false,
    canExport: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, [moduleKey]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const modulePerms = await getModulePermissions(moduleKey);

      if (modulePerms) {
        setPermissions({
          canCreate: modulePerms.can_create,
          canRead: modulePerms.can_read,
          canUpdate: modulePerms.can_update,
          canDelete: modulePerms.can_delete,
          canPrint: modulePerms.can_print,
          canApprove: modulePerms.can_approve,
          canExport: modulePerms.can_export,
        });
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  return { ...permissions, loading };
}

export function useHasPermission(moduleKey: string, action: PermissionAction) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, [moduleKey, action]);

  const checkPermission = async () => {
    try {
      setLoading(true);
      const result = await hasPermission(moduleKey, action);
      setHasAccess(result);
    } catch (error) {
      console.error('Error checking permission:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  return { hasPermission: hasAccess, loading };
}

export function useAllPermissions() {
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllPermissions();
  }, []);

  const loadAllPermissions = async () => {
    try {
      setLoading(true);
      const userPerms = await getUserPermissions();
      setPermissions(userPerms);
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  return { permissions, loading };
}
