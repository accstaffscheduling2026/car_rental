const NodeCache = require('node-cache');

const availabilityCache = new NodeCache({ stdTTL: 30, checkperiod: 10 });

function invalidate() {
  availabilityCache.flushAll();
}

module.exports = { availabilityCache, invalidate };
