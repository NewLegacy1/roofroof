const { pack } = require("../lib/catalog");
const { cleanAttribution, CAMPAIGN_KEYS } = require('../lib/attribution');
const { randomUUID } = require('node:crypto');

const API_VERSION = "2026-07";
const CHECKOUT_HOST = process.env.SHOPIFY_CHECKOUT_HOST || "";
const SELLING_PLAN_ID = process.env.SHOPIFY_SELLING_PLAN_ID || "";

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

async function storefrontGraphql(query, variables, ip) {
  const domain = shopDomain();
  const token = storefrontToken();
  if (!domain || !token) {
    throw new Error("Shopify is not configured.");
  }

  const headers = {
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
  return payload.data;
}

function resolveLine(body) {
  const packId = Number(body.pack);
  if (![1, 2, 3].includes(packId)) {
    throw new Error("Choose a valid pack.");
  }

  const offer = pack(packId);
  if (!offer || !offer.variantGid) {
    throw new Error("This pack is not configured. Please contact us.");
  }

  // Daily Gut is sold by subscription only, so every cart line carries the monthly selling plan.
  if (!SELLING_PLAN_ID) {
    throw new Error("Subscriptions are not configured yet. Please contact us.");
  }
  return { merchandiseId: offer.variantGid, quantity: 1, sellingPlanId: SELLING_PLAN_ID };
}

module.exports = async function handler(req, res) {
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
    const line = resolveLine(body);
    const attribution = cleanAttribution(body.attribution);

    const data = await storefrontGraphql(
      `mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            checkoutUrl
            cost { subtotalAmount { amount currencyCode } }
            lines(first: 1) { nodes { merchandise { ... on ProductVariant { id } } } }
          }
          userErrors { field message }
        }
      }`,
      {
        input: {
          lines: [
            {
              merchandiseId: line.merchandiseId,
              quantity: line.quantity,
              ...(line.sellingPlanId ? { sellingPlanId: line.sellingPlanId } : {}),
            },
          ],
          buyerIdentity: { countryCode: "US" },
          attributes: Object.entries(attribution).map(([key, value]) => ({ key, value })),
        },
      },
      buyerIp(req),
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
    json(res, 200, {
      ok: true,
      checkoutUrl: checkoutUrl(rawUrl, attribution),
      analytics: {
        eventId: randomUUID(),
        currency: cart.cost.subtotalAmount.currencyCode,
        value: Number(cart.cost.subtotalAmount.amount),
        variantId: cart.lines.nodes[0]?.merchandise?.id?.split('/').pop(),
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
