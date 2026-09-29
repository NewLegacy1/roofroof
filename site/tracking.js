(function () {
  const campaignKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id'];
  const parameters = new URLSearchParams(location.search);
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch {} },
  };
  let choice = storage.get('ruffora-marketing-consent');
  if (navigator.globalPrivacyControl) choice = 'denied';
  let pixelId = null;
  let initialized = false;
  let pageTracked = false;
  let banner;
  function allowed() { return choice === 'granted' && !navigator.globalPrivacyControl; }
  function pixel() {
    if (!pixelId || !allowed()) return;
    if (!initialized) {
      const fbq = window.fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
      fbq.queue = []; fbq.loaded = true; fbq.version = '2.0';
      window._fbq = fbq;
      const script = document.createElement('script');
      script.async = true; script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(script);
      fbq('init', pixelId);
      initialized = true;
    }
    window.fbq('consent', 'grant');
    if (!pageTracked) {
      window.fbq('track', 'PageView');
      window.fbq('track', 'ViewContent', { content_name: 'Ruffora Daily Gut Digestive Support Soft Chews', content_type: 'product_group' });
      pageTracked = true;
    }
  }
  function choose(value) {
    choice = value;
    storage.set('ruffora-marketing-consent', value);
    window.RufforaShopify?.consent(allowed()).catch(() => {});
    if (banner) banner.remove();
    if (allowed()) pixel();
    else if (initialized) window.fbq('consent', 'revoke');
  }
  function showChoices() {
    if (banner?.isConnected) return;
    banner = document.createElement('section');
    banner.setAttribute('aria-label', 'Privacy choices');
    banner.style.cssText = 'position:fixed;bottom:16px;left:16px;right:16px;max-width:540px;background:#F7F2E8;color:#202C28;padding:20px;border:1px solid #CBD8C3;border-radius:14px;box-shadow:0 4px 28px #0002;z-index:1000;font:14px/1.5 Manrope,system-ui,sans-serif';
    banner.innerHTML = '<strong>Your privacy choices</strong><p>With your permission, we use advertising cookies to measure visits and purchases. You can shop without them. <a href="/privacy/">Privacy policy</a></p><div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" data-choice="denied">Essential only</button><button type="button" data-choice="granted">Allow advertising</button></div>';
    for (const button of banner.querySelectorAll('button')) {
      button.style.cssText = 'padding:10px 16px;border:1.5px solid #153E38;border-radius:10px;color:#153E38;background:white;font:inherit;cursor:pointer';
      button.addEventListener('click', () => choose(button.dataset.choice));
    }
    if (navigator.globalPrivacyControl) {
      banner.querySelector('p').textContent = 'Your browser’s Global Privacy Control is enabled. Advertising tracking is off.';
      banner.querySelector('[data-choice="granted"]').remove();
    }
    document.body.appendChild(banner);
  }
  window.RufforaTracking = {
    attribution() {
      const result = {};
      for (const key of campaignKeys) {
        const value = parameters.get(key);
        if (value && value.length <= 500) result[key] = value;
      }
      if (allowed()) {
        result.marketingConsent = true;
        const click = parameters.get('fbclid');
        if (click && click.length <= 500) result.fbclid = click;
        for (const name of ['_fbp', '_fbc']) {
          const raw = document.cookie.split('; ').find(item => item.startsWith(name + '='));
          if (raw) result[name] = raw.slice(name.length + 1);
        }
      }
      return result;
    },
    checkout(data) {
      if (!initialized || !allowed() || !data.analytics) return;
      const details = { currency: data.analytics.currency, value: data.analytics.value, content_type: 'product', content_ids: [data.analytics.variantId], contents: [{ id: data.analytics.variantId, quantity: 1 }], num_items: 1 };
      window.fbq('track', 'AddToCart', details, { eventID: data.analytics.eventId + '-cart' });
      // Shopify's Meta integration sends InitiateCheckout after the redirect.
      // Sending it here as well counts the same checkout twice.
    },
  };
  document.getElementById('privacy-settings')?.addEventListener('click', showChoices);
  // Shopify sessions are independent of whether a Meta pixel is configured.
  if (choice) window.RufforaShopify?.consent(allowed()).catch(() => {});
  else showChoices();
  fetch('/api/public-config').then(response => response.json()).then(config => {
    if (!/^\d+$/.test(config.metaPixelId || '')) return;
    pixelId = config.metaPixelId;
    if (allowed()) pixel();
    else if (!choice) showChoices();
  }).catch(() => {});
})();
