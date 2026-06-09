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

export async function GET() {
  try {
    // Get all users from auth
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: usersError.message },
        { status: 400 }
      );
    }

    // For each user, get their groups
    const usersWithGroups = await Promise.all(
      (users || []).map(async (user) => {
        const { data: userGroupsData } = await supabaseAdmin
          .from('user_groups')
          .select('group_id, groups(*)')
          .eq('user_id', user.id);

        const userGroups = (userGroupsData || [])
          .map(ug => (ug as any).groups)
          .filter(Boolean);

        return {
          id: user.id,
          email: user.email || '',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at || null,
          email_confirmed_at: user.email_confirmed_at || null,
          groups: userGroups,
        };
      })
    );

    return NextResponse.json({ users: usersWithGroups });
  } catch (error) {
    console.error('Unexpected error fetching users:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
