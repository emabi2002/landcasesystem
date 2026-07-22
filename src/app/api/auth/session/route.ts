import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types';
import { getSupabaseBrowserConfig } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const accessToken = body?.access_token;
    const refreshToken = body?.refresh_token;

    if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
      return NextResponse.json({ error: 'Missing session tokens' }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    const { url, anonKey } = getSupabaseBrowserConfig();

    const supabase = createServerClient<Database>(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              path: '/',
              sameSite: 'none',
              secure: true,
            });
          });
        },
      },
    });

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to establish session' }, { status: 401 });
    }

    response.cookies.set('dlpp-session', 'active', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Failed to establish session' }, { status: 500 });
  }
}
