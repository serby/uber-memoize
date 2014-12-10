var async = require('async')
  , count = 50
  , UberMemoize = require('..')
  , UberCache = require('uber-cache')

function time(fn) {
  return function(done) {
    var start = Date.now()
    fn(function() {
      done(undefined, Date.now() - start)
    })
  }
}

var uberCache = new UberCache()
  , uberMemoize = new UberMemoize(uberCache)
  , fib = uberMemoize.memoize(1, function(x, cb) {
      if (x < 2) return cb(null, 1)
      var c
        , d
      fib(x - 1, function(error, a) {
        c = a
        if (c && d) return cb(null, c + d)
      })
      fib(x - 2, function(error, b) {
        d = b
        if (c && d) return cb(null, c + d)
      })
    })

async.series(
  { '#memoize()': time(function(done) {

      fib(count, function(error, result) {
        console.log(result)
        done()
      })
    })
  }
  , function(error, times) {
    console.log('Done', times)
  }
)
