// Edge Function: create-order
// Authenticated user requests a premium order. We create a Razorpay order
// (price set server-side), record a `payments` row as 'created', and return the
// data the client needs to open Razorpay Checkout. No premium is granted here.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders, PLAN } from '../_shared/cors.ts';

declare const Deno: { env: { get(key: string): string | undefined } };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!;
    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    // Identify the caller from their JWT.
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    // Create the Razorpay order.
    const basic = btoa(`${KEY_ID}:${KEY_SECRET}`);
    const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: PLAN.PRICE_PAISE,
        currency: PLAN.CURRENCY,
        receipt: `rcpt_${user.id.slice(0, 8)}_${Date.now()}`,
        notes: { user_id: user.id },
      }),
    });

    if (!orderRes.ok) {
      const detail = await orderRes.text();
      console.error('Razorpay order failed:', detail);
      return json({ error: 'Could not create payment order' }, 502);
    }
    const order = (await orderRes.json()) as { id: string; amount: number; currency: string };

    // Record the pending payment with the service role (bypasses RLS).
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { error: insErr } = await admin.from('payments').insert({
      user_id: user.id,
      razorpay_order_id: order.id,
      amount: order.amount,
      status: 'created',
    });
    if (insErr) {
      console.error('payments insert failed:', insErr.message);
      return json({ error: 'Could not record payment' }, 500);
    }

    return json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: KEY_ID,
    });
  } catch (e) {
    console.error('create-order error:', e);
    return json({ error: 'Internal error' }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
