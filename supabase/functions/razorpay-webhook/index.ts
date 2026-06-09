// Edge Function: razorpay-webhook
// Authoritative, asynchronous reconciliation. Razorpay POSTs payment events
// here; we verify the webhook signature (HMAC of the RAW body with the webhook
// secret), then mark the payment paid and grant premium. Idempotent: safe to
// run alongside verify-payment and on Razorpay retries.
//
// NOTE: this function must be deployed with --no-verify-jwt (Razorpay won't
// send a Supabase JWT). See functions/README.md.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { hmacHex, safeEqual, PLAN } from '../_shared/cors.ts';

declare const Deno: { env: { get(key: string): string | undefined } };

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!;

    // Verify against the EXACT raw body bytes (re-serializing would break HMAC).
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') ?? '';
    const expected = await hmacHex(WEBHOOK_SECRET, rawBody);
    if (!safeEqual(expected, signature)) {
      console.error('webhook signature mismatch');
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const type = event?.event as string | undefined;

    // We care about successful capture / order paid.
    if (type !== 'payment.captured' && type !== 'order.paid') {
      return new Response('ignored', { status: 200 });
    }

    const entity =
      event?.payload?.payment?.entity ?? event?.payload?.order?.entity ?? {};
    const orderId: string | undefined = entity.order_id ?? entity.id;
    const paymentId: string | undefined = entity.id;
    const userIdFromNotes: string | undefined = entity?.notes?.user_id;

    if (!orderId) return new Response('no order id', { status: 200 });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: payment } = await admin
      .from('payments')
      .select('user_id, status')
      .eq('razorpay_order_id', orderId)
      .maybeSingle();

    const userId = payment?.user_id ?? userIdFromNotes;
    if (!userId) return new Response('user not resolved', { status: 200 });

    // Idempotent: if already paid, just ack.
    if (payment?.status === 'paid') {
      return new Response('already processed', { status: 200 });
    }

    await admin
      .from('payments')
      .update({
        status: 'paid',
        razorpay_payment_id: type === 'payment.captured' ? paymentId : null,
      })
      .eq('razorpay_order_id', orderId);

    // Grant / extend premium.
    const { data: profile } = await admin
      .from('profiles')
      .select('premium_expires_at')
      .eq('id', userId)
      .maybeSingle();
    const now = Date.now();
    const current = profile?.premium_expires_at
      ? new Date(profile.premium_expires_at).getTime()
      : 0;
    const expiresAt = new Date(
      Math.max(now, current) + PLAN.PREMIUM_DAYS * 86_400_000
    ).toISOString();

    await admin
      .from('profiles')
      .update({ is_premium: true, premium_expires_at: expiresAt })
      .eq('id', userId);

    return new Response('ok', { status: 200 });
  } catch (e) {
    console.error('razorpay-webhook error:', e);
    // 500 so Razorpay retries.
    return new Response('error', { status: 500 });
  }
});
