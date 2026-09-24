const test = require('node:test');
const assert = require('node:assert/strict');
process.env.SHOPIFY_STORE_DOMAIN = 'example.myshopify.com';
process.env.SHOPIFY_STOREFRONT_TOKEN = 'test-token';
process.env.SHOPIFY_SELLING_PLAN_ID = 'gid://shopify/SellingPlan/1000';
process.env.SHOPIFY_CHECKOUT_HOST = 'checkout.example.com';
const { offers } = require('../site/catalog');
// Real variant IDs are pasted into the catalog at launch; give the tests stand-ins.
const realIds = offers.map(offer => [offer.variantId, offer.variantGid]);
function useTestVariants() {
  offers.forEach((offer, i) => { offer.variantId = String(9000 + i); offer.variantGid = `gid://shopify/ProductVariant/${offer.variantId}`; });
}
function restoreVariants() {
  offers.forEach((offer, i) => { [offer.variantId, offer.variantGid] = realIds[i]; });
}
const handler = require('../api/checkout');
const { cleanAttribution } = require('../lib/attribution');

function response() {
  return { statusCode: 0, headers: {}, setHeader(k,v) { this.headers[k]=v; }, end(value) { this.body=JSON.parse(value); } };
}

test('catalog prices match the Ruffora offer table', () => {
  assert.deepEqual(offers.map(o => [o.tubs, o.price, o.subscriptionPrice]), [[1, 39.99, 33.99], [2, 64.99, 55.24], [3, 79.98, 67.98]]);
  for (const o of offers) assert.equal(o.subscriptionPrice, Math.round(o.price * 0.85 * 100) / 100, `${o.name} is not 15% off`);
});

test('all six offers use their Shopify variant and return Shopify amounts with campaign attribution', async () => {
  const originalFetch = global.fetch;
  useTestVariants();
  try {
    for(const offer of offers) for(const subscribe of [false,true]) {
      let sent;
      global.fetch = async (url, options) => {
        sent = JSON.parse(options.body).variables.input;
        return { ok:true, json:async()=>({data:{cartCreate:{cart:{checkoutUrl:'https://example.myshopify.com/cart/c/test?key=preserve-me',cost:{subtotalAmount:{amount:subscribe ? String(offer.subscriptionPrice):String(offer.price),currencyCode:'USD'}},lines:{nodes:[{merchandise:{id:offer.variantGid}}]}},userErrors:[]}}}) };
      };
      const res = response();
      await handler({method:'POST',headers:{},body:{pack:offer.id,subscribe,attribution:{utm_source:'facebook',utm_campaign:'launch',fbclid:'should-not-transfer'}}},res);
      assert.equal(res.statusCode,200);
      assert.equal(sent.lines[0].merchandiseId,offer.variantGid);
      assert.equal(Boolean(sent.lines[0].sellingPlanId),subscribe);
      assert.equal(sent.buyerIdentity.countryCode,'US');
      assert.equal(res.body.analytics.value,subscribe?offer.subscriptionPrice:offer.price);
      assert.equal(res.body.analytics.variantId,offer.variantId);
      const url=new URL(res.body.checkoutUrl);
      assert.equal(url.hostname,'checkout.example.com');
      assert.equal(url.searchParams.get('key'),'preserve-me');
      assert.equal(url.searchParams.get('utm_campaign'),'launch');
      assert.equal(url.searchParams.has('fbclid'),false);
      assert.deepEqual(sent.attributes,[{key:'utm_source',value:'facebook'},{key:'utm_campaign',value:'launch'}]);
    }
  } finally { global.fetch=originalFetch; restoreVariants(); }
});

test('packs without a Shopify variant ID do not create carts',async()=>{
  const originalFetch=global.fetch;
  global.fetch=()=>{throw new Error('network must not be called');};
  const saved=[offers[0].variantId,offers[0].variantGid];
  offers[0].variantId=''; offers[0].variantGid='';
  try {
    const res=response();await handler({method:'POST',headers:{},body:{pack:1,subscribe:false}},res);
    assert.equal(res.statusCode,409);assert.match(res.body.message,/not configured/);
  } finally {global.fetch=originalFetch;[offers[0].variantId,offers[0].variantGid]=saved;}
});

test('invalid pack and ambiguous subscription values do not create carts',async()=>{
  const originalFetch=global.fetch;
  global.fetch=()=>{throw new Error('network must not be called');};
  useTestVariants();
  try {
    for(const body of [{pack:4,subscribe:false},{pack:1,subscribe:'false'}]) {
      const res=response();await handler({method:'POST',headers:{},body},res);
      assert.equal(res.statusCode,409);assert.equal(res.body.ok,false);
    }
  } finally {global.fetch=originalFetch;restoreVariants();}
});

test('Shopify inventory errors prevent redirect and analytics',async()=>{
  const originalFetch=global.fetch;
  global.fetch=async()=>({ok:true,json:async()=>({data:{cartCreate:{cart:null,userErrors:[{message:'Sold out'}]}}})});
  useTestVariants();
  try {
    const res=response();await handler({method:'POST',headers:{},body:{pack:1,subscribe:false}},res);
    assert.equal(res.statusCode,409);assert.equal(res.body.message,'Sold out');assert.equal(res.body.analytics,undefined);
  } finally {global.fetch=originalFetch;restoreVariants();}
});

test('attribution excludes arbitrary data and gates Meta identifiers on explicit consent',()=>{
  assert.deepEqual(cleanAttribution({email:'private@example.com',utm_source:'a\nb',utm_campaign:'x'.repeat(501),fbclid:'x'}),{});
  assert.deepEqual(cleanAttribution({marketingConsent:true,fbclid:'abc',_fbp:'fb.1.2.3'}),{fbclid:'abc',_fbp:'fb.1.2.3'});
});
