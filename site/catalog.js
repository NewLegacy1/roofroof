(function (root) {
  // Live Shopify one-time prices and Appstle monthly selling plans.
  const offers = [
    { id: 1, name: '1 Tub', tubs: 1, autoRefillPrice: 34, oneTimePrice: 40, compareAt: 40, variantId: '50470305071171', sellingPlanId: '7098564675', badge: null },
    { id: 2, name: '2 Tubs', tubs: 2, autoRefillPrice: 60, oneTimePrice: 68, compareAt: 80, variantId: '67602310725699', sellingPlanId: '7098597443', badge: 'Most popular', gift: true },
    { id: 3, name: '3 Tubs', tubs: 3, autoRefillPrice: 85, oneTimePrice: 100, compareAt: 120, variantId: '67602313871427', sellingPlanId: '7098630211', badge: 'Best value', gift: true },
  ].map(offer => ({
    ...offer,
    // `price` remains the default AutoRefill price for existing consumers.
    price: offer.autoRefillPrice,
    variantGid: offer.variantId ? `gid://shopify/ProductVariant/${offer.variantId}` : '',
    sellingPlanGid: offer.sellingPlanId ? `gid://shopify/SellingPlan/${offer.sellingPlanId}` : '',
  }));

  const gift = {
    name: 'Calming Lick Mat',
    value: 8.99,
    variantId: '67602321571907',
    variantGid: 'gid://shopify/ProductVariant/67602321571907',
  };

  // From the product label.
  // Daily serving (1 / 2 / 3 chews for small / medium / large dogs) lives in the serving guide in index.html.
  const product = {
    chewsPerTub: 30, // from the label: 30 soft chews (4 g) per tub
  };

  const catalog = { offers, product, gift };
  if (typeof module !== 'undefined' && module.exports) module.exports = catalog;
  else root.RUFFORA = catalog;
})(typeof window !== 'undefined' ? window : globalThis);
