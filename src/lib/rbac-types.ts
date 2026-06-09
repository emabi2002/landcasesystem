// RBAC (Role-Based Access Control) Type Definitions

export interface Group {
  id: string;
  group_name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  module_name: string;
  module_key: string;
  description: string | null;
  icon: string | null;
  route: string | null;
  created_at: string;
}

export interface GroupModulePermission {
  id: string;
  group_id: string;
  module_id: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_print: boolean;
  can_approve: boolean;
  can_export: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserGroup {
  id: string;
  user_id: string;
  group_id: string;
  assigned_at: string;
  assigned_by: string | null;
}

export interface AuditLog {
  id: string;
  user_id: string;
  module_id: string | null;
  action: 'create' | 'read' | 'update' | 'delete' | 'print' | 'export' | 'approve';
  record_id: string | null;
  record_type: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  logged_at: string;
}

// Combined types for UI
export interface GroupWithPermissions extends Group {
  permissions: GroupModulePermission[];
}

export interface UserWithGroups {
  id: string;
  email: string;
  full_name: string | null;
  groups: Group[];
}

export interface ModulePermission {
  module_key: string;
  module_name: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_print: boolean;
  can_approve: boolean;
  can_export: boolean;
}

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'print' | 'approve' | 'export';

// Helper type for permission matrix UI
export interface PermissionMatrixRow {
  module_id: string;
  module_name: string;
  module_key: string;
  permissions: {
    can_create: boolean;
    can_read: boolean;
    can_update: boolean;
    can_delete: boolean;
    can_print: boolean;
    can_approve: boolean;
    can_export: boolean;
  };
}
