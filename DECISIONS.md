# Ruffora decisions log

Format: date · decision · reason. Anything not confirmed stays CONFIRM.

## 2026-09-29 (Phase 0, batch 1)

| Topic | Decision | Reason / status |
| --- | --- | --- |
| Business name | "Ruffora". No entity type shown. | Not a registered business yet (owner). Dictation wrote "Refora"; assumed Ruffora, matching the site. |
| Domain | ruffora.shop | Owner. Site placeholders currently say ruffora.com, so they change. |
| Support email | support@ruffora.shop | Owner said "support at ruffora.shop". Needs a real inbox. CONFIRM it exists. |
| Postal address | OPEN | Owner gave an email, not an address. A physical address is needed for the privacy policy, email footers and Shopify. CONFIRM. |
| Shopify store domain | ng7vb0-ew.myshopify.com | Owner. |
| Storefront token | Public token given in chat, will go in Vercel as SHOPIFY_STOREFRONT_TOKEN. | Private `shpat_` token was pasted in chat: NOT used or stored; rotate it. |
| Prices | $34 / $55 / $68 for 1 / 2 / 3 tubs; 3 tubs = "Buy 2, Get 1 Free" | Confirmed by owner. |
| 30-day money-back incl. opened tubs | Confirmed | Owner. |
| Fulfillment | Supplier dropshipper; tubs in stock; supplier is added to the store and fulfills orders | Owner. Processing time unknown: CONFIRM with supplier. |
| Weights | Unknown | Owner will get them. Shipping rates wait on this. |
| SKUs | Default RUF-DG-1 / -2 / -3 unless changed | Proposed, not yet confirmed. |
| Service owner and response time | OPEN | Not answered. |

## Blocker found 2026-09-29

The Shopify connector in this session is linked to a store named **aerase** (checkout.aerase.shop, Canada), not ng7vb0-ew.myshopify.com. Nothing has been changed in it. Do not use that connection for Ruffora.

## 2026-09-29 (Phase 0, batch 2 + connector)

| Topic | Decision | Reason / status |
| --- | --- | --- |
| Sell options | Subscription-only | Owner; matches current build. |
| Cadence | Monthly only | Owner. |
| Cancel method | App's passwordless customer portal | Owner; meets online-cancel expectations. Site, policies and emails must be reworded (currently "email to cancel"). |
| Customer changes | Customers may change "whatever they want" (skip, pause, cancel, change tub count) | Owner. Tub count = variant swap: app must support it. Test in Phase 5. |
| Dunning | 3 retries over about 7 days. No customer emails on retries 1-3; notify only at the 4th (final) failure | Owner. Risk noted: customer not told until final failure. |
| Renewal reminder emails | None | Owner decision. Risk noted: keep deferred for counsel review of state auto-renewal rules. |
| Budget | $0/month unless the chosen app requires more | Owner. |
| Volume | Under 100 orders/month for first 3 months | Owner. |
| Shopify connector | Reconnected to the Ruffora store (checkout.ruffora.shop, support@ruffora.shop, plan Basic) | Verified with get-shop-info. |
| **Store currency / country** | **Store reports CAD and Canada. Requirement is USD, US-only sales.** | OPEN: must be resolved before products and prices are created. |

## 2026-09-29 (Phase 1-2 start)

| Topic | Decision | Reason / status |
| --- | --- | --- |
| Subscription app | Shopify Subscriptions (free) | Owner choice after comparison (Seal $5.95/mo is the fallback if the portal can't change tub count). |
| Shipping | Free shipping on all packs | Owner; subscription-only. Set FREE_SHIPPING=true in site/index.html and scripts/build-pages.js when the profile is live. |
| Regions | Contiguous US only | Owner. Owner mentioned a Hawaii market: none exists in Shopify (only Canada and United States markets are enabled). Canada market to be disabled; AK/HI/territories/PO boxes excluded via shipping zone. |
| Tax | No US sales-tax registration yet | Owner asked to "collect". Tax can only be collected legally in states where registered: register first, then enable per state. OPEN. |
| Wallets | Shop Pay + Shopify Payments; no PayPal | Owner. Apple Pay / Google Pay come with Shopify Payments. |
| Payouts | Owner sets up bank account | Owner. |
| Store currency | Now USD (verified). Store/billing country still Canada. | Owner fixed. |
| Product | Draft created: Ruffora Daily Gut, gid://shopify/Product/10274753380419; variants 1 Tub $34 (RUF-DG-1), 2 Tubs $55 (RUF-DG-2), 3 Tubs $68 (RUF-DG-3); inventory tracked; weights blank | Created via connector as DRAFT; not published. Variant IDs pasted into site/catalog.js. |

## 2026-09-29 (Phase 2 progress)

| Topic | Decision | Reason / status |
| --- | --- | --- |
| Canada market | Set to DRAFT (disabled) via marketUpdate; United States market stays enabled | Owner request; verified no errors. |
| Selling plan | Group "Monthly" gid://shopify/SellingPlanGroup/4525031491, plan "Deliver every month" gid://shopify/SellingPlan/7093715011; attached to all 3 variants; no discount (verified via Storefront API: checkout charge = 34 / 55 / 68, no price adjustments) | Owner created in Shopify Subscriptions app; ID read via Admin API. |
| Storefront token | Public token verified working (product + selling-plan query returns USD prices). Stored in local git-ignored .env only. | Owner supplied; private token not used. |
| Support | support@ruffora.shop, reply within 1-2 business days | Owner. |
| Postal address | None ("no physical mailing address") | OPEN: policies/emails/Shopify Payments need one. Consider a virtual mailbox. |
| Weights / processing time | Unknown; deferred | Owner. Free shipping so rates don't depend on weight, but customs/fulfillment does. |
| Shopify Payments | Available | Owner confirmed. |
| requiresSellingPlan | Currently FALSE: product can still be bought one-time | OPEN: must be turned off (Purchase options). |
| Inventory | Variants report availableForSale true; quantities not yet set | OPEN: set stock or ask supplier integration. |

## 2026-09-29 (shipping, inventory, address)

| Topic | Decision | Reason / status |
| --- | --- | --- |
| Shipping | General profile: old Canada zone deleted; new zone "Contiguous US" (48 states + DC) with "Free standard shipping" $0 USD. shipsToCountries = [US]. FREE_SHIPPING=true in site/index.html and scripts/build-pages.js; pages rebuilt. | Owner: free shipping, contiguous US only. PO boxes cannot be blocked by a zone: CONFIRM handling (supplier or checkout note). Ship-from location "Shop location" address not yet verified. |
| Inventory | Tracking turned OFF on all 3 variants | Supplier has ample stock (owner); avoids 0-stock confusion. Risk: no oversell guard; revisit if supplier can run out. |
| Sales tax | Not collecting for now | Owner: "no tax collection, that's fine" (interpreted). No US registrations exist. Legal blocker for go-live remains: CONFIRM with an accountant. |
| Mailing address | Owner gave "13 Chatterson Drive" only | INCOMPLETE: city, state/province, postal code, country needed. POSTAL_ADDRESS in scripts/build-pages.js not yet changed. |

## 2026-09-29 (images, wording, policies)

| Topic | Decision | Reason / status |
| --- | --- | --- |
| Product images | 11 site images uploaded to the Shopify product (gallery order as on site; pack-1/2/3 attached to their variants; alt text written from the images) | Done via staged upload; all READY. crumble-food.webp not uploaded (site-only). |
| Cancel wording | Site, help pages, policies and subscription/cancellation email inserts now describe the online customer portal; "email to cancel" removed | Owner chose app portal. |
| Domain / email swap | ruffora.com -> ruffora.shop, hello@ -> support@ruffora.shop everywhere in repo | Owner. |
| Customer accounts URL | account.ruffora.shop (owner said "refora"; assumed dictation error) | CONFIRM. |
| Shipping policy | Now states contiguous US only | Matches shipping zone. |
| One-time purchase | Owner: not a concern because nobody can reach it (site checkout always adds the plan) | Accepted risk: Shopify's own product URL remains buyable one-time; home redirect covers only the homepage. |
| PO boxes / ship-from | Not a concern; supplier ships | Owner. |
| Legal policies, notification templates, live theme, checkout branding | Cannot be written through the connector (missing scope / Plus-only) | Manual steps in SHOPIFY_MANUAL_STEPS.md. |
