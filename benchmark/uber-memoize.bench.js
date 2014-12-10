var UberCache = require('..')

require('./engine.bench')('memory-engine', function(options) {
  return new UberCache(options)
})
