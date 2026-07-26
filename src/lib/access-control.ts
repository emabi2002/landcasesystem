import { supabase } from './supabase';

export type UserRole = 'canonical-rbac';

export interface RolePermissions {
  canAccessReception: boolean;
  canAccessDirections: boolean;
  canCommentDirections: boolean;
  canAccessRegistration: boolean;
  canAccessOfficerActions: boolean;
  canAccessExternalFilings: boolean;
  canAccessCompliance: boolean;
  canAccessClosure: boolean;
  canAccessPartiesLawyers: boolean;
  canAccessAdmin: boolean;
  canViewAllCases: boolean;
  canCreateCase: boolean;
}

const MODULE_PERMISSION_MAP: Record<keyof RolePermissions, { module: string; action: string }> = {
  canAccessReception: { module: 'correspondence', action: 'read' },
  canAccessDirections: { module: 'directions', action: 'read' },
  canCommentDirections: { module: 'directions', action: 'update' },
  canAccessRegistration: { module: 'cases', action: 'create' },
  canAccessOfficerActions: { module: 'allocation', action: 'update' },
  canAccessExternalFilings: { module: 'filings', action: 'read' },
  canAccessCompliance: { module: 'compliance', action: 'read' },
  canAccessClosure: { module: 'cases', action: 'update' },
  canAccessPartiesLawyers: { module: 'lawyers', action: 'read' },
  canAccessAdmin: { module: 'admin', action: 'read' },
  canViewAllCases: { module: 'cases', action: 'read' },
  canCreateCase: { module: 'cases', action: 'create' },
};

const MODULE_ACCESS_MAP: Record<string, keyof RolePermissions> = {
  reception: 'canAccessReception',
  directions: 'canAccessDirections',
  registration: 'canAccessRegistration',
  'register-correspondence': 'canAccessRegistration',
  'create-files': 'canAccessRegistration',
  delegate: 'canAccessOfficerActions',
  'officer-actions': 'canAccessOfficerActions',
  'external-filings': 'canAccessExternalFilings',
  compliance: 'canAccessCompliance',
  closure: 'canAccessClosure',
  'parties-lawyers': 'canAccessPartiesLawyers',
  admin: 'canAccessAdmin',
};

async function hasPermission(module: string, action: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await (supabase as any).rpc('user_has_permission', {
    p_user_id: user.id,
    p_module_key: module,
    p_action: action,
  });

  if (error) {
    console.error('Canonical permission check failed:', error);
    return false;
  }

  return data === true;
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user ? 'canonical-rbac' : null;
}

export async function getUserPermissions(): Promise<RolePermissions | null> {
  const role = await getCurrentUserRole();
  if (!role) return null;

  const entries = await Promise.all(
    (Object.keys(MODULE_PERMISSION_MAP) as Array<keyof RolePermissions>).map(async (key) => {
      const permission = MODULE_PERMISSION_MAP[key];
      return [key, await hasPermission(permission.module, permission.action)] as const;
    }),
  );

  return Object.fromEntries(entries) as unknown as RolePermissions;
}

export async function checkAccess(requiredPermission: keyof RolePermissions): Promise<boolean> {
  const permission = MODULE_PERMISSION_MAP[requiredPermission];
  if (!permission) return false;
  return hasPermission(permission.module, permission.action);
}

export async function checkModuleAccess(module: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const permissionKey = MODULE_ACCESS_MAP[module];
  if (!permissionKey) {
    return { allowed: false, reason: 'Invalid module' };
  }

  const allowed = await checkAccess(permissionKey);
  return allowed
    ? { allowed: true }
    : { allowed: false, reason: 'You do not have the required module permission.' };
}

export function getRoleName(_role: UserRole): string {
  return 'Canonical RBAC user';
}

export function getRoleColor(_role: UserRole): string {
  return 'bg-slate-100 text-slate-800 border-slate-300';
}
