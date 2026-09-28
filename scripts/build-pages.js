// Build the storefront help pages and copy-ready Shopify policy bodies.
// Run with `npm run pages` after changing the details below.
const fs = require('node:fs');
const path = require('node:path');

// CONFIRM these before launch. They appear on every help page and policy.
const CONFIG = {
  BRAND: 'Ruffora',
  DOMAIN: 'ruffora.com',
  EMAIL: 'hello@ruffora.com',
  // Shopify customer account URL: Settings > Customer accounts in Shopify admin.
  ACCOUNT_URL: 'https://shopify.com/REPLACE_WITH_SHOP_ID/account',
  // Domain Shopify serves checkout from (e.g. checkout.ruffora.com).
  CHECKOUT_DOMAIN: 'checkout.ruffora.com',
  // Business mailing address required in the privacy policy.
  POSTAL_ADDRESS: 'REPLACE WITH BUSINESS ADDRESS',
  // Daily Gut is sold by monthly subscription only. Set true once the subscription shipping profile is free.
  FREE_SHIPPING: false,
};

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const POLICIES = path.join(ROOT, 'launch', 'policies');
const { BRAND, DOMAIN, EMAIL: ADDRESS, ACCOUNT_URL: ACCOUNT } = CONFIG;
const EMAIL = `<a href="mailto:${ADDRESS}">${ADDRESS}</a>`;

const subscriptionShipping = CONFIG.FREE_SHIPPING
  ? 'US subscription orders include free standard shipping.'
  : 'Shipping is shown at checkout and in your subscription details.';

const PAGES = {
  contact: [`Contact ${BRAND}`, `<p>Need help with an order, a serving question or your subscription? Email ${EMAIL}.</p><p>If you have already ordered, include your order number and the email address used at checkout. Please do not send payment-card details.</p><p>For questions about your dog's health, please speak with your veterinarian.</p><p><a class="button" href="mailto:${ADDRESS}">Email ${BRAND}</a></p>`],
  refunds: ['Refund policy', `<h2>30-day money-back guarantee</h2><p>If Daily Gut isn't right for your dog, email ${EMAIL} within 30 days of delivery with your order number. Opened tubs are eligible.</p><p>We will help arrange a full refund to your original payment method. Contact us before sending anything back so we can give you the correct instructions. Your bank or payment provider may need additional time to post the refund.</p><h2>Damaged, incorrect or missing items</h2><p>Email us with your order number and a description of the issue. If an item arrived damaged or incorrect, include a photo if possible so we can help.</p><h2>Subscriptions</h2><p>Canceling a subscription stops future renewals. To request a refund for an order already placed, contact us under the guarantee above.</p>`],
  shipping: ['Shipping policy', `<h2>US orders</h2><p>Daily Gut ships monthly by subscription. ${subscriptionShipping} The final shipping charge is shown before payment.</p><h2>Processing and delivery</h2><p>Dispatch time is separate from the carrier's delivery time. We will send a shipping confirmation with tracking when your order ships. Carrier estimates and delays can vary by destination.</p><p>Contact ${EMAIL} before ordering if you need delivery by a particular date. We do not promise a guaranteed arrival date.</p><h2>Address changes and delivery issues</h2><p>Check your shipping address before paying. If it needs to be corrected, contact us as soon as possible. We cannot guarantee changes once an order has shipped. If tracking shows a problem or an order has not arrived, email us with your order number.</p><h2>Other destinations</h2><p>Available destinations and their rates are displayed at checkout.</p>`],
  subscriptions: ['Manage your subscription', `<p>Sign in using the email address you used at checkout, then open <strong>Subscriptions</strong> to view your plan, skip a delivery or cancel future renewals.</p><p><a class="button" href="${ACCOUNT}">Open my account</a></p><h2>Monthly deliveries</h2><p>Daily Gut is sold as a monthly subscription. It renews monthly at the price shown at checkout until you cancel; there is no minimum commitment. ${subscriptionShipping} Any applicable taxes are shown at checkout.</p><h2>Skip or cancel</h2><p>You can skip or cancel before your next renewal is processed. Canceling stops future charges; it does not automatically cancel an order already placed. For a refund on an existing order, see our <a href="/refunds/">30-day guarantee</a>.</p><p>If you cannot access your account, email ${EMAIL} for help.</p>`],
  terms: ['Terms of service', `<p>These terms apply to purchases from ${BRAND} at ${DOMAIN} and its Shopify checkout. By placing an order, you agree to the terms displayed here and the purchase details shown at checkout.</p><h2>Orders and payment</h2><p>Provide accurate contact, shipping and payment information. Prices are in USD unless checkout states otherwise. Review your products, shipping, taxes and total before paying. If we cannot fulfill an order, we will contact you and refund any payment for the unfulfilled items.</p><h2>Subscriptions</h2><p>Daily Gut is sold by monthly subscription only. Subscriptions renew monthly at the recurring price shown at checkout until canceled. You can manage future renewals in your <a href="${ACCOUNT}">account</a>. See our <a href="/subscriptions/">subscription policy</a> for details.</p><h2>Shipping and refunds</h2><p>Our <a href="/shipping/">shipping policy</a> and <a href="/refunds/">refund policy</a> apply to orders. The 30-day money-back guarantee includes opened tubs.</p><h2>Product use</h2><p>Daily Gut is a supplement for dogs. Follow the label directions and serving amounts. It is not intended to diagnose, treat, cure or prevent any disease. Consult your veterinarian before use if your dog has a health condition, is on medication, or is pregnant or nursing. Store out of reach of children and pets. Individual results vary; no specific outcome is guaranteed.</p><h2>Privacy</h2><p>Our <a href="/privacy/">privacy policy</a> explains how personal information is used.</p><h2>Changes and questions</h2><p>The terms in effect when you order apply to that order. Nothing here limits rights that cannot be excluded under applicable law. For questions, contact ${EMAIL}.</p>`],
};

const STYLE = 'body{margin:0;background:#F7F2E8;color:#202C28;font:17px/1.7 Manrope,system-ui,sans-serif}header,main,footer{max-width:780px;margin:auto;padding:28px 24px}header img{width:170px;height:auto}main{background:white;border-radius:18px;margin-bottom:24px}h1,h2{color:#153E38;letter-spacing:-.02em}h1{font-size:36px;line-height:1.15}h2{font-size:22px;margin-top:32px}a{color:#153E38;text-underline-offset:3px}.button{display:inline-block;background:#153E38;color:#F7F2E8;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700}nav{display:flex;flex-wrap:wrap;gap:14px;font-size:14px;font-weight:700}footer{font-size:14px}main p{max-width:68ch}';

function fill(text) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => (key in CONFIG ? CONFIG[key] : match));
}

function render(slug, title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | ${BRAND}</title><link rel="icon" href="/assets/logo-mark.png"><link rel="canonical" href="https://${DOMAIN}/${slug}/"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&display=swap"><style>${STYLE}</style></head><body><header><a href="/"><img src="/assets/logo-wordmark.png" alt="${BRAND}" width="1612" height="313"></a></header><main><h1>${title}</h1>${body}</main><footer><nav><a href="/">Shop</a><a href="/contact/">Contact</a><a href="/shipping/">Shipping</a><a href="/refunds/">Refunds</a><a href="/subscriptions/">Subscriptions</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></nav><p>© 2026 ${BRAND} · ${EMAIL}</p></footer></body></html>`;
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
}

for (const [slug, [title, body]] of Object.entries(PAGES)) {
  write(path.join(SITE, slug, 'index.html'), render(slug, title, body));
  // Paste these bodies into Shopify: Settings > Policies.
  write(path.join(POLICIES, `${slug}.html`), body);
}
const privacySource = path.join(POLICIES, 'privacy.html');
if (fs.existsSync(privacySource)) {
  write(path.join(SITE, 'privacy', 'index.html'), render('privacy', 'Privacy policy', fill(fs.readFileSync(privacySource, 'utf8'))));
}
console.log(`Built ${Object.keys(PAGES).length} help pages, policy bodies and the privacy page.`);
