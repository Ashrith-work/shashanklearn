# Edge Functions — Razorpay premium flow

Three Deno functions implement the upgrade. Premium is **only ever granted
server-side**, after a verified signature, by the service role.

| Function | Trigger | Auth | Does |
| -------- | ------- | ---- | ---- |
| `create-order` | Client "Go Premium" | Supabase JWT | Creates a Razorpay order (price set here), inserts a `payments` row as `created` |
| `verify-payment` | Razorpay Checkout success handler | Supabase JWT | Verifies `HMAC(order_id\|payment_id, key_secret)`, marks paid, grants premium (instant) |
| `razorpay-webhook` | Razorpay server webhook | Webhook HMAC | Verifies `HMAC(rawBody, webhook_secret)`, reconciles payment + premium (authoritative, idempotent) |

## Secrets

```bash
supabase secrets set \
  RAZORPAY_KEY_ID=rzp_test_xxx \
  RAZORPAY_KEY_SECRET=xxxxxxxx \
  RAZORPAY_WEBHOOK_SECRET=xxxxxxxx
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected
automatically into the function runtime.

## Deploy

```bash
supabase functions deploy create-order
supabase functions deploy verify-payment
# Razorpay does NOT send a Supabase JWT — disable JWT verification for the webhook:
supabase functions deploy razorpay-webhook --no-verify-jwt
```

## Configure the webhook in Razorpay

Dashboard → Settings → Webhooks → add:

- URL: `https://<project-ref>.functions.supabase.co/razorpay-webhook`
- Secret: the same value as `RAZORPAY_WEBHOOK_SECRET`
- Events: `payment.captured`, `order.paid`

## Why both verify-payment AND the webhook?

`verify-payment` activates premium instantly for good UX. The webhook is the
source of truth if the browser closes before the handler runs, or for refunds /
disputes later. Both are idempotent (the webhook no-ops if already `paid`).
