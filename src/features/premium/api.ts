import { supabase } from '@/lib/supabase';

export interface OrderData {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface VerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/** Ask the edge function to create a Razorpay order (auth is sent automatically). */
export async function createOrder(): Promise<{
  data: OrderData | null;
  error: string | null;
}> {
  const { data, error } = await supabase.functions.invoke<OrderData>(
    'create-order',
    { body: {} }
  );
  return { data: data ?? null, error: error?.message ?? null };
}

/** Verify the checkout signature server-side and grant premium. */
export async function verifyPayment(
  payload: VerifyPayload
): Promise<{ error: string | null }> {
  const { error } = await supabase.functions.invoke('verify-payment', {
    body: payload,
  });
  return { error: error?.message ?? null };
}
