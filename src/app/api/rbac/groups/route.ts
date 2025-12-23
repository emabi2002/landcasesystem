import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET - List all user groups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';

    let query = supabase
      .from('user_groups')
      .select('*, created_by_profile:created_by(full_name)')
      .order('group_name');

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, groups: data || [] });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Create new user group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { group_name, group_code, description, created_by } = body;

    if (!group_name || !group_code) {
      throw new Error('Group name and code are required');
    }

    const { data, error } = await supabase
      .from('user_groups')
      .insert({
        group_name,
        group_code: group_code.toUpperCase(),
        description,
        created_by,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await supabase.from('rbac_audit_log').insert({
      action: 'group_created',
      entity_type: 'group',
      entity_id: data.id,
      changed_by: created_by,
      new_value: { group_name, group_code, description }
    });

    return NextResponse.json({ success: true, group: data });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update user group
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, group_name, description, is_active, updated_by } = body;

    if (!id) throw new Error('Group ID is required');

    const { data, error } = await supabase
      .from('user_groups')
      .update({
        group_name,
        description,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await supabase.from('rbac_audit_log').insert({
      action: 'group_updated',
      entity_type: 'group',
      entity_id: id,
      changed_by: updated_by,
      new_value: { group_name, description, is_active }
    });

    return NextResponse.json({ success: true, group: data });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user group
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deleted_by = searchParams.get('deleted_by');

    if (!id) throw new Error('Group ID is required');

    const { error } = await supabase
      .from('user_groups')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Audit log
    await supabase.from('rbac_audit_log').insert({
      action: 'group_deleted',
      entity_type: 'group',
      entity_id: id,
      changed_by: deleted_by
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
