import { supabase } from '@/lib/supabase';

/** Normalized result so the UI never has to touch the raw Supabase error shape. */
export interface AuthResult {
  error: string | null;
  /** Sign-up succeeded but the session is pending email confirmation. */
  needsEmailConfirm?: boolean;
}

/** Where OAuth / magic-link should return the user. */
function callbackUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function signUpWithPassword(
  email: string,
  password: string,
  name: string
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // `name` lands in user_metadata -> raw_user_meta_data, which the
    // handle_new_user() trigger reads when creating the profile row.
    options: { data: { name } },
  });
  if (error) return { error: error.message };
  // When email confirmations are ON, no session is returned until confirmed.
  return { error: null, needsEmailConfirm: !data.session };
}

export async function signInWithGoogle(): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callbackUrl() },
  });
  // On success the browser navigates away, so we only return on error.
  return { error: error?.message ?? null };
}

export async function sendMagicLink(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl() },
  });
  return { error: error?.message ?? null };
}
