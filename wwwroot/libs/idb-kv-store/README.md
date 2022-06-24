# idb-kv-store [![Build Status](https://travis-ci.org/xuset/idb-kv-store.svg?branch=master)](https://travis-ci.org/xuset/idb-kv-store) [![npm](https://img.shields.io/npm/v/idb-kv-store.svg)](https://npmjs.org/package/idb-kv-store)

#### Simple key-value store backed by IndexedDB

[![Sauce Test Status](https://saucelabs.com/browser-matrix/xuset-idb-kv.svg)](https://saucelabs.com/u/xuset-idb-kv)

idb-kv-store uses asynchronous operations to persist and retrieve key-value pairs from the underlying database. The idb-kv-store instance presents a much simpler api than IndexedDB, doesn't have the very limiting data size constraints of localStorage, and the persisted data is available between different instances, web sessions, and web workers.

Additionally, mutation events allow users to listen for database changes that occur in different instances, windows, or workers.

This module can be used with [browserify](http://browserify.org/) or the [idbkvstore.min.js](https://raw.githubusercontent.com/xuset/idb-kv-store/master/idbkvstore.min.js) script can be included which will attach `IdbKvStore` to `window`.

## Usage

```js
var store = new IdbKvStore('the name of store')

// Store the value 'def' at key 'abc'
store.set('abc', 'def', function (err) {
  if (err) throw err
  store.get('abc', function (err, value) {
    if (err) throw err
    console.log('key=abc  value=' + value)
  })
})
```

Promises are also supported!

```js
store.get('abc').then(value => {
  console.log('key=abc  value=' + value)
})
```

Listen for database mutation events

```js
store.on('add', change => { // add, set, and remove events supported
  console.log('key=' + change.key, 'value=' + change.value)
})

// 'add' fails if the key already exists
someOtherStore.add('foo', 'bar')
```

Group multiple operations in an atomic and durable transaction

```js
var transaction = store.transaction('readwrite')

transaction.add('value1') // key will be auto-generated
transaction.add('value2') // key will be auto-generated

transaction.done.then(() => {
  console.log('Everything is persisted to disk!')
})
```

## API

### `store = new IdbKvStore(name, [opts], [cb])`

Instantiates a new key-value store. `name` is the name of the database used to persist the data. So multiple Store instances with the same name will be sharing the same data.

`cb(err)` is called when the databases is opened. If the open was successful then `err` is null, otherwise `err` contains the error.

`opts` can have the following property:
 * opts.channel - If the browser does not natively support BroadcastChannel then a custom implementation can be passed in.

### `store.set(key, value, [cb])`

Stores the `value` at `key`; the value can be retrieved through `store.get(key)`. When the store operation completes, `cb` is called with `cb(err)`. `err` is null if the store was successful. If `cb` is undefined then a promise is returned instead. If the key already exists then the old value is replaced with the new one.

### `store.add([key], value, [cb])`

The same as `store.set(...)` except if the key already exists, an error is returned in the callback.

Additionally, the key is optional. If left empty then an integer key will be automatically generated. Example: `store.add('value')`

### `store.get(key, [cb])`

Retrieves the value at `key`. When the value is retrieved, `cb` is called with `cb(err, value)`. If the retrieval was successful then `err` will be null. If `cb` is undefined then a promise is returned instead. If the key does not exist then undefined is returned as the `value`; no error is raised.

### `store.getMultiple(keys, [cb])`

Works similar to `store.get` but for an array of keys. The result will be an array, containing a `value` for each key if it was found. If no value was found for a key, the array will contain `undefined` at that index; no error is raised.
Passing the same key twice will result in the same reference being included twice in the result.

### `store.remove(key, [cb])`

Removes the given key from the store and calls `cb(err)` upon completion. `err` is null if the removal was successful. If the key did not exist before the removal, the removal is still considered successful. If `cb` is undefined then a promise is returned.

### `store.clear([cb])`

Removes all entries from the store, and calls `cb(err)` upon completion. `err` is null the clear was successful. If `cb` is undefined then a promise is returned.

### `store.keys([range], [cb])`

Retrieves the list of keys stored. When the list is retrieved, `cb` is called with `cb(err, keys)`. If `cb` is undefined then a promise is returned.

To only return a specific range, an [IDBKeyRange](https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange) can be passed into `range`

### `store.values([range], [cb])`

Retrieves the list of values stored. When the list is retrieved, `cb` is called with `cb(err, keys)`. If `cb` is undefined then a promise is returned.

To only return a specific range, an [IDBKeyRange](https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange) can be passed into `range`

### `store.json([range], [cb])`

Retrieves the entire key-value store as a json object. When the json representation has been retrieved, `cb` is called with `cb(err, json)`. If `cb` is undefined, then a promise is returned.

To only return a specific range, an [IDBKeyRange](https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange) can be passed into `range`

### `store.count([range], [cb])`

Retrieves the number of entries in the store, and calls `cb(err, count)` upon retrieval. `err` is null if the count was successful, in which case `count` will hold the value. If `cb` is undefined, then a promise is returned.

To only count the number of entries in a specific range, an [IDBKeyRange](https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange) can be passed into `range`

### `store.iterator([range], function (err, cursor) {})`

Iterate over each item in the database. Example
```js
store.iterator(function (err, cursor) {
  if (err) throw err
  if (cursor) { // If we haven't reached the end
    console.log('key=' + cursor.key, 'value=' + cursor.value)
    cursor.continue() // This method will be called with the next item
  }
})
```

To only iterate over a specific range, an [IDBKeyRange](https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange) can be passed into `range`

### `var transaction = store.transaction([mode], [cb])`

Returns a Transaction that allows for multiple operations to be grouped together in a durable and atomic way. `mode` can take the strings `'readwrite'` or `'readonly'`, and defaults to `'readwrite'`. The methods of the Transaction object are identical to the ones in IdbKvStore, and include: `add`, `set`, `get`, `remove`, `clear`, `keys`, `values`, `json`, `count`, and `iterator`.

Transactions automatically commit after the last callback of a request completes and no new requests are made. Once the transaction has finished, `cb(err)` is called. If `err` is `null` then the transaction has been committed successfully.

#### `transaction.done` - Promise
In browsers that have promise support `transaction.done` is a promise that resolves when the transaction commits successfully or rejects if the transaction fails to commit. This promise behaves the same way as the callback `cb` passed into `store.transaction(...)`, and because of this both the callback and promise variant cannot be used simultaneously. If a callback is passed to `store.transaction` then `transaction.done` is `undefined`. This is also the case if the browser does not have promise support.

#### `transaction.abort()`

Rolls back any changes made by the transaction. The transaction is considered finish now.

### `store.close()`

Closes the IndexedDB database and frees the internal resources. All subsequent calls to methods in `store` will throw errors.

### `IdbKvStore.INDEXEDDB_SUPPORT`

Detects native IndexedDB support

### `IdbKvStore.BROADCAST_SUPPORT`

Detects native BroadcastChannel support. If the BroadcastChannel api is not present then the mutation events will not be emitted.

## Events

### `store.on('open', function () {})`

Emitted when the database is open

### `store.on('add', function (change) {})`

Emitted when another instance adds an item to the database by calling `store.add(...)`. The `change` object has the following properties:

* `change.method` - always set to 'add'
* `change.key` - the key that value was added to
* `change.value` - the new value

See [Supported Browsers](#supported-browsers) for more info on which browsers support this event.

### `store.on('set', function (change) {})`

Emitted when another instance sets the value of a key in the database by calling `store.set(...)`. The `change` object has the following properties:

* `change.method` - always set to 'set'
* `change.key` - the key that value was set to
* `change.value` - the new value

See [Supported Browsers](#supported-browsers) for more info on which browsers support this event.

### `store.on('remove', function (change) {})`

Emitted when another instance removes an item from the database by calling `store.remove(...)`. The `change` object has the following properties:

* `change.method` - always set to 'remove'
* `change.key` - the key of the value that was removed

See [Supported Browsers](#supported-browsers) for more info on which browsers support this event.

### `store.on('close', function () {})`

Emitted when the database is closed

### `store.on('error', function (err) {})`

Emitted if any unhandled error occures.

## Supported Browsers

idb-kv-store supports all browsers that have implemented the IndexedDB api. However, the mutation events, add/set/remove, are only available in browsers that have implemented the BroadcastChannel api. Attempting to listen on a add/set/remove event in a browser that does not support the BroadcastChannel api will cause an error to be emitted. `IdbKvStore.BROADCAST_SUPPORT` will indicate if the browser supports this api.

The list of browsers that support BroadcastChannels can be found on [caniuse.com](http://caniuse.com/#search=broadcastchannel)

## License

MIT. Copyright (c) Austin Middleton.
