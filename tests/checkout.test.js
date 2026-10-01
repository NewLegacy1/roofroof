const test = require('node:test');
const assert = require('node:assert/strict');
process.env.SHOPIFY_STORE_DOMAIN = 'example.myshopify.com';
process.env.SHOPIFY_STOREFRONT_TOKEN = 'test-token';
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

test('catalog prices match the live AutoRefill and one-time offer table', () => {
  assert.deepEqual(offers.map(o => [o.tubs, o.autoRefillPrice, o.oneTimePrice, o.compareAt]), [
    [1, 34, 40, 40],
    [2, 60, 68, 80],
    [3, 85, 100, 120],
  ]);
});

test('every pack supports AutoRefill and one-time checkout with the correct Shopify lines', async () => {
  const originalFetch = global.fetch;
  useTestVariants();
  try {
    for(const offer of offers) for(const autoRefill of [undefined,false,true]) {
      let sent;
      global.fetch = async (url, options) => {
        sent = JSON.parse(options.body).variables.input;
        const selected = autoRefill !== false;
        const amount = selected ? offer.autoRefillPrice : offer.oneTimePrice;
        const nodes = [{merchandise:{id:offer.variantGid},cost:{totalAmount:{amount:String(amount),currencyCode:'USD'}},discountAllocations:[]}];
        if (offer.gift) nodes.push({merchandise:{id:'gid://shopify/ProductVariant/67602321571907'},cost:{totalAmount:{amount:'0',currencyCode:'USD'}},discountAllocations:[{discountedAmount:{amount:'8.99',currencyCode:'USD'}}]});
        return { ok:true, json:async()=>({data:{cartCreate:{cart:{checkoutUrl:'https://example.myshopify.com/cart/c/test?key=preserve-me',cost:{subtotalAmount:{amount:String(amount),currencyCode:'USD'}},lines:{nodes}},userErrors:[]}}}) };
      };
      const res = response();
      await handler({method:'POST',headers:{},body:{pack:offer.id,...(autoRefill===undefined?{}:{autoRefill}),attribution:{utm_source:'facebook',utm_campaign:'launch',fbclid:'should-not-transfer'}}},res);
      assert.equal(res.statusCode,200);
      assert.equal(sent.lines[0].merchandiseId,offer.variantGid);
      assert.equal(sent.lines[0].sellingPlanId,(autoRefill===false)?undefined:offer.sellingPlanGid);
      assert.equal(sent.lines.length,offer.gift?2:1);
      assert.equal(sent.buyerIdentity.countryCode,'US');
      assert.equal(res.body.analytics.value,(autoRefill===false)?offer.oneTimePrice:offer.autoRefillPrice);
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
    const res=response();await handler({method:'POST',headers:{},body:{pack:1}},res);
    assert.equal(res.statusCode,409);assert.match(res.body.message,/not configured/);
  } finally {global.fetch=originalFetch;[offers[0].variantId,offers[0].variantGid]=saved;}
});

test('invalid packs do not create carts',async()=>{
  const originalFetch=global.fetch;
  global.fetch=()=>{throw new Error('network must not be called');};
  useTestVariants();
  try {
    for(const body of [{pack:4},{pack:0},{}]) {
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
    const res=response();await handler({method:'POST',headers:{},body:{pack:1}},res);
    assert.equal(res.statusCode,409);assert.equal(res.body.message,'Sold out');assert.equal(res.body.analytics,undefined);
  } finally {global.fetch=originalFetch;restoreVariants();}
});

test('checkout stops before redirect when Shopify has not made the gift free',async()=>{
  const originalFetch=global.fetch;
  const offer=offers[1];
  global.fetch=async()=>({ok:true,json:async()=>({data:{cartCreate:{cart:{
    checkoutUrl:'https://example.myshopify.com/cart/c/test',
    cost:{subtotalAmount:{amount:String(offer.autoRefillPrice+8.99),currencyCode:'USD'}},
    lines:{nodes:[]},
  },userErrors:[]}}})});
  try {
    const res=response();await handler({method:'POST',headers:{},body:{pack:2,autoRefill:true}},res);
    assert.equal(res.statusCode,409);
    assert.match(res.body.message,/free gift discount is still syncing/i);
    assert.equal(res.body.checkoutUrl,undefined);
  } finally {global.fetch=originalFetch;}
});

test('attribution excludes arbitrary data and gates Meta identifiers on explicit consent',()=>{
  assert.deepEqual(cleanAttribution({email:'private@example.com',utm_source:'a\nb',utm_campaign:'x'.repeat(501),fbclid:'x'}),{});
  assert.deepEqual(cleanAttribution({marketingConsent:true,fbclid:'abc',_fbp:'fb.1.2.3'}),{fbclid:'abc',_fbp:'fb.1.2.3'});
});
