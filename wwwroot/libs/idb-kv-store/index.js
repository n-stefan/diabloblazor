/* eslint-env browser */

module.exports = IdbKvStore

var EventEmitter = require('events').EventEmitter
var inherits = require('inherits')
var promisize = require('promisize')

var global = typeof window === 'undefined' ? self : window
var IDB = global.indexedDB || global.mozIndexedDB || global.webkitIndexedDB || global.msIndexedDB

IdbKvStore.INDEXEDDB_SUPPORT = IDB != null
IdbKvStore.BROADCAST_SUPPORT = global.BroadcastChannel != null

inherits(IdbKvStore, EventEmitter)
function IdbKvStore (name, opts, cb) {
  var self = this
  if (typeof name !== 'string') throw new Error('A name must be supplied of type string')
  if (!IDB) throw new Error('IndexedDB not supported')
  if (typeof opts === 'function') return new IdbKvStore(name, null, opts)
  if (!(self instanceof IdbKvStore)) return new IdbKvStore(name, opts, cb)
  if (!opts) opts = {}

  EventEmitter.call(self)

  self._db = null
  self._closed = false
  self._channel = null
  self._waiters = []

  var Channel = opts.channel || global.BroadcastChannel
  if (Channel) {
    self._channel = new Channel(name)
    self._channel.onmessage = onChange
  }

  var request = IDB.open(name)
  request.onerror = onerror
  request.onsuccess = onsuccess
  request.onupgradeneeded = onupgradeneeded

  self.on('newListener', onNewListener)

  function onerror (event) {
    handleError(event)
    self._close(event.target.error)
    if (cb) cb(event.target.error)
  }

  function onDbError (event) {
    handleError(event)
    self._close(event.target.error)
  }

  function onsuccess (event) {
    if (self._closed) {
      event.target.result.close()
    } else {
      self._db = event.target.result
      self._db.onclose = onclose
      self._db.onerror = onDbError
      for (var i in self._waiters) self._waiters[i]._init(null)
      self._waiters = null
      if (cb) cb(null)
      self.emit('open')
    }
  }

  function onupgradeneeded (event) {
    var db = event.target.result
    db.createObjectStore('kv', {autoIncrement: true})
  }

  function onclose () {
    self._close()
  }

  function onNewListener (event) {
    if (event !== 'add' && event !== 'set' && event !== 'remove') return
    if (!self._channel) return self.emit('error', new Error('No BroadcastChannel support'))
  }

  function onChange (event) {
    if (event.data.method === 'add') self.emit('add', event.data)
    else if (event.data.method === 'set') self.emit('set', event.data)
    else if (event.data.method === 'remove') self.emit('remove', event.data)
  }
}

IdbKvStore.prototype.get = function (key, cb) {
  return this.transaction('readonly').get(key, cb)
}

IdbKvStore.prototype.getMultiple = function (keys, cb) {
  return this.transaction('readonly').getMultiple(keys, cb)
}

IdbKvStore.prototype.set = function (key, value, cb) {
  cb = promisize(cb)
  var error = null
  var t = this.transaction('readwrite', function (err) {
    error = error || err
    cb(error)
  })
  t.set(key, value, function (err) {
    error = err
  })
  return cb.promise
}

IdbKvStore.prototype.json = function (range, cb) {
  return this.transaction('readonly').json(range, cb)
}

IdbKvStore.prototype.keys = function (range, cb) {
  return this.transaction('readonly').keys(range, cb)
}

IdbKvStore.prototype.values = function (range, cb) {
  return this.transaction('readonly').values(range, cb)
}

IdbKvStore.prototype.remove = function (key, cb) {
  cb = promisize(cb)
  var error = null
  var t = this.transaction('readwrite', function (err) {
    error = error || err
    cb(error)
  })
  t.remove(key, function (err) {
    error = err
  })
  return cb.promise
}

IdbKvStore.prototype.clear = function (cb) {
  cb = promisize(cb)
  var error = null
  var t = this.transaction('readwrite', function (err) {
    error = error || err
    cb(error)
  })
  t.clear(function (err) {
    error = err
  })
  return cb.promise
}

IdbKvStore.prototype.count = function (range, cb) {
  return this.transaction('readonly').count(range, cb)
}

IdbKvStore.prototype.add = function (key, value, cb) {
  cb = promisize(cb)
  var error = null
  var t = this.transaction('readwrite', function (err) {
    error = error || err
    cb(error)
  })
  t.add(key, value, function (err) {
    error = err
  })
  return cb.promise
}

IdbKvStore.prototype.iterator = function (range, next) {
  return this.transaction('readonly').iterator(range, next)
}

IdbKvStore.prototype.transaction = function (mode, onfinish) {
  if (this._closed) throw new Error('Database is closed')

  var transaction = new Transaction(this, mode, onfinish)
  if (this._db) transaction._init(null)
  else this._waiters.push(transaction)
  return transaction
}

IdbKvStore.prototype.close = function () {
  this._close()
}

IdbKvStore.prototype._close = function (err) {
  if (this._closed) return
  this._closed = true

  if (this._db) this._db.close()
  if (this._channel) this._channel.close()

  this._db = null
  this._channel = null

  if (err) this.emit('error', err)

  this.emit('close')

  for (var i in this._waiters) this._waiters[i]._init(err || new Error('Database is closed'))
  this._waiters = null

  this.removeAllListeners()
}

function Transaction (kvStore, mode, cb) {
  if (typeof mode === 'function') return new Transaction(kvStore, null, mode)

  this._kvStore = kvStore
  this._mode = mode || 'readwrite'
  this._objectStore = null
  this._waiters = null

  this.finished = false
  this.onfinish = promisize(cb) // `onfinish` public variable for backwards compatibility with v4.3.1
  this.done = this.onfinish.promise

  if (this._mode !== 'readonly' && this._mode !== 'readwrite') {
    throw new Error('mode must be either "readonly" or "readwrite"')
  }
}

Transaction.prototype._init = function (err) {
  var self = this

  if (self.finished) return
  if (err) return self._close(err)

  var transaction = self._kvStore._db.transaction('kv', self._mode)
  transaction.oncomplete = oncomplete
  transaction.onerror = onerror
  transaction.onabort = onerror

  self._objectStore = transaction.objectStore('kv')

  for (var i in self._waiters) self._waiters[i](null, self._objectStore)
  self._waiters = null

  function oncomplete () {
    self._close(null)
  }

  function onerror (event) {
    handleError(event)
    self._close(event.target.error)
  }
}

Transaction.prototype._getObjectStore = function (cb) {
  if (this.finished) throw new Error('Transaction is finished')
  if (this._objectStore) return cb(null, this._objectStore)
  this._waiters = this._waiters || []
  this._waiters.push(cb)
}

Transaction.prototype.set = function (key, value, cb) {
  var self = this
  if (key == null || value == null) throw new Error('A key and value must be given')
  cb = promisize(cb)

  self._getObjectStore(function (err, objectStore) {
    if (err) return cb(err)

    try {
      var request = objectStore.put(value, key)
    } catch (e) {
      return cb(e)
    }

    request.onerror = handleError.bind(this, cb)
    request.onsuccess = function () {
      if (self._kvStore._channel) {
        self._kvStore._channel.postMessage({
          method: 'set',
          key: key,
          value: value
        })
      }
      cb(null)
    }
  })

  return cb.promise
}

Transaction.prototype.add = function (key, value, cb) {
  var self = this
  if (value == null && key != null) return self.add(undefined, key, cb)
  if (typeof value === 'function' || (value == null && cb == null)) return self.add(undefined, key, value)
  if (value == null) throw new Error('A value must be provided as an argument')
  cb = promisize(cb)

  self._getObjectStore(function (err, objectStore) {
    if (err) return cb(err)

    try {
      var request = key == null ? objectStore.add(value) : objectStore.add(value, key)
    } catch (e) {
      return cb(e)
    }

    request.onerror = handleError.bind(this, cb)
    request.onsuccess = function () {
      if (self._kvStore._channel) {
        self._kvStore._channel.postMessage({
          method: 'add',
          key: key,
          value: value
        })
      }
      cb(null)
    }
  })

  return cb.promise
}

Transaction.prototype.get = function (key, cb) {
  var self = this
  if (key == null) throw new Error('A key must be given as an argument')
  cb = promisize(cb)

  self._getObjectStore(function (err, objectStore) {
    if (err) return cb(err)

    try {
      var request = objectStore.get(key)
    } catch (e) {
      return cb(e)
    }

    request.onerror = handleError.bind(this, cb)
    request.onsuccess = function (event) {
      cb(null, event.target.result)
    }
  })

  return cb.promise
}

Transaction.prototype.getMultiple = function (keys, cb) {
  var self = this
  if (keys == null) throw new Error('An array of keys must be given as an argument')
  cb = promisize(cb)

  if (keys.length === 0) {
    cb(null, [])
    return cb.promise
  }

  self._getObjectStore(function (err, objectStore) {
    if (err) return cb(err)

    // Implementation mostly taken from https://www.codeproject.com/Articles/744986/How-to-do-some-magic-with-indexedDB
    var sortedKeys = keys.slice().sort()
    var i = 0
    var resultsMap = {}
    var getReturnValue = function () {
      return keys.map(function (key) {
        return resultsMap[key]
      })
    }
    var cursorReq = objectStore.openCursor()
    cursorReq.onerror = handleError.bind(this, cb)
    cursorReq.onsuccess = function (event) {
      var cursor = event.target.result
      if (!cursor) {
        cb(null, getReturnValue())
        return
      }
      var key = cursor.key
      while (key > sortedKeys[i]) {
        // The cursor has passed beyond this key. Check next.
        ++i
        if (i === sortedKeys.length) {
          // There is no next. Stop searching.
          cb(null, getReturnValue())
          return
        }
      }
      if (key === sortedKeys[i]) {
        resultsMap[key] = cursor.value
        // The current cursor value should be included and we should continue
        // a single step in case next item has the same key or possibly our
        // next key in sortedKeys.
        cursor.continue()
      } else {
        // cursor.key not yet at sortedKeys[i]. Forward cursor to the next key to hunt for.
        cursor.continue(sortedKeys[i])
      }
    }
  })

  return cb.promise
}

Transaction.prototype.json = function (range, cb) {
  var self = this
  if (typeof range === 'function') return self.json(null, range)
  cb = promisize(cb)

  var json = {}
  self.iterator(range, function (err, cursor) {
    if (err) return cb(err)
    if (cursor) {
      json[cursor.key] = cursor.value
      cursor.continue()
    } else {
      cb(null, json)
    }
  })

  return cb.promise
}

Transaction.prototype.keys = function (range, cb) {
  var self = this
  if (typeof range === 'function') return self.keys(null, range)
  cb = promisize(cb)

  var keys = []
  self.iterator(range, function (err, cursor) {
    if (err) return cb(err)
    if (cursor) {
      keys.push(cursor.key)
      cursor.continue()
    } else {
      cb(null, keys)
    }
  })

  return cb.promise
}

Transaction.prototype.values = function (range, cb) {
  var self = this
  if (typeof range === 'function') return self.values(null, range)
  cb = promisize(cb)

  var values = []
  self.iterator(range, function (err, cursor) {
    if (err) return cb(err)
    if (cursor) {
      values.push(cursor.value)
      cursor.continue()
    } else {
      cb(null, values)
    }
  })

  return cb.promise
}

Transaction.prototype.remove = function (key, cb) {
  var self = this
  if (key == null) throw new Error('A key must be given as an argument')
  cb = promisize(cb)

  self._getObjectStore(function (err, objectStore) {
    if (err) return cb(err)

    try {
      var request = objectStore.delete(key)
    } catch (e) {
      return cb(e)
    }

    request.onerror = handleError.bind(this, cb)
    request.onsuccess = function () {
      if (self._kvStore._channel) {
        self._kvStore._channel.postMessage({
          method: 'remove',
          key: key
        })
      }
      cb(null)
    }
  })

  return cb.promise
}

Transaction.prototype.clear = function (cb) {
  var self = this
  cb = promisize(cb)

  self._getObjectStore(function (err, objectStore) {
    if (err) return cb(err)

    try {
      var request = objectStore.clear()
    } catch (e) {
      return cb(e)
    }

    request.onerror = handleError.bind(this, cb)
    request.onsuccess = function () {
      cb(null)
    }
  })

  return cb.promise
}

Transaction.prototype.count = function (range, cb) {
  var self = this
  if (typeof range === 'function') return self.count(null, range)
  cb = promisize(cb)

  self._getObjectStore(function (err, objectStore) {
    if (err) return cb(err)

    try {
      var request = range == null ? objectStore.count() : objectStore.count(range)
    } catch (e) {
      return cb(e)
    }

    request.onerror = handleError.bind(this, cb)
    request.onsuccess = function (event) {
      cb(null, event.target.result)
    }
  })

  return cb.promise
}

Transaction.prototype.iterator = function (range, next) {
  var self = this
  if (typeof range === 'function') return self.iterator(null, range)
  if (typeof next !== 'function') throw new Error('A function must be given')
  self._getObjectStore(function (err, objectStore) {
    if (err) return next(err)

    try {
      var request = range == null ? objectStore.openCursor() : objectStore.openCursor(range)
    } catch (e) {
      return next(e)
    }

    request.onerror = handleError.bind(this, next)
    request.onsuccess = function (event) {
      var cursor = event.target.result
      next(null, cursor)
    }
  })
}

Transaction.prototype.abort = function () {
  if (this.finished) throw new Error('Transaction is finished')
  if (this._objectStore) this._objectStore.transaction.abort()
  this._close(new Error('Transaction aborted'))
}

Transaction.prototype._close = function (err) {
  if (this.finished) return
  this.finished = true

  this._kvStore = null
  this._objectStore = null

  for (var i in this._waiters) this._waiters[i](err || new Error('Transaction is finished'))
  this._waiters = null

  if (this.onfinish) this.onfinish(err)
  this.onfinish = null
}

function handleError (cb, event) {
  if (event == null) return handleError(null, cb)
  event.preventDefault()
  event.stopPropagation()
  if (cb) cb(event.target.error)
}
