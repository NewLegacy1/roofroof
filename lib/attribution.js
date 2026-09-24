const CAMPAIGN_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id'];
function cleanAttribution(input) {
  const result = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return result;
  const keys = input.marketingConsent === true ? [...CAMPAIGN_KEYS, 'fbclid', '_fbp', '_fbc'] : CAMPAIGN_KEYS;
  for (const key of keys) {
    const value = input[key];
    if (typeof value === 'string' && value.length <= 500 && !/[\u0000-\u001f]/.test(value)) result[key] = value;
  }
  return result;
}
module.exports = { CAMPAIGN_KEYS, cleanAttribution };
