import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabaseKey = publishableKey || anonKey;

export type SupabaseConfigStatus = {
  isConfigured: boolean;
  hasUrl: boolean;
  hasKey: boolean;
  keySource: 'VITE_SUPABASE_PUBLISHABLE_KEY' | 'VITE_SUPABASE_ANON_KEY' | 'missing';
  message: string;
};

export const getSupabaseConfigStatus = (): SupabaseConfigStatus => ({
  isConfigured: Boolean(supabaseUrl && supabaseKey),
  hasUrl: Boolean(supabaseUrl),
  hasKey: Boolean(supabaseKey),
  keySource: publishableKey ? 'VITE_SUPABASE_PUBLISHABLE_KEY' : anonKey ? 'VITE_SUPABASE_ANON_KEY' : 'missing',
  message:
    supabaseUrl && supabaseKey
      ? 'Supabase configured'
      : 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY.',
});

export const isSupabaseConfigured = getSupabaseConfigStatus().isConfigured;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseKey as string)
  : null;

export function requireSupabaseClient() {
  if (!supabase) {
    throw new Error(getSupabaseConfigStatus().message);
  }
  return supabase;
}
