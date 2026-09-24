# Ruffora email copy and setup

Use Shopify's existing transactional templates with the Ruffora logo (`site/assets/logo-wordmark.png`, 240px wide), accent colour evergreen `#153E38`, and `hello@ruffora.com` as sender/reply-to. Keep the native order items, totals, payment status, tracking links, delivery exceptions and subscription information.

The `.liquid` files here are **short insert blocks**, not replacement templates. Paste each one after the native introductory message. Do not paste them over a complete Shopify template or insert them twice. Replace `REPLACE_WITH_SHOP_ID` with the ID from your customer account URL.

| Notification | Suggested subject | Insert |
| --- | --- | --- |
| Order confirmation | Your Ruffora order {{ name }} | order-confirmation.liquid |
| Shipping confirmation | Daily Gut is on its way: order {{ name }} | shipping-confirmation.liquid |
| Order refund | Refund update for Ruffora order {{ name }} | refund.liquid |
| Order canceled | Ruffora order {{ name }} has been canceled | cancellation.liquid |
| New subscription order | Your Ruffora subscription | subscription.liquid |

## Abandoned-checkout recovery

Use Shopify Messaging's native abandoned-checkout automation. Send only to eligible recipients under Shopify's consent and suppression rules. Keep the platform's checkout-recovery button and unsubscribe/footer blocks.

**Subject:** Still deciding on Daily Gut?

**Preview:** Your dog's Daily Gut is waiting.

**Body:** You left Daily Gut in your checkout. If you're still deciding, every order comes with a 30-day money-back guarantee, even if the tub is open. Not sure which supply to pick? Reply to this email and we'll help.

**Button:** Return to my checkout

## Optional welcome email (draft)

**Subject:** Welcome to Ruffora

**Body:** Thanks for joining Ruffora. We make everyday dog care simpler, starting with Daily Gut, a soft chew for daily digestive support. Expect practical tips, not inbox clutter. More good days together.
