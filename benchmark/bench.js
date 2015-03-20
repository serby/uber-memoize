var async = require('async')
  , count = 40
  , uberMemoize = require('..')
  , UberCache = require('uber-cache')
  , results = []

function time(fn) {
  return function(done) {
    var start = Date.now()
    fn(function() {
      done(undefined, Date.now() - start)
    })
  }
}

function fib(x, cb) {
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
}

var uberCache = new UberCache()
  , memoize = uberMemoize(1, uberCache)
  , memoizedFib = memoize(function(x, cb) {
      if (x < 2) return cb(null, 1)
      var c
        , d
      memoizedFib(x - 1, function(error, a) {
        c = a
        if (c && d) return cb(null, c + d)
      })
      memoizedFib(x - 2, function(error, b) {
        d = b
        if (c && d) return cb(null, c + d)
      })
    })

async.series(
  { '#fib()': time(function(done) {
      fib(count, function(error, result) {
        results.push(result)
        done()
      })
    })
  , '#memoizedFib()': time(function(done) {
      memoizedFib(count, function(error, result) {
        results.push(result)
        done()
      })
    })
  }
  , function(error, times) {
    var i = 0
    console.log('Benchmark Complete')
    Object.keys(times).forEach(function(key) {
      console.log('%d <- %dms - %s', results[i++], times[key], key)
    })
  }
)
