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

UberMemoize.prototype.memoize = function(id, fn, ttl) {
  var waitingCalls = {}
    , self = this
    , cachedFn = function () {
    var args = Array.prototype.slice.call(arguments)
      , fnCallback = args.pop()
      , key = id + '_' + self.options.hash(args)

    self.engine.get(key, function (error, value) {
      if (error) {
        return fnCallback(error)
      }
      if (value === undefined) {
        // Because calls to the slow functions can stack up, we keep track of
        // all calls made while waiting for the slow function to return. We
        // then return to all of them once the first and only call to the slow
        // function returns.
        if (waitingCalls[key]) {
          return waitingCalls[key].push(fnCallback)
        }
        waitingCalls[key] = [ fnCallback ]
        args.push(function() {
          var args = Array.prototype.slice.call(arguments)
          self.engine.set(key, args, ttl, function(error) {
            if (error) {
              // Tell all waiting calls about the error
              waitingCalls[key].forEach(function (waitingCallback) {
                waitingCallback(error)
              })
            } else {
              // Send the results back to all waiting functions
              waitingCalls[key].forEach(function (waitingCallback) {
                waitingCallback.apply(undefined, args)
              })
            }
            // Clear up the calls
            delete waitingCalls[key]
          })
        })
        fn.apply(null, args)
      } else {
        fnCallback.apply(undefined, value)
      }
    })
  }

  return cachedFn
}
