'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { ConfigurationError } from '@/lib/env';

function createMissingConfigClient(error: unknown): SupabaseClient<Database> {
  const configurationError = error instanceof Error
    ? error
    : new ConfigurationError('Missing required Supabase public environment variables');

  return new Proxy({}, {
    get() {
      throw configurationError;
    },
  }) as SupabaseClient<Database>;
}

export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return createMissingConfigClient(
      new ConfigurationError('Missing required Supabase public environment variables')
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
