module.exports = createMemoize

var extend = require('lodash.assign'),
  sigmund = require('sigmund'),
  async = require('async')

// This hasher will descend 10 levels of object nesting in the arguments
// of a memoized function. If you need a more advanced you can pass as an option.
function hash() {
  return sigmund(arguments, 10)
}

function createMemoize(prefix, engine, opts) {
  var options = extend({ hash: hash }, opts),
    keys = {}

  return function memoize(fn, ttl) {
    var waitingCalls = {}

    function cachedFn() {
      var args = Array.prototype.slice.call(arguments),
        fnCallback = args.pop(),
        key = prefix + '_' + options.hash(args)

      keys[key] = true

      engine.get(key, function(err, value) {
        if (err) return fnCallback(err)

        if (value !== undefined) return fnCallback.apply(undefined, value)
        // Because calls to the slow functions can stack up, we keep track of
        // all calls made while waiting for the slow function to return. We
        // then return to all of them once the first and only call to the slow
        // function returns.
        if (waitingCalls[key]) return waitingCalls[key].push(fnCallback)

        // Only the first uncached call will reach here
        waitingCalls[key] = [fnCallback]

        // Intercept the callback
        args.push(function() {
          var args = Array.prototype.slice.call(arguments)
          // Store the arguments to the callback in the cache
          engine.set(key, args, ttl, function(err) {
            // Send the error/results back to all waiting functions
            waitingCalls[key].forEach(function(waitingCallback) {
              if (err) return waitingCallback(err)
              process.nextTick(function() {
                waitingCallback.apply(undefined, args)
              })
            })
            // Clear up the calls
            delete waitingCalls[key]
          })
        })

        fn.apply(null, args)
      })
    }

    cachedFn.clear = function(cb) {
      async.each(Object.keys(keys), engine.delete.bind(engine), function(err) {
        if (err) return cb(err)
        keys = {}
        if (cb) return cb()
      })
    }

    return cachedFn
  }
}
