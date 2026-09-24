module.exports = function handler(req, res) {
  const pixelId = process.env.META_PIXEL_ID || '';
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ metaPixelId: /^\d+$/.test(pixelId) ? pixelId : null }));
};
