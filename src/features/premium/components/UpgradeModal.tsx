import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { usePremiumStore } from '@/store/premiumStore';
import { CloseIcon, LockIcon } from '@/components/icons';
import { useRazorpay } from '../hooks/useRazorpay';

const PERKS = [
  'Guided premium lessons',
  'End-of-video quizzes',
  'Live classes with instructors',
  'Full progress analytics',
];

/** Global upgrade modal. Opened from any "Go Premium" CTA via premiumStore. */
export default function UpgradeModal() {
  const open = usePremiumStore((s) => s.upgradeOpen);
  const close = usePremiumStore((s) => s.closeUpgrade);
  const { profile, isPremium } = useAuth();
  const email = useAuthStore((s) => s.session?.user.email);
  const { startCheckout, loading, error } = useRazorpay();
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  function handleUpgrade() {
    startCheckout({
      name: profile?.name,
      email,
      onSuccess: () => setSuccess(true),
    });
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center px-6" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/70" onClick={close} />

      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-2xl">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 text-white/50 hover:text-white"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        {success || isPremium ? (
          <div className="space-y-3 p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-2xl">
              ✓
            </span>
            <h3 className="text-lg font-bold">You're Premium!</h3>
            <p className="text-sm text-white/60">
              Enjoy guided lessons, quizzes, and live classes.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-2 w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold hover:bg-brand-500"
            >
              Start learning
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/20">
                <LockIcon className="h-5 w-5 text-amber-300" />
              </span>
              <div>
                <h3 className="text-lg font-bold leading-tight">Go Premium</h3>
                <p className="text-xs text-white/50">Unlock everything ShashankLearn offers.</p>
              </div>
            </div>

            <div className="mb-4 flex items-end gap-1">
              <span className="text-3xl font-extrabold">₹499</span>
              <span className="pb-1 text-sm text-white/50">/ month</span>
            </div>

            <ul className="mb-5 space-y-2">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-sm text-white/80">
                  <span className="text-emerald-400">✓</span>
                  {perk}
                </li>
              ))}
            </ul>

            {error && (
              <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full rounded-xl bg-amber-400 py-3 text-sm font-bold text-black transition hover:bg-amber-300 disabled:opacity-60"
            >
              {loading ? 'Starting…' : 'Pay with Razorpay'}
            </button>
            <p className="mt-3 text-center text-[11px] text-white/30">
              Secure payment · Cancel anytime
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
