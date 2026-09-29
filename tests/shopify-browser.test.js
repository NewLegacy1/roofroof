const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require.resolve('../scripts/shopify-analytics.mjs'), 'utf8').replace(/^import .*;\r?\n/gm, '');
function browser(tokens = { uniqueToken:'shopify-visitor', visitToken:'shopify-visit' }) {
  const events = [], requests = [];
  const context = {
    window:{}, location:{href:'https://ruffora.shop/'}, document:{referrer:'https://example.com/ad'},
    console:{warn(){}}, setTimeout,
    fetch:async (url, init) => { requests.push(JSON.parse(init.body)); return {ok:true,json:async()=>({shopId:'gid://shopify/Shop/123',storefrontId:'1000181287'})}; },
    getTrackingValues:()=>tokens,
    getClientBrowserParameters:()=>({...tokens,url:'https://ruffora.shop/',path:'/',referrer:'https://example.com/ad'}),
    sendShopifyAnalytics:async event=>events.push(event),
  };
  vm.runInNewContext(source,context);
  return {api:context.window.RufforaShopify,events,requests};
}
test('consented landing-page visit is sent once before any checkout, with Shopify-issued identity',async()=>{
  const {api,events,requests}=browser();
  await api.consent(true);
  await api.consent(true);
  assert.equal(events.length,1);
  assert.equal(events[0].eventName,'PAGE_VIEW');
  assert.equal(events[0].payload.shopifySalesChannel,'hydrogen');
  assert.equal(events[0].payload.storefrontId,'1000181287');
  assert.equal(events[0].payload.url,'https://ruffora.shop/');
  assert.equal(events[0].payload.visitToken,'shopify-visit');
  assert.equal(requests[0].referrer,'https://example.com/ad');
  assert.equal((await api.headers())['X-Shopify-VisitToken'],'shopify-visit');
});
test('denied consent sends no page analytics and exposes no tracking headers',async()=>{
  const {api,events}=browser();
  await api.consent(false);
  assert.equal(events.length,0);
  assert.equal(Object.keys(await api.headers()).length,0);
});
test('missing Shopify identity fails instead of fabricating a session',async()=>{
  const {api,events}=browser({uniqueToken:'',visitToken:''});
  await assert.rejects(api.consent(true),/did not issue/);
  assert.equal(events.length,0);
});
