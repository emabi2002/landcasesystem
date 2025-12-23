import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET - Get group members or user's groups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const group_id = searchParams.get('group_id');
    const user_id = searchParams.get('user_id');

    let query = supabase
      .from('user_group_membership')
      .select(`
        *,
        user_groups(group_name, group_code),
        profiles(full_name, email, role)
      `);

    if (group_id) {
      query = query.eq('group_id', group_id);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    query = query.eq('is_active', true);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, memberships: data || [] });
  } catch (error) {
    console.error('Error fetching memberships:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Assign user to group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, group_id, assigned_by } = body;

    if (!user_id || !group_id) {
      throw new Error('User ID and Group ID are required');
    }

    const { data, error } = await supabase
      .from('user_group_membership')
      .insert({
        user_id,
        group_id,
        assigned_by,
        assigned_at: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await supabase.from('rbac_audit_log').insert({
      action: 'user_assigned_to_group',
      entity_type: 'membership',
      entity_id: data.id,
      changed_by: assigned_by,
      new_value: { user_id, group_id }
    });

    return NextResponse.json({ success: true, membership: data });
  } catch (error) {
    console.error('Error assigning user:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update membership status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, is_active, updated_by } = body;

    if (!id) throw new Error('Membership ID is required');

    const { data, error } = await supabase
      .from('user_group_membership')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await supabase.from('rbac_audit_log').insert({
      action: is_active ? 'membership_activated' : 'membership_deactivated',
      entity_type: 'membership',
      entity_id: id,
      changed_by: updated_by,
      new_value: { is_active }
    });

    return NextResponse.json({ success: true, membership: data });
  } catch (error) {
    console.error('Error updating membership:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove user from group
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const removed_by = searchParams.get('removed_by');

    if (!id) throw new Error('Membership ID is required');

    const { error } = await supabase
      .from('user_group_membership')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Audit log
    await supabase.from('rbac_audit_log').insert({
      action: 'user_removed_from_group',
      entity_type: 'membership',
      entity_id: id,
      changed_by: removed_by
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing user:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
