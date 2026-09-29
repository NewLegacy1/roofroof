const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/shopify-session');
const { trackingHeaders, forwardTracking } = require('../lib/shopify-tracking');
function response() {
  return { headers: {}, setHeader(k,v) { this.headers[k] = v; }, end(v) { this.body = JSON.parse(v); } };
}
test('only Shopify cookies and valid session tokens reach Shopify', () => {
  assert.deepEqual(trackingHeaders({headers: {
    cookie: 'secret=private; _shopify_analytics=issued; _tracking_consent=consent; _fbp=meta',
    'x-shopify-visittoken': 'visit-token', 'x-shopify-uniquetoken': 'bad\r\nvalue',
  }}), { Cookie: '_shopify_analytics=issued; _tracking_consent=consent', 'x-shopify-visittoken': 'visit-token' });
});
test('Shopify-issued cookies and timing are forwarded without foreign cookie domains', () => {
  const res = response();
  forwardTracking({headers: {
    getSetCookie: () => ['_shopify_analytics=issued; Domain=example.myshopify.com; Path=/; Secure; HttpOnly', 'unrelated=no'],
    get: () => '_y;desc="visitor", _s;desc="visit", _cmp;desc="consent"',
  }}, res);
  assert.deepEqual(res.headers['Set-Cookie'], ['_shopify_analytics=issued; Path=/; Secure; HttpOnly']);
  assert.match(res.headers['Server-Timing'], /visitor/);
});
test('session setup passes explicit consent and preserves Shopify visitor identity', async () => {
  process.env.SHOPIFY_STORE_DOMAIN = 'example.myshopify.com';
  process.env.SHOPIFY_STOREFRONT_TOKEN = 'test-public-token';
  const original = global.fetch;
  try {
    for (const [consent, gpc, expected] of [[true, undefined, true], [false, undefined, false], [true, '1', false]]) {
      let sent;
      global.fetch = async (url, options) => {
        sent = options;
        assert.equal(url, 'https://ng7vb0-ew.myshopify.com/api/unstable/graphql.json');
        assert.equal(options.headers['Shopify-Storefront-Id'], '1000181287');
        assert.equal(options.headers['X-Shopify-Storefront-Access-Token'], require('../lib/hydrogen-config').publicToken);
        return { ok: true, headers: new Headers({'server-timing':'_s;desc="shopify-visit"'}), json:async()=>({data:{shop:{id:'gid://shopify/Shop/123'}}}) };
      };
      const res = response();
      await handler({method:'POST', headers:{cookie:'_shopify_analytics=existing', 'sec-gpc':gpc}, body:{consent,url:'https://ruffora.shop/',referrer:'https://example.com/'}}, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['Cache-Control'], 'no-store');
      assert.equal(sent.headers.Cookie, '_shopify_analytics=existing');
      assert.match(JSON.parse(sent.body).query, new RegExp(`analytics: ${expected}`));
      assert.equal(res.body.shopId, 'gid://shopify/Shop/123');
      assert.equal(res.body.storefrontId, '1000181287');
      assert.equal(JSON.stringify(res.body).includes('test-public-token'), false);
    }
  } finally { global.fetch = original; }
});
test('missing consent cannot initialize analytics', async () => {
  const res = response();
  await handler({method:'POST', headers:{}, body:{}}, res);
  assert.equal(res.statusCode, 400);
});
test('upstream errors fail visibly without claiming a session exists', async () => {
  const original = global.fetch;
  global.fetch = async () => ({ok:true, json:async()=>({errors:[{message:'Invalid query'}]})});
  try {
    const res = response();
    await handler({method:'POST',headers:{},body:{consent:true}},res);
    assert.equal(res.statusCode,502);
    assert.equal(res.body.shopId,undefined);
  } finally {global.fetch=original;}
});
