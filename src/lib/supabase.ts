// src/lib/supabase.ts
export type { Database, Json } from './database.types';
import { createSupabaseBrowserClient } from './supabase/client';

export { createSupabaseBrowserClient };
export const supabase = createSupabaseBrowserClient();
