import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAuthenticatedUser, AuthError, authErrorResponse } from '@/lib/auth/require-user';
import type { PermissionAction } from '@/lib/rbac-types';

export class PermissionDeniedError extends Error {
  status = 403;

  constructor(message = 'Permission denied') {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

export interface PermissionRequirement {
  moduleKey: string;
  action: PermissionAction;
}

export interface AuthorizedContext {
  user: User;
  admin: ReturnType<typeof createSupabaseAdminClient>;
}

const actionToColumn: Record<PermissionAction, string> = {
  create: 'can_create',
  read: 'can_read',
  update: 'can_update',
  delete: 'can_delete',
  print: 'can_print',
  approve: 'can_approve',
  export: 'can_export',
};

export async function userHasModulePermission(userId: string, requirement: PermissionRequirement) {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin.rpc('user_has_permission' as never, {
    p_user_id: userId,
    p_module_key: requirement.moduleKey,
    p_action: requirement.action,
  } as never);

  if (!error && typeof data === 'boolean') {
    return data;
  }

  const permissionColumn = actionToColumn[requirement.action];
  const { data: rows, error: fallbackError } = await admin
    .from('user_groups' as never)
    .select('groups!inner(group_module_permissions!inner(modules!inner(module_key), can_create, can_read, can_update, can_delete, can_print, can_approve, can_export))' as never)
    .eq('user_id' as never, userId as never);

  if (fallbackError || !rows) {
    return false;
  }

  return (rows as any[]).some((row) => {
    const permissions = row.groups?.group_module_permissions;
    const permissionList = Array.isArray(permissions) ? permissions : [];

    return permissionList.some((permission) => {
      const permissionModule = Array.isArray(permission.modules) ? permission.modules[0] : permission.modules;
      return permissionModule?.module_key === requirement.moduleKey && permission[permissionColumn] === true;
    });
  });
}

export async function requireModulePermission(moduleKey: string, action: PermissionAction): Promise<AuthorizedContext> {
  const user = await requireAuthenticatedUser();
  const allowed = await userHasModulePermission(user.id, { moduleKey, action });

  if (!allowed) {
    throw new PermissionDeniedError();
  }

  return {
    user,
    admin: createSupabaseAdminClient(),
  };
}

export async function requireAnyModulePermission(requirements: PermissionRequirement[]): Promise<AuthorizedContext> {
  const user = await requireAuthenticatedUser();

  for (const requirement of requirements) {
    if (await userHasModulePermission(user.id, requirement)) {
      return {
        user,
        admin: createSupabaseAdminClient(),
      };
    }
  }

  throw new PermissionDeniedError();
}

export function permissionErrorResponse(error: unknown) {
  const authResponse = authErrorResponse(error);
  if (authResponse) return authResponse;

  if (error instanceof PermissionDeniedError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return null;
}
