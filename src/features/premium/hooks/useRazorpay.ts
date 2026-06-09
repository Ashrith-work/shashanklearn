import { useState } from 'react';
import { refreshProfile } from '@/hooks/useAuth';
import { createOrder, verifyPayment } from '../api';

const RAZORPAY_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

/** Minimal shape of the global injected by the Razorpay checkout script. */
interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
}
interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = RAZORPAY_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface CheckoutArgs {
  name?: string | null;
  email?: string | null;
  onSuccess: () => void;
}

export function useRazorpay() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout({ name, email, onSuccess }: CheckoutArgs) {
    setError(null);
    setLoading(true);
    try {
      const ready = await loadScript();
      if (!ready || !window.Razorpay) throw new Error('Could not load Razorpay.');

      const { data: order, error: orderErr } = await createOrder();
      if (orderErr || !order) throw new Error(orderErr ?? 'Could not start payment.');

      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: 'ShashankLearn',
        description: 'Premium membership',
        prefill: { name: name ?? undefined, email: email ?? undefined },
        theme: { color: '#4f46e5' },
        handler: async (response: RazorpayResponse) => {
          const { error: verifyErr } = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          if (verifyErr) {
            setError(verifyErr);
            return;
          }
          await refreshProfile();
          onSuccess();
        },
        modal: { ondismiss: () => setLoading(false) },
      });

      rzp.on('payment.failed', (resp: unknown) => {
        const desc = (resp as { error?: { description?: string } })?.error?.description;
        setError(desc ?? 'Payment failed.');
      });

      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return { startCheckout, loading, error };
}
