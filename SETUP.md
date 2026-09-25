# Ruffora launch checklist

This storefront was adapted from the Skitter template. Everything below is still open. Search the code for `CONFIRM` to find each spot that depends on supplier or business details.

## 1. Product facts (from the supplier) — required before advertising

- [x] Ingredient carousel matches the label: 8-strain blend (3 billion CFU), pumpkin 350 mg, honey 140 mg, inulin 75 mg, FOS 50 mg per chew.
- [ ] FOS card text was written by us (the supplied copy stopped at its heading). Honey was changed from "probiotic" to "prebiotic properties".
- [ ] "Research-backed" heading: keep the supporting studies on file.
- [ ] Benefit wording. The page says Daily Gut helps support healthy digestion, gut balance and normal stool quality. Keep claims to what the label and supplier evidence support; no disease or treatment claims.
- [x] 30 chews per tub (4 g each), 3 billion CFU per chew, from the product facts label.
- [ ] Daily serving (1 / 2 / 3 chews for under 11 kg / 11–34 kg / over 34 kg) matches the label directions.
- [ ] Age, pregnancy/nursing and medication guidance from the label (FAQ + serving note).
- [ ] Monthly cadence works for the pack sizes (does 1 tub last a month for a typical dog?).

## 1b. Vet endorsement

- [x] Dr. Levi Cohen is a real US veterinarian (confirmed by the owner).
- [ ] The page currently shows the placeholder name **Dr. Epry Jeffstein** on Dr. Cohen's photo. Before launch, the name must match the vet in the photo who approved the quote.
- [ ] Keep his written approval of the exact quote and photo on file. Keep the "Vet Consultant to Ruffora" disclosure, since FTC endorsement rules require disclosing the relationship.
- [ ] His quote mentions **skin**. Nothing else on the page makes a skin claim, and none of the listed ingredients is described as supporting skin. Get this backed by evidence or ask him to reword it.

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

Product images are in `site/assets/product/`. The buy-box gallery order is set in `site/index.html`:

1. Selected pack: `pack-1`, `pack-2` or `pack-3`, switched by `PACK_PHOTO` when the dog size or supply changes
2. `benefits`: 8 strains, 3 billion CFU
3. `five-actives`: ingredient amounts
4. `comparison`: vs. probiotics alone
5. `two-ways`: by hand or over food
6. `hand-feed`
7. `open-tub`
8. `label`: product facts
9. `lifestyle-couch`

`hand-feed`, `crumble-food` and `pack-3` also illustrate "How it works"; `lifestyle-couch` is the mission photo.

- [ ] These images show the final tub and label. Reshoot if the packaging changes before launch.

## 5. Reviews

There is deliberately no reviews section. Add one only with genuine customer reviews.

## 6. Deploy and test

- [ ] New Vercel project from this folder (output directory `site`, from `vercel.json`); add the environment variables.
- [ ] Optional: Meta pixel ID → `META_PIXEL_ID`. Verify PageView/ViewContent/AddToCart/InitiateCheckout in Test Events, then a Purchase after a test order.
- [ ] Place a one-time order and a subscription test order: prices, shipping, taxes, emails, skip/cancel in the customer account, and a refund.
