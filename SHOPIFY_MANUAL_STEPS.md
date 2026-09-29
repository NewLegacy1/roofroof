# Shopify steps only you can click

The connector here has no permission for legal policies, notification templates, live-theme edits or checkout branding (Plus only), so these are yours. Everything else in Shopify is already done (see DECISIONS.md).

## 1. Policies (Settings > Policies)
Paste each file's contents into the matching box, using the "<>" (show HTML) button. Files are in `launch/policies/`:

| Shopify box | File |
| --- | --- |
| Refund policy | refunds.html |
| Shipping policy | shipping.html |
| Terms of service | terms.html |
| Subscription policy | subscriptions.html |
| Contact information | contact.html |
| Privacy policy | Shopify already generated one. Keep it until we have a mailing address, then compare with privacy.html. |

Note: links inside the pasted terms and subscriptions text point at `/subscriptions/`, `/shipping/` and `/refunds/`. Replace them with `https://ruffora.shop/...` in Shopify (the site will serve those pages after deploy).

## 2. Email inserts (Settings > Notifications > Customer notifications)
Follow `launch/emails/README.md`. Paste `subscription.liquid` into the subscription confirmation template and `cancellation.liquid` into Order canceled.

## 3. Home redirect (Online Store > Themes > ... > Edit code)
Open `layout/theme.liquid`, paste `launch/shopify-home-redirect.liquid` just before `</head>`. It sends the Shopify storefront home to https://ruffora.shop/.

## 4. Checkout look (Settings > Checkout > Customize; Basic plan allows logo and colours only)
- Logo: `site/assets/logo-wordmark.png`
- Accent / buttons: `#153E38`; background: `#F7F2E8`

## 5. Store logo/brand (Settings > Brand)
Logo `site/assets/logo-wordmark.png`, square mark `site/assets/logo-mark.png`.

## 6. Failed payments (Apps > Subscriptions > Settings)
Retry 3 times over about 7 days. Turn off customer emails for retries 1-3 (owner decision), keep the final-failure email if the app offers one.

## 7. Confirm
- Customer accounts are on and their URL is https://account.ruffora.shop (this may be account.ruffora.shop; the chat message said "refora"). Tell me if it is different.
