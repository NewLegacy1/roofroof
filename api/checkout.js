const { pack } = require("../lib/catalog");
const { gift } = require("../site/catalog");
const { cleanAttribution, CAMPAIGN_KEYS } = require('../lib/attribution');
const { randomUUID } = require('node:crypto');
const { trackingHeaders, forwardTracking } = require('../lib/shopify-tracking');

const API_VERSION = "2026-07";
const CHECKOUT_HOST = process.env.SHOPIFY_CHECKOUT_HOST || "";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function shopDomain() {
  const raw = process.env.SHOPIFY_STORE_DOMAIN || "";
  return raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function storefrontToken() {
  return process.env.SHOPIFY_STOREFRONT_TOKEN || "";
}

function buyerIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers["x-real-ip"] || "";
}

function checkoutUrl(raw, attribution) {
  const url = new URL(raw);
  // Switch to the branded checkout domain once it is connected in Shopify.
  if (CHECKOUT_HOST) url.hostname = CHECKOUT_HOST;
  url.searchParams.set("channel", "headless-storefronts");
  for (const key of [...CAMPAIGN_KEYS, 'fbclid']) {
    if (attribution[key]) url.searchParams.set(key, attribution[key]);
  }
  return url.toString();
}

async function storefrontGraphql(query, variables, ip, req, res) {
  const domain = shopDomain();
  const token = storefrontToken();
  if (!domain || !token) {
    throw new Error("Shopify is not configured.");
  }

  const headers = {
    ...trackingHeaders(req),
    "Content-Type": "application/json",
    "X-Shopify-Storefront-Access-Token": token,
  };
  if (ip) {
    headers["Shopify-Storefront-Buyer-IP"] = ip;
  }

  const response = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors) {
    const message = payload.errors?.[0]?.message || "Shopify request failed.";
    throw new Error(message);
  }
  forwardTracking(response, res);
  return payload.data;
}

function resolveCart(body) {
  const packId = Number(body.pack);
  if (![1, 2, 3].includes(packId)) {
    throw new Error("Choose a valid pack.");
  }

  const offer = pack(packId);
  if (!offer || !offer.variantGid) {
    throw new Error("This pack is not configured. Please contact us.");
  }

  const autoRefill = body.autoRefill !== false;
  if (autoRefill && !offer.sellingPlanGid) {
    throw new Error("AutoRefill is not configured yet. Please contact us.");
  }
  const lines = [{
    merchandiseId: offer.variantGid,
    quantity: 1,
    ...(autoRefill ? { sellingPlanId: offer.sellingPlanGid } : {}),
  }];
  if (offer.gift) lines.push({ merchandiseId: gift.variantGid, quantity: 1 });
  return {
    offer,
    autoRefill,
    lines,
    expectedSubtotal: autoRefill ? offer.autoRefillPrice : offer.oneTimePrice,
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    json(res, 405, { ok: false, message: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const selection = resolveCart(body);
    const attribution = cleanAttribution(body.attribution);

    const data = await storefrontGraphql(
      `mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            checkoutUrl
            cost { subtotalAmount { amount currencyCode } }
            lines(first: 10) {
              nodes {
                merchandise { ... on ProductVariant { id } }
                cost { totalAmount { amount currencyCode } }
                discountAllocations { discountedAmount { amount currencyCode } }
              }
            }
          }
          userErrors { field message }
        }
      }`,
      {
        input: {
          lines: selection.lines,
          buyerIdentity: { countryCode: "US" },
          attributes: Object.entries(attribution).map(([key, value]) => ({ key, value })),
        },
      },
      buyerIp(req),
      req,
      res,
    );

    const error = data.cartCreate?.userErrors?.[0]?.message;
    if (error) {
      json(res, 409, { ok: false, message: error });
      return;
    }

    const rawUrl = data.cartCreate?.cart?.checkoutUrl;
    if (!rawUrl) {
      json(res, 502, { ok: false, message: "Shopify did not return a checkout URL." });
      return;
    }

    const cart = data.cartCreate.cart;
    const subtotal = Number(cart.cost.subtotalAmount.amount);
    if (selection.offer.gift && subtotal > selection.expectedSubtotal + 0.01) {
      json(res, 409, { ok: false, message: "Your free gift discount is still syncing. Please try again shortly." });
      return;
    }
    json(res, 200, {
      ok: true,
      checkoutUrl: checkoutUrl(rawUrl, attribution),
      analytics: {
        eventId: randomUUID(),
        currency: cart.cost.subtotalAmount.currencyCode,
        value: subtotal,
        variantId: selection.offer.variantId,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start checkout.";
    json(res, message.includes("not configured") || message.includes("Choose") ? 409 : 502, {
      ok: false,
      message,
    });
  }
};
