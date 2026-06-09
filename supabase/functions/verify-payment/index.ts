// Edge Function: verify-payment
// Called by the client from Razorpay Checkout's success handler. Verifies the
// payment signature server-side (HMAC of "order_id|payment_id" with the key
// secret) and, only if valid, marks the payment paid and grants premium.
// This gives instant activation; the webhook is the authoritative backup.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders, hmacHex, safeEqual, PLAN } from '../_shared/cors.ts';

declare const Deno: { env: { get(key: string): string | undefined } };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ error: 'Missing payment fields' }, 400);
    }

    // Verify the signature.
    const expected = await hmacHex(
      KEY_SECRET,
      `${razorpay_order_id}|${razorpay_payment_id}`
    );
    if (!safeEqual(expected, razorpay_signature)) {
      return json({ error: 'Signature verification failed' }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // The order must belong to this user (defends against replaying someone
    // else's order id).
    const { data: payment } = await admin
      .from('payments')
      .select('id, user_id, status')
      .eq('razorpay_order_id', razorpay_order_id)
      .maybeSingle();
    if (!payment || payment.user_id !== user.id) {
      return json({ error: 'Order not found for user' }, 404);
    }

    await admin
      .from('payments')
      .update({ status: 'paid', razorpay_payment_id })
      .eq('razorpay_order_id', razorpay_order_id);

    const expiresAt = await grantPremium(admin, user.id);
    return json({ success: true, premium_expires_at: expiresAt });
  } catch (e) {
    console.error('verify-payment error:', e);
    return json({ error: 'Internal error' }, 500);
  }
});

// Extend premium by PLAN.PREMIUM_DAYS from whichever is later: now or the
// current (non-expired) expiry. Idempotent-ish for instant + webhook paths.
async function grantPremium(
  admin: ReturnType<typeof createClient>,
  userId: string
): Promise<string> {
  const { data: profile } = await admin
    .from('profiles')
    .select('premium_expires_at')
    .eq('id', userId)
    .maybeSingle();

  const now = Date.now();
  const current = profile?.premium_expires_at
    ? new Date(profile.premium_expires_at).getTime()
    : 0;
  const base = Math.max(now, current);
  const expiresAt = new Date(base + PLAN.PREMIUM_DAYS * 86_400_000).toISOString();

  await admin
    .from('profiles')
    .update({ is_premium: true, premium_expires_at: expiresAt })
    .eq('id', userId);

  return expiresAt;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
