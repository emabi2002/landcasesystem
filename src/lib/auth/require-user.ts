import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ConfigurationError } from '@/lib/env';

export class AuthError extends Error {
  status: number;

  constructor(message = 'Authentication required', status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

export async function requireAuthenticatedUser(): Promise<User> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError();
  }

  return user;
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ConfigurationError) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  return null;
}
