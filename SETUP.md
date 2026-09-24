# Ruffora launch checklist

This storefront was adapted from the Skitter template. Everything below is still open. Search the code for `CONFIRM` to find each spot that depends on supplier or business details.

## 1. Product facts (from the supplier) — required before advertising

- [ ] Final formula. `site/index.html` currently describes the **proposed** formula (probiotics, prebiotics, digestive enzymes) in the pitch, the "What's inside" accordion and the ingredient cards. Rewrite these to match the formula sheet and label exactly.
- [ ] Benefit wording. The page says Daily Gut helps support healthy digestion, gut balance and normal stool quality. Keep claims to what the label and supplier evidence support; no disease or treatment claims.
- [ ] Chews per tub and daily serving by weight → `product.chewsPerTub` and `product.servingByWeightLb` in `site/catalog.js`. Until set, the serving guide shows size only and says amounts will match the label.
- [ ] Age, pregnancy/nursing and medication guidance from the label (FAQ + serving note).
- [ ] Monthly cadence works for the pack sizes (does 1 tub last a month for a typical dog?).

## 2. Shopify

- [ ] Create the product with three variants priced **$39.99 / $64.99 / $79.98** (1, 2, 3 tubs).
- [ ] Paste the variant IDs into `site/catalog.js`. Checkout refuses any pack left blank.
- [ ] Create a monthly selling plan at **15% off**. That produces $33.99 / $55.24 / $67.98, which the tests check.
- [ ] Storefront API token → `SHOPIFY_STOREFRONT_TOKEN`; store domain → `SHOPIFY_STORE_DOMAIN`; selling plan GID → `SHOPIFY_SELLING_PLAN_ID` (see `.env.example`).
- [ ] Store name "Ruffora", logo, checkout colours (evergreen `#153E38`, ivory background).
- [ ] Shipping profile. Then set `SHIP_ONE_TIME` / `SUBSCRIPTION_FREE_SHIP` in `site/index.html` and `ONE_TIME_SHIPPING_USD` / `SUBSCRIPTION_FREE_SHIPPING` in `scripts/build-pages.js`, and run `npm run pages`. Until then the site says shipping is calculated at checkout.
- [ ] Generate Shopify's privacy policy for Ruffora (Settings > Policies) and compare it with `launch/policies/privacy.html`.
- [ ] Paste the refund, shipping, terms, contact and subscription bodies from `launch/policies/` into Settings > Policies.
- [ ] Add the email inserts in `launch/emails/` (see its README).
- [ ] Theme: add `launch/shopify-home-redirect.liquid` so the Shopify storefront home sends people to the landing page.

## 3. Business details

- [ ] Domain and inbox. The site uses **ruffora.com** and **hello@ruffora.com** as placeholders. Replace them everywhere if different (`site/index.html`, `scripts/build-pages.js`, `launch/`), then run `npm run pages`.
- [ ] `ACCOUNT_URL`, `CHECKOUT_DOMAIN` and `POSTAL_ADDRESS` in `scripts/build-pages.js`; `REPLACE_WITH_SHOP_ID` in `launch/emails/`.
- [ ] Confirm the 30-day money-back guarantee (including opened tubs) is a promise you want to make. It appears on the page, in the refund policy and in emails.
- [ ] Email authentication (SPF, DKIM, DMARC) for the sending domain.

## 4. Photography

Every photo slot shows a labelled placeholder. Add images to `site/assets/`, then:
- Gallery: set each thumbnail button's `data-photo` in `site/index.html`.
- Pack photos (1, 2, 3 tubs): `PACK_PHOTO` in the page script.
- How-it-works steps and the mission block: replace the `<div class="ph"><span>…</span></div>` placeholders with `<div class="ph"><img class="shot" src="…" alt="…"></div>`.

Shot list: tub front; label/directions; chew close-up; hand-feeding; chew over food; dog and owner on a walk; dog by the food bowl; tub at the front door; dog and owner at home; 1-, 2- and 3-tub pack shots.

## 5. Reviews

There is deliberately no reviews section. Add one only with genuine customer reviews.

## 6. Deploy and test

- [ ] New Vercel project from this folder (output directory `site`, from `vercel.json`); add the environment variables.
- [ ] Optional: Meta pixel ID → `META_PIXEL_ID`. Verify PageView/ViewContent/AddToCart/InitiateCheckout in Test Events, then a Purchase after a test order.
- [ ] Place a one-time order and a subscription test order: prices, shipping, taxes, emails, skip/cancel in the customer account, and a refund.
