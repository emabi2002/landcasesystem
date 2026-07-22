import { afterEach, describe, expect, it } from 'vitest';
import { ConfigurationError, getSupabaseBrowserConfig, getSupabaseAdminConfig } from './env';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('Supabase environment configuration', () => {
  it('throws a controlled error when public variables are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    expect(() => getSupabaseBrowserConfig()).toThrow(ConfigurationError);
  });

  it('throws a controlled error when the service role key is missing', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => getSupabaseAdminConfig()).toThrow(ConfigurationError);
  });
});
