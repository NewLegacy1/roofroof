// Only Shopify cookies belong in requests to Shopify, never our other cookies.
function trackingHeaders(req) {
  const headers = {};
  const cookies = (req.headers.cookie || '').split(';').map(s => s.trim())
    .filter(s => /^(?:_shopify_[\w]+|_tracking_consent|_landing_page|_orig_referrer)=/.test(s));
  if (cookies.length) headers.Cookie = cookies.join('; ');
  for (const name of ['user-agent', 'origin', 'referer']) {
    if (req.headers[name]) headers[name] = req.headers[name];
  }
  for (const name of ['x-shopify-uniquetoken', 'x-shopify-visittoken']) {
    const value = req.headers[name];
    if (typeof value === 'string' && /^[\w-]{1,128}$/.test(value)) headers[name] = value;
  }
  return headers;
}

function forwardTracking(response, res, cookieDomain) {
  const cookies = response.headers?.getSetCookie?.() || [];
  const scoped = cookies.filter(s => /^(?:_shopify_[\w]+|_tracking_consent|_landing_page|_orig_referrer)=/.test(s))
    // Share Shopify's identity and consent cookies with the checkout subdomain
    // so one storefront visit does not become a second checkout session.
    .map(s => {
      const withoutDomain = s.replace(/;\s*Domain=[^;]*/ig, '');
      return cookieDomain ? `${withoutDomain}; Domain=${cookieDomain}` : withoutDomain;
    });
  if (scoped.length) res.setHeader('Set-Cookie', scoped);
  const timing = response.headers?.get?.('server-timing');
  if (timing) res.setHeader('Server-Timing', timing);
}
module.exports = { trackingHeaders, forwardTracking };
