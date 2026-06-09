import { create } from 'zustand';

/** Controls the global Upgrade modal so any "Go Premium" CTA can open it. */
interface PremiumState {
  upgradeOpen: boolean;
  openUpgrade: () => void;
  closeUpgrade: () => void;
}

export const usePremiumStore = create<PremiumState>((set) => ({
  upgradeOpen: false,
  openUpgrade: () => set({ upgradeOpen: true }),
  closeUpgrade: () => set({ upgradeOpen: false }),
}));
