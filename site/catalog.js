(function (root) {
  // Paste each Shopify variant ID (numbers only) before launch. Checkout refuses a pack whose ID is blank.
  // Subscription prices must equal the Shopify selling plan's 15% discount on the variant price.
  const offers = [
    { id: 1, name: '1 Tub', tubs: 1, price: 39.99, subscriptionPrice: 33.99, variantId: '', badge: null },
    { id: 2, name: '2 Tubs', tubs: 2, price: 64.99, subscriptionPrice: 55.24, variantId: '', badge: 'Most popular' },
    { id: 3, name: 'Buy 2, Get 1 Free', tubs: 3, price: 79.98, subscriptionPrice: 67.98, variantId: '', badge: 'Best value' },
  ].map(offer => ({
    ...offer,
    // Savings are measured against buying single tubs one at a time.
    compareAt: Math.round(offer.tubs * 39.99 * 100) / 100,
    variantGid: offer.variantId ? `gid://shopify/ProductVariant/${offer.variantId}` : '',
  }));

  // Confirm against the final label. Leave a value null until the supplier confirms it; the page hides anything unconfirmed.
  const product = {
    chewsPerTub: null,
    // Daily chews by body weight, e.g. [{ upTo: 25, chews: 1 }, { upTo: 50, chews: 2 }, { upTo: Infinity, chews: 3 }]
    servingByWeightLb: null,
  };

  const catalog = { offers, product };
  if (typeof module !== 'undefined' && module.exports) module.exports = catalog;
  else root.RUFFORA = catalog;
})(typeof window !== 'undefined' ? window : globalThis);
