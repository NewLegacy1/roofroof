const { trackingHeaders, forwardTracking } = require('../lib/shopify-tracking');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  const reply = (status, data) => { res.statusCode = status; res.end(JSON.stringify(data)); };
  if (req.method !== 'POST') return reply(405, { error: 'Method not allowed' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (typeof body?.consent !== 'boolean') return reply(400, { error: 'Consent required' });
    const domain = (process.env.SHOPIFY_STORE_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!/^[a-z0-9-]+\.myshopify\.com$/i.test(domain) || !process.env.SHOPIFY_STOREFRONT_TOKEN) {
      return reply(503, { error: 'Shopify is not configured' });
    }
    const consent = body.consent && req.headers['sec-gpc'] !== '1';
    const landingPage = typeof body.url === 'string' ? body.url.slice(0, 2000) : '';
    const referrer = typeof body.referrer === 'string' ? body.referrer.slice(0, 2000) : '';
    // This is Shopify's consent-management query, also used by its privacy SDK.
    // Tokens must be issued by Shopify, not generated locally.
    const query = `query {
      shop { id }
      consentManagement { cookies(visitorConsent: {
        analytics: ${consent}, marketing: ${consent}, preferences: ${consent}, saleOfData: ${consent}
      }, landingPage: ${JSON.stringify(landingPage)}, origReferrer: ${JSON.stringify(referrer)}) { cookieDomain } }
    }`;
    const response = await fetch(`https://${domain}/api/unstable/graphql.json`, {
      method: 'POST',
      headers: {
        ...trackingHeaders(req),
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_TOKEN,
        'Shopify-Storefront-Buyer-IP': (req.headers['x-forwarded-for'] || '').split(',')[0].trim(),
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await response.json();
    if (!response.ok || data.errors || !data.data?.shop?.id) return reply(502, { error: 'Shopify session setup failed' });
    forwardTracking(response, res);
    return reply(200, { shopId: data.data.shop.id });
  } catch {
    return reply(502, { error: 'Shopify session setup failed' });
  }
};
