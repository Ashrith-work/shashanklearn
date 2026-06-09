import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '@/types';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  /** True until the initial session check + profile fetch completes. */
  loading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  loading: true,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ session: null, profile: null, loading: false }),
}));
