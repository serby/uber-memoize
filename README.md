# Async memoize for uber-cache-* engines

[![build status](https://secure.travis-ci.org/serby/uber-memoize.png)](http://travis-ci.org/serby/uber-memoize) [![Greenkeeper badge](https://badges.greenkeeper.io/serby/uber-memoize.svg)](https://greenkeeper.io/)

If you want to know about memoization read this http://en.wikipedia.org/wiki/Memoization

## Installation

    npm install uber-memoize

## Example

```js

function slowFn(i, cb) {
  // Takes 5 seconds
  setTimeout(cb, 5000)
}

var UberCache = require('uber-cache')
  , uberMemoize = require('uber-memoize')
  , uberCache = new UberCache()

  // You can use any uber-cache-* engine to power memoize
  , memoize = uberMemoize('some sort of prefix', uberCache)
  , ttl = 10000 // 10 Seconds
  , cachedSlowFn = memoize(slowFn, ttl)

  // This first call will be slow
  cachedSlowFn(1, function(err, result) {
    // It will take 5 seconds to get here!
    cachedSlowFn(1, function(err, result) {
      // This will be quick!
    })
  })
})

// The memoized function comes with a clear() method which will invalidate
// its cache, ensuring that the next call executes the original function
cachedSlowFn.clear()
cachedSlowFn(1, function (err, result) {
  // This will take 5 seconds again
})
```

## Credits
[Paul Serby](https://github.com/serby/) follow me on [twitter](http://twitter.com/serby)

## Licence
Licenced under the [New BSD License](http://opensource.org/licenses/bsd-license.php)
