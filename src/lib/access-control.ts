import { supabase } from './supabase';

export type UserRole = 'executive' | 'manager' | 'lawyer' | 'officer' | 'admin';

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

const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  executive: {
    canAccessReception: false,
    canAccessDirections: true,
    canCommentDirections: true,
    canAccessRegistration: false,
    canAccessOfficerActions: false,
    canAccessExternalFilings: false,
    canAccessCompliance: false,
    canAccessClosure: false,
    canAccessPartiesLawyers: false,
    canAccessAdmin: false,
    canViewAllCases: true,
    canCreateCase: false,
  },
  manager: {
    canAccessReception: true,
    canAccessDirections: true,
    canCommentDirections: true,
    canAccessRegistration: true,
    canAccessOfficerActions: true,
    canAccessExternalFilings: true,
    canAccessCompliance: true,
    canAccessClosure: true,
    canAccessPartiesLawyers: true,
    canAccessAdmin: false,
    canViewAllCases: true,
    canCreateCase: true,
  },
  lawyer: {
    canAccessReception: false,
    canAccessDirections: false,
    canCommentDirections: false,
    canAccessRegistration: true,
    canAccessOfficerActions: true,
    canAccessExternalFilings: true,
    canAccessCompliance: true,
    canAccessClosure: true,
    canAccessPartiesLawyers: true,
    canAccessAdmin: false,
    canViewAllCases: true,
    canCreateCase: true,
  },
  officer: {
    canAccessReception: true,
    canAccessDirections: false,
    canCommentDirections: false,
    canAccessRegistration: false,
    canAccessOfficerActions: false,
    canAccessExternalFilings: false,
    canAccessCompliance: false,
    canAccessClosure: false,
    canAccessPartiesLawyers: false,
    canAccessAdmin: false,
    canViewAllCases: true,
    canCreateCase: true,
  },
  admin: {
    canAccessReception: true,
    canAccessDirections: true,
    canCommentDirections: true,
    canAccessRegistration: true,
    canAccessOfficerActions: true,
    canAccessExternalFilings: true,
    canAccessCompliance: true,
    canAccessClosure: true,
    canAccessPartiesLawyers: true,
    canAccessAdmin: true,
    canViewAllCases: true,
    canCreateCase: true,
  },
};

export async function getCurrentUserRole(): Promise<UserRole | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    return (userData?.role as UserRole) || 'officer';
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

export async function getUserPermissions(): Promise<RolePermissions | null> {
  const role = await getCurrentUserRole();
  if (!role) return null;

  return ROLE_PERMISSIONS[role];
}

export async function checkAccess(requiredPermission: keyof RolePermissions): Promise<boolean> {
  const permissions = await getUserPermissions();
  if (!permissions) return false;

  return permissions[requiredPermission];
}

export async function checkModuleAccess(module: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const role = await getCurrentUserRole();
  if (!role) {
    return { allowed: false, reason: 'User not authenticated' };
  }

  const permissions = ROLE_PERMISSIONS[role];

  const modulePermissions: Record<string, keyof RolePermissions> = {
    reception: 'canAccessReception',
    directions: 'canAccessDirections',
    registration: 'canAccessRegistration',
    'register-correspondence': 'canAccessRegistration',
    'create-files': 'canAccessRegistration',
    delegate: 'canAccessRegistration',
    'officer-actions': 'canAccessOfficerActions',
    'external-filings': 'canAccessExternalFilings',
    compliance: 'canAccessCompliance',
    closure: 'canAccessClosure',
    'parties-lawyers': 'canAccessPartiesLawyers',
    admin: 'canAccessAdmin',
  };

  const permissionKey = modulePermissions[module];
  if (!permissionKey) {
    return { allowed: false, reason: 'Invalid module' };
  }

  if (!permissions[permissionKey]) {
    return {
      allowed: false,
      reason: `Your role (${getRoleName(role)}) does not have access to this module`,
    };
  }

  return { allowed: true };
}

export function getRoleName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    executive: 'Executive Management',
    manager: 'Manager',
    lawyer: 'Lawyer / Legal Officer',
    officer: 'Officer / Registry Clerk',
    admin: 'System Administrator',
  };

  return roleNames[role] || role;
}

export function getRoleColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    executive: 'bg-purple-100 text-purple-800 border-purple-300',
    manager: 'bg-blue-100 text-blue-800 border-blue-300',
    lawyer: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    officer: 'bg-amber-100 text-amber-800 border-amber-300',
    admin: 'bg-red-100 text-red-800 border-red-300',
  };

  return colors[role] || 'bg-slate-100 text-slate-800 border-slate-300';
}

export const ROLES = {
  executive: {
    name: 'Executive Management',
    description: 'See dashboard and comment on directions (Step 2)',
    permissions: ROLE_PERMISSIONS.executive,
  },
  manager: {
    name: 'Manager',
    description: 'Full access to all modules',
    permissions: ROLE_PERMISSIONS.manager,
  },
  lawyer: {
    name: 'Lawyer / Legal Officer',
    description: 'Step 3 through case closure',
    permissions: ROLE_PERMISSIONS.lawyer,
  },
  officer: {
    name: 'Officer / Registry Clerk',
    description: 'Step 1 - Document reception only',
    permissions: ROLE_PERMISSIONS.officer,
  },
  admin: {
    name: 'System Administrator',
    description: 'Full system access + user management',
    permissions: ROLE_PERMISSIONS.admin,
  },
};
