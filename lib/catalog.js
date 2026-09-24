const { offers } = require('../site/catalog');

function pack(id) {
  return offers.find(offer => offer.id === id);
}

module.exports = { pack };
