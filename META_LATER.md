# Meta pixel: do this when the Meta account exists

Nothing Meta-related is created or enabled today. The consent banner and tracking code (`site/tracking.js`) are in place and stay inert while `META_PIXEL_ID` is empty.

1. **Create the pixel.** In Meta Events Manager, create a Meta Pixel (dataset) for Ruffora. Copy the numeric pixel ID.
2. **Add it to Vercel.** Project > Settings > Environment Variables > add `META_PIXEL_ID` = the ID, for Production (and Preview if you want to test there). Redeploy. `api/public-config.js` serves it to the page, and the pixel loads only after a visitor accepts the consent banner.
3. **Purchases via Shopify.** In Shopify admin, add the Facebook & Instagram (Meta) sales channel, connect the same pixel/dataset, and set data sharing to Maximum/Enhanced if you want Conversions API (server events). The Purchase event fires from Shopify's checkout, not from our site.
4. **Deduplicate.** Browser and server events for the same action must share an event ID. Our AddToCart/InitiateCheckout events send an `eventId` (see `analytics.eventId` in `api/checkout.js`). Confirm in Events Manager > Overview that events show "Deduplicated" and that browser vs server counts do not double.
5. **Verify in Test Events.** Open Events Manager > Test Events, paste your site URL, accept the banner, then confirm each of: PageView, ViewContent, AddToCart, InitiateCheckout. Place one test-mode order and confirm Purchase arrives with the correct value (34 / 55 / 68) in USD.
6. **Consent check.** Decline the banner in a private window and confirm no events appear.
