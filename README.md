# Ruffora storefront

Landing page for **Ruffora Daily Gut** (Digestive Support Soft Chews for Dogs), hosted on Vercel and checking out through Shopify.

| Path | What it is |
| --- | --- |
| `site/` | Static site. `index.html` is the product page; help/policy pages are generated. |
| `site/catalog.js` | Packs, prices, Shopify variant IDs, chews per tub and serving table. Shared by the page and the API. |
| `site/tracking.js` | Consent banner, Meta pixel (after consent) and UTM capture. |
| `api/checkout.js` | Creates a Shopify subscription cart for the chosen pack and returns the checkout URL. |
| `scripts/build-pages.js` | Builds help/policy pages from the brand config at the top of the file. |
| `launch/` | Shopify policy bodies, email inserts and the storefront-home redirect. |

```bash
npm test          # checkout + pricing tests
npm run pages     # rebuild help/policy pages after editing scripts/build-pages.js
npm run dev       # static preview at http://localhost:8080 (use `vercel dev` to exercise /api)
node scripts/build-preview.js <dir>   # self-contained shareable copy (no checkout/tracking)
```

Brand: evergreen `#153E38`, ivory `#F7F2E8`, apricot `#E9AA80`, sage `#CBD8C3`, ink `#202C28`; Manrope. Logo files are in `site/assets/` (source in `site/assets/brand/`).

Launch checklist: [SETUP.md](SETUP.md).
