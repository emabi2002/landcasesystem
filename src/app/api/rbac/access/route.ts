import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET - Get access permissions for a group
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const group_id = searchParams.get('group_id');

    if (!group_id) throw new Error('Group ID is required');

    const { data, error } = await supabase
      .from('group_module_access')
      .select(`
        *,
        user_groups(group_name),
        system_modules(module_name, module_code, icon)
      `)
      .eq('group_id', group_id);

    if (error) throw error;

    return NextResponse.json({ success: true, access: data || [] });
  } catch (error) {
    console.error('Error fetching access:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Grant module access to group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      group_id,
      module_id,
      can_view = false,
      can_create = false,
      can_edit = false,
      can_delete = false,
      can_admin = false,
      granted_by
    } = body;

    if (!group_id || !module_id) {
      throw new Error('Group ID and Module ID are required');
    }

    const { data, error } = await supabase
      .from('group_module_access')
      .upsert({
        group_id,
        module_id,
        can_view,
        can_create,
        can_edit,
        can_delete,
        can_admin,
        granted_by,
        granted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await supabase.from('rbac_audit_log').insert({
      action: 'access_granted',
      entity_type: 'access',
      entity_id: data.id,
      changed_by: granted_by,
      new_value: { group_id, module_id, can_view, can_create, can_edit, can_delete, can_admin }
    });

    return NextResponse.json({ success: true, access: data });
  } catch (error) {
    console.error('Error granting access:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Revoke module access from group
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const revoked_by = searchParams.get('revoked_by');

    if (!id) throw new Error('Access ID is required');

    const { error } = await supabase
      .from('group_module_access')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Audit log
    await supabase.from('rbac_audit_log').insert({
      action: 'access_revoked',
      entity_type: 'access',
      entity_id: id,
      changed_by: revoked_by
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking access:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
