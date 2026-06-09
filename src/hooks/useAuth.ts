import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { DEMO, demoProfile, demoSession } from '@/demo/demo';
import type { Profile } from '@/types';

/**
 * Bootstraps auth state once at app root: loads the current session, fetches
 * the matching profile row, and subscribes to auth changes. Call this ONCE
 * (in App). Components should read from useAuthStore instead.
 */
export function useAuthBootstrap() {
  const { setSession, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    // Demo mode: sign in as the mock user, no Supabase calls.
    if (DEMO) {
      setSession(demoSession);
      setProfile(demoProfile);
      setLoading(false);
      return;
    }

    let active = true;

    async function loadProfile(userId: string): Promise<Profile | null> {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.error('Failed to load profile:', error.message);
        return null;
      }
      return data;
    }

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;

      setSession(session);
      if (session?.user) {
        setProfile(await loadProfile(session.user.id));
      }
      setLoading(false);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      setSession(session);
      if (session?.user) {
        setProfile(await loadProfile(session.user.id));
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // store setters are stable; run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Convenience selectors for components. */
export function useAuth() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  return {
    session,
    profile,
    loading,
    isAuthenticated: !!session,
    isPremium: !!profile?.is_premium,
    isAdmin: profile?.role === 'admin',
  };
}

export async function signOut() {
  await supabase.auth.signOut();
}

/**
 * Re-fetch the current user's profile into the store. Call after a server-side
 * change to the profile (e.g. premium granted by the payment edge function).
 */
export async function refreshProfile(): Promise<void> {
  const { session, setProfile } = useAuthStore.getState();
  const userId = session?.user.id;
  if (!userId) return;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (!error) setProfile(data);
}
