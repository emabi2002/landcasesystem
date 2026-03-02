import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get all users (in a real system, filter by role = 'litigation_officer')
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: usersError.message }, { status: 400 });
    }

    // For each user, get their active case count
    const officersWithWorkload = await Promise.all(
      (users || []).map(async (user) => {
        // Get active case count
        const { count, error: countError } = await supabase
          .from('case_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('officer_user_id', user.id)
          .eq('status', 'active')
          .is('ended_at', null);

        if (countError) {
          console.error(`Error getting workload for ${user.email}:`, countError);
        }

        return {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email,
          department: user.user_metadata?.department || 'Not specified',
          active_cases: count || 0,
          status: 'active', // In real system, check actual user status
        };
      })
    );

    // Sort by workload (ascending) to help with distribution
    officersWithWorkload.sort((a, b) => a.active_cases - b.active_cases);

    return NextResponse.json({ officers: officersWithWorkload });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
