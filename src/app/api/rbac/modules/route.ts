import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET - List all system modules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';

    let query = supabase
      .from('system_modules')
      .select('*')
      .order('display_order')
      .order('module_name');

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, modules: data || [] });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Create new system module
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { module_name, module_code, description, module_url, icon, parent_module_id, display_order, created_by } = body;

    if (!module_name || !module_code) {
      throw new Error('Module name and code are required');
    }

    const { data, error } = await supabase
      .from('system_modules')
      .insert({
        module_name,
        module_code: module_code.toUpperCase(),
        description,
        module_url,
        icon,
        parent_module_id,
        display_order: display_order || 0,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await supabase.from('rbac_audit_log').insert({
      action: 'module_created',
      entity_type: 'module',
      entity_id: data.id,
      changed_by: created_by,
      new_value: { module_name, module_code, description, module_url }
    });

    return NextResponse.json({ success: true, module: data });
  } catch (error) {
    console.error('Error creating module:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update system module
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, module_name, description, module_url, icon, display_order, is_active, updated_by } = body;

    if (!id) throw new Error('Module ID is required');

    const { data, error } = await supabase
      .from('system_modules')
      .update({
        module_name,
        description,
        module_url,
        icon,
        display_order,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await supabase.from('rbac_audit_log').insert({
      action: 'module_updated',
      entity_type: 'module',
      entity_id: id,
      changed_by: updated_by,
      new_value: { module_name, description, module_url, icon, display_order, is_active }
    });

    return NextResponse.json({ success: true, module: data });
  } catch (error) {
    console.error('Error updating module:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete system module
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deleted_by = searchParams.get('deleted_by');

    if (!id) throw new Error('Module ID is required');

    const { error } = await supabase
      .from('system_modules')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Audit log
    await supabase.from('rbac_audit_log').insert({
      action: 'module_deleted',
      entity_type: 'module',
      entity_id: id,
      changed_by: deleted_by
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting module:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
