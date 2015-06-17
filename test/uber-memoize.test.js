var should = require('should')
  , UberCache = require('uber-cache')
  , uberMemoize = require('..')

function slowFn(callback) {
  setTimeout(callback.bind(null, 10), 30)
}

function sum(a, b, callback) {
  callback(null, a + b)
}

function giveMeTen(callback) {
  callback(null, 10)
}

describe('uber-memoize', function () {

  it('should create a function that when run gives the expected result', function (done) {

    var cacheEngine = new UberCache()
      , memoize = uberMemoize('test', cacheEngine)
      , fn = memoize(giveMeTen, 1000)

    fn(function(error, value) {
      value.should.eql(10)
      done()
    })

  })

  it('second call should be quick', function (done) {

    var cacheEngine = new UberCache()
      , memoize = uberMemoize('test2', cacheEngine)
      , fn = memoize(slowFn, 1000)
      , a = Date.now()

    fn(function(value) {
      value.should.eql(10)
      var b = Date.now()
      should.ok(b - a > 20)
      fn(function(value) {
        value.should.eql(10)
        should.ok(Date.now() - b < 20)
        done()
      })
    })
  })

  it('should correctly handle parameters', function (done) {

    var cacheEngine = new UberCache()
      , memoize = uberMemoize('test3', cacheEngine)
      , fn = memoize(sum, 1000)

    fn(1, 3, function(error, value) {
      value.should.eql(4)
      done()
    })

  })

  it('should create caches for each different combination of parameters ', function () {

    var cacheEngine = new UberCache()
      , memoize = uberMemoize('test4', cacheEngine)
      , fn = memoize(sum, 1000)

    fn(1, 3, function(error, value) {
      value.should.eql(4)
    })

    fn(2, 3, function(error, value) {
      value.should.eql(5)
    })

    fn(2, 3, function(error, value) {
      value.should.eql(5)
    })

    cacheEngine.size(function(error, size) {
      size.should.eql(2)
    })

  })

  it('should not make a second call to slow function if already called', function (done) {

    // Manually control the slow function
    var tick

    function myFn(callback) {
      called.push(i)
      i += 1
      tick = callback.bind(null, i)
    }

    var cacheEngine = new UberCache()
      , memoize = uberMemoize('test3', cacheEngine)
      , fn = memoize(myFn, 1000)
      , called = []
      , i = 0

    fn(function(response) {
      response.should.equal(1)
    })

    fn(function(response) {
      response.should.equal(1)
      called.should.eql([ 0 ])
      done()
    })

    tick()
  })

  it('should stack up calls to slow functions', function (done) {

    // Manually control the slow function
    var tick

    function myFn(callback) {
      called.push(i)
      i += 1
      tick = callback
    }

    var cacheEngine = new UberCache()
      , memoize = uberMemoize('test', cacheEngine)
      , fn = memoize(myFn, 1000)
      , called = []
      , i = 0
      , cbCount = 0

    fn(function() {
      cbCount += 1
    })

    fn(function() {
      cbCount += 1
    })

    fn(function() {
      should.equal(cbCount, 2)
      done()
    })

    cacheEngine.clear(function() {
      tick()
    })

  })

  it('should recache if cache is cleared', function (done) {

    // Manually control the slow function
    var tick

    function myFn(callback) {
      called.push(i)
      i += 1
      tick = callback
    }

    var cacheEngine = new UberCache()
      , memoize = uberMemoize('test', cacheEngine)
      , fn = memoize(myFn, 1000)
      , called = []
      , i = 0
      , cbCount = 0

    fn(function() {
      cbCount += 1
    })

    tick()
    cacheEngine.clear(function() {
      fn(function() {
        should.deepEqual(called, [ 0, 1 ])
        done()
      })
      tick()
    })

  })

  it('should return error cache backend errors on get()', function (done) {

    function myFn(callback) {
      called.push(i)
      i += 1
      callback()
    }

    var mockCache =
      { get: function(key, cb) {
          cb(new Error('Get Error'), undefined)
        }
      }
      , memoize = uberMemoize('test', mockCache)
      , fn = memoize(myFn, 1000)
      , called = []
      , i = 0

    fn(function(error) {
      error.message.should.equal('Get Error')
      done()
    })

  })

  it('should return error cache backend errors on set()', function (done) {

    function myFn(callback) {
      called.push(i)
      i += 1
      callback(null, 'Hello')
    }

    var mockCache =
      { get: function(key, cb) {
          cb(null, undefined)
        }
      , set: function(key, value, ttl, cb) {
          cb(new Error('Set Error'))
        }
      }
      , memoize = uberMemoize('test', mockCache)
      , fn = memoize(myFn, 1000)
      , called = []
      , i = 0

    fn(function(error) {
      error.message.should.equal('Set Error')
      done()
    })

  })

  it('should allow a lot of waiting calls', function (done) {

    function myFn(callback) {
      called.push(i)
      i += 1
      callback(null, 'Hello')
    }

    var cacheEngine = new UberCache()
      , memoize = uberMemoize('test', cacheEngine)
      , fn = memoize(myFn, 1000)
      , called = []
      , i = 0
      , e  = 0

    function complete() {
      process.nextTick(function() {
        e -= 1
        if (e <= 0) done()
      })
    }

    for (; e < 10000; e += 1) fn(complete)

  })

  it('should cache a function call with an object as an argument', function (done) {

    var alreadyCalled = false

    function keys(object, cb) {
      alreadyCalled.should.equal(false)
      alreadyCalled = true
      cb(null, Object.keys(object))
    }

    var cacheEngine = new UberCache()
      , memoize = uberMemoize('test5', cacheEngine)
      , fn = memoize(keys, 1000)

    fn({ a: 1, b: 2, c: 3 }, function (err, keys) {
      should.not.exist(err)
      keys.should.eql([ 'a', 'b', 'c' ])
      fn({ a: 1, b: 2, c: 3 }, function (err, keys) {
        should.not.exist(err)
        keys.should.eql([ 'a', 'b', 'c' ])
        done()
      })
    })

  })

  it('should not cache a function call with different objects as arguments', function (done) {

    var times = 0

    function keys(object, cb) {
      times++
      cb(null, Object.keys(object))
    }

    var cacheEngine = new UberCache()
      , memoize = uberMemoize('test5', cacheEngine)
      , fn = memoize(keys, 1000)

    fn({ a: 1, b: 2, c: 3 }, function (err, keys) {
      should.not.exist(err)
      keys.should.eql([ 'a', 'b', 'c' ])
      fn({ a: 3, b: 2, c: 1 }, function (err, keys) {
        should.not.exist(err)
        keys.should.eql([ 'a', 'b', 'c' ])
        times.should.equal(2)
        done()
      })
    })

  })

  it('should give the memoized function a clear() method', function (done) {

    var called = 0
    function slowFn(cb) {
      called++
      cb(null)
    }

    var cacheEngine = new UberCache()
      , memoize = uberMemoize('test6', cacheEngine)
      , fn = memoize(slowFn, 1000)

    // First call, function should run
    fn(function (err) {
      if (err) return done(err)
      called.should.equal(1)

      // Second call, should short circuit
      fn(function (err) {
        if (err) return done(err)
        called.should.equal(1)
        fn.clear(function() {
          // First call after invalidate, function should run
          fn(function (err) {
            if (err) return done(err)
            called.should.equal(2)
            done()
          })
        })

      })

    })

  })

})
