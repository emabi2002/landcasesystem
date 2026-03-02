import { supabase } from './supabase';
import type { PermissionAction, ModulePermission } from './rbac-types';

/**
 * Permission Checker Utility
 * Provides functions to check if a user has specific permissions
 */

// Cache for user permissions (client-side only)
let permissionsCache: ModulePermission[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Clear the permissions cache
 */
export function clearPermissionsCache() {
  permissionsCache = null;
  cacheTimestamp = null;
}

/**
 * Get all permissions for the current user
 */
export async function getUserPermissions(): Promise<ModulePermission[]> {
  // Check cache
  if (permissionsCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return permissionsCache;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Call the database function to get all user permissions
    const { data, error } = await (supabase as any).rpc('get_user_permissions', {
      p_user_id: user.id
    });

    if (error) {
      console.error('Error fetching user permissions:', error);
      return [];
    }

    const permissions = (data || []) as ModulePermission[];

    // Update cache
    permissionsCache = permissions;
    cacheTimestamp = Date.now();

    return permissions;
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

/**
 * Check if user has a specific permission for a module
 */
export async function hasPermission(
  moduleKey: string,
  action: PermissionAction
): Promise<boolean> {
  try {
    const permissions = await getUserPermissions();
    const modulePermission = permissions.find(p => p.module_key === moduleKey);

    if (!modulePermission) return false;

    switch (action) {
      case 'create':
        return modulePermission.can_create;
      case 'read':
        return modulePermission.can_read;
      case 'update':
        return modulePermission.can_update;
      case 'delete':
        return modulePermission.can_delete;
      case 'print':
        return modulePermission.can_print;
      case 'approve':
        return modulePermission.can_approve;
      case 'export':
        return modulePermission.can_export;
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Check if user has ANY of the specified permissions for a module
 */
export async function hasAnyPermission(
  moduleKey: string,
  actions: PermissionAction[]
): Promise<boolean> {
  try {
    const permissions = await getUserPermissions();
    const modulePermission = permissions.find(p => p.module_key === moduleKey);

    if (!modulePermission) return false;

    return actions.some(action => {
      switch (action) {
        case 'create':
          return modulePermission.can_create;
        case 'read':
          return modulePermission.can_read;
        case 'update':
          return modulePermission.can_update;
        case 'delete':
          return modulePermission.can_delete;
        case 'print':
          return modulePermission.can_print;
        case 'approve':
          return modulePermission.can_approve;
        case 'export':
          return modulePermission.can_export;
        default:
          return false;
      }
    });
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}

/**
 * Check if user has ALL of the specified permissions for a module
 */
export async function hasAllPermissions(
  moduleKey: string,
  actions: PermissionAction[]
): Promise<boolean> {
  try {
    const permissions = await getUserPermissions();
    const modulePermission = permissions.find(p => p.module_key === moduleKey);

    if (!modulePermission) return false;

    return actions.every(action => {
      switch (action) {
        case 'create':
          return modulePermission.can_create;
        case 'read':
          return modulePermission.can_read;
        case 'update':
          return modulePermission.can_update;
        case 'delete':
          return modulePermission.can_delete;
        case 'print':
          return modulePermission.can_print;
        case 'approve':
          return modulePermission.can_approve;
        case 'export':
          return modulePermission.can_export;
        default:
          return false;
      }
    });
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}

/**
 * Get permissions for a specific module
 */
export async function getModulePermissions(moduleKey: string): Promise<{
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_print: boolean;
  can_approve: boolean;
  can_export: boolean;
} | null> {
  try {
    const permissions = await getUserPermissions();
    const modulePermission = permissions.find(p => p.module_key === moduleKey);

    if (!modulePermission) return null;

    return {
      can_create: modulePermission.can_create,
      can_read: modulePermission.can_read,
      can_update: modulePermission.can_update,
      can_delete: modulePermission.can_delete,
      can_print: modulePermission.can_print,
      can_approve: modulePermission.can_approve,
      can_export: modulePermission.can_export,
    };
  } catch (error) {
    console.error('Error getting module permissions:', error);
    return null;
  }
}

/**
 * Log an audit entry
 */
export async function logAudit(
  action: PermissionAction,
  moduleKey?: string,
  recordId?: string,
  recordType?: string,
  details?: Record<string, unknown>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get module ID if moduleKey is provided
    let moduleId = null;
    if (moduleKey) {
      const { data: module } = await (supabase as any)
        .from('modules')
        .select('id')
        .eq('module_key', moduleKey)
        .single();
      moduleId = module?.id || null;
    }

    // Get client info
    const ipAddress = null; // Can be set from server-side
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : null;

    await (supabase as any).from('audit_logs').insert({
      user_id: user.id,
      module_id: moduleId,
      action,
      record_id: recordId,
      record_type: recordType,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error('Error logging audit:', error);
  }
}
