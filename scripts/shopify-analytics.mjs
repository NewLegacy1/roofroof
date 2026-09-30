import { sendShopifyAnalytics, getClientBrowserParameters } from '@shopify/hydrogen-react/analytics';
let tracking = {};

let permitted = false;
let pageSent = false;
let shopId;
let pending = Promise.resolve();
let requestedConsent;

window.RufforaShopify = {
  consent(granted) {
    permitted = granted;
    if (requestedConsent === granted) return pending;
    requestedConsent = granted;
    pending = pending.catch(() => {}).then(async () => {
      const response = await fetch('/api/shopify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent: granted, url: location.href, referrer: document.referrer }),
      });
      if (!response.ok) throw new Error('Shopify session setup failed');
      const session = await response.json();
      shopId = session.shopId;
      tracking = session.tracking || {};
      // Reading after the body completes makes Server-Timing available to the SDK.
      const { uniqueToken, visitToken } = tracking;
      if (!granted || !permitted || pageSent) return;
      if (!uniqueToken || !visitToken || uniqueToken.startsWith('00000000-') || visitToken.startsWith('00000000-')) {
        throw new Error('Shopify did not issue consented session tokens');
      }
      await sendShopifyAnalytics({ eventName: 'PAGE_VIEW', payload: {
        ...getClientBrowserParameters(), uniqueToken, visitToken, shopId, hasUserConsent: true,
        analyticsAllowed: true, marketingAllowed: true, saleOfDataAllowed: true,
        shopifySalesChannel: 'hydrogen', storefrontId: session.storefrontId,
        currency: 'USD', acceptedLanguage: 'en', pageType: 'index',
      } });
      pageSent = true;
    }).catch(error => {
      if (requestedConsent === granted) requestedConsent = undefined;
      throw error;
    });
    pending.catch(error => console.warn('[Ruffora Shopify analytics]', error.message));
    return pending;
  },
  async headers() {
    // Tracking must never stop a customer from reaching checkout.
    await Promise.race([pending.catch(() => {}), new Promise(resolve => setTimeout(resolve, 1500))]);
    if (!permitted) return {};
    const { uniqueToken, visitToken } = tracking;
    return uniqueToken && visitToken ? { 'X-Shopify-UniqueToken': uniqueToken, 'X-Shopify-VisitToken': visitToken } : {};
  },
};

