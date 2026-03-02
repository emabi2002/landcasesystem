import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name, group_id, department } = body;

    // Validate required fields
    if (!email || !password || !full_name || !group_id) {
      return NextResponse.json(
        { error: 'Missing required fields. Email, password, full name, and group are required.' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Verify group exists
    const { data: groupData, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('id, group_name')
      .eq('id', group_id)
      .single();

    if (groupError || !groupData) {
      return NextResponse.json(
        { error: 'Invalid group selected' },
        { status: 400 }
      );
    }

    // Create auth user with admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        department: department || null,
      },
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create auth user' },
        { status: 500 }
      );
    }

    // Assign user to group
    const { error: groupAssignError } = await supabaseAdmin
      .from('user_groups')
      .insert({
        user_id: authData.user.id,
        group_id: group_id,
        assigned_by: null, // System assignment during creation
      });

    if (groupAssignError) {
      console.error('Group assignment error:', groupAssignError);

      // Cleanup: delete auth user if group assignment fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json(
        { error: `Failed to assign user to group: ${groupAssignError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        full_name,
        group: groupData.group_name,
      },
    });
  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
