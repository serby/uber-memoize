module.exports = UberMemoize

var extend = require('lodash.assign')
  , sigmund = require('sigmund')

// This hasher will descend 10 levels of object nesting in the arguments
// of a memoized function. If you need a more advanced you can pass as an option.
function hash() {
  return sigmund(arguments, 10)
}

function UberMemoize(engine, options) {
  this.options = extend(
    { hash: hash
    }, options)
  this.engine = engine
}

UberMemoize.prototype.memoize = function (id, fn, ttl) {

  var waitingCalls = {}
    , self = this
    , cacheCounter = 0

  function cachedFn() {

    var args = Array.prototype.slice.call(arguments)
      , fnCallback = args.pop()
      , key = id + '_' + self.options.hash(args) + '_' + cacheCounter

    self.engine.get(key, function (err, value) {

      if (err) return fnCallback(err)

      if (value !== undefined) return fnCallback.apply(undefined, value)

      // Because calls to the slow functions can stack up, we keep track of
      // all calls made while waiting for the slow function to return. We
      // then return to all of them once the first and only call to the slow
      // function returns.
      if (waitingCalls[key]) return waitingCalls[key].push(fnCallback)

      waitingCalls[key] = [ fnCallback ]

      // Intercept the callback
      args.push(function() {
        var args = Array.prototype.slice.call(arguments)
        // Store the arguments to the callback in the cache
        self.engine.set(key, args, ttl, function (err) {
          // Send the error/results back to all waiting functions
          waitingCalls[key].forEach(function (waitingCallback) {
            if (err) return waitingCallback(err)
            waitingCallback.apply(undefined, args)
          })
          // Clear up the calls
          delete waitingCalls[key]
        })
      })

      fn.apply(null, args)

    })

  }

  cachedFn.clear = function () {
    cacheCounter++
  }

  return cachedFn
}
