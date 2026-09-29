(function (root) {
  // Subscription only: `price` is the monthly price charged. It must equal the Shopify variant price
  // (the selling plan adds no discount). Paste each variant ID (numbers only); checkout refuses a blank one.
  const offers = [
    { id: 1, name: '1 Tub', tubs: 1, price: 34, variantId: '50470305071171', badge: null },
    { id: 2, name: '2 Tubs', tubs: 2, price: 55, variantId: '50470305103939', badge: 'Most popular' },
    { id: 3, name: 'Buy 2, Get 1 Free', tubs: 3, price: 68, variantId: '50470305136707', badge: 'Best value' },
  ].map(offer => ({
    ...offer,
    // Savings are measured against subscribing to single tubs at the 1-tub price.
    compareAt: offer.tubs * 34,
    variantGid: offer.variantId ? `gid://shopify/ProductVariant/${offer.variantId}` : '',
  }));

  // From the product label.
  // Daily serving (1 / 2 / 3 chews for small / medium / large dogs) lives in the serving guide in index.html.
  const product = {
    chewsPerTub: 30, // from the label: 30 soft chews (4 g) per tub
  };

  const catalog = { offers, product };
  if (typeof module !== 'undefined' && module.exports) module.exports = catalog;
  else root.RUFFORA = catalog;
})(typeof window !== 'undefined' ? window : globalThis);
