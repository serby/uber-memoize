# uber-memoize - Async memoize for uber-* engines

[![build status](https://secure.travis-ci.org/serby/uber-memoize.png)](http://travis-ci.org/serby/uber-memoize)

If you want to know about memoization read this http://en.wikipedia.org/wiki/Memoization

## Installation

    npm install uber-memoize

## Example

```js

function slowFn(i, cb) {
  // Takes 5 seconds
  setTimeout(cb, 5000)
}

var uberCache = new UberCache()

  // You can use any uber-cache-* engine to power memoize
  , uberMemoize = new UberMemoize(uberCache)

  , cachedSlowFn = uberMemoize.memoize(1, slowFn)
  , ttl = 10000 // 10 Seconds

  // This first call will be slow
  cachedSlowFn(1, ttl, function(err, result) {
    // It will take 5 seconds to get here!
    cachedSlowFn(1, function(err, result) {
      // This will be quick!
    })
  })

```

## Credits
[Paul Serby](https://github.com/serby/) follow me on [twitter](http://twitter.com/serby)

## Licence
Licenced under the [New BSD License](http://opensource.org/licenses/bsd-license.php)
