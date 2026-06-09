import { create } from 'zustand';

/**
 * Global player state shared across feed items. Fleshed out in Step 2/3
 * (mute persistence, current playback, quiz gating). Minimal stub for now.
 */
interface PlayerState {
  muted: boolean;
  toggleMuted: () => void;
  setMuted: (muted: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  // Start muted so autoplay is allowed by mobile browsers.
  muted: true,
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
  setMuted: (muted) => set({ muted }),
}));
