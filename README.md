# freeloader-stream

Base class for [freeloader](https://github.com/rprieto/freeloader) modules.

Freeloader modules are just normal [Transform streams](http://nodejs.org/api/stream.html#stream_class_stream_transform_1). However you must handle a few events so that all modules play nice. This base class provides the core functionality to make it easier.

Most modules should only worry about 4 things:

## on('request')

The `request` event is emitted for every request going through. Always assume there will be more than 1 request, since an upstream module could be emitting several requests on a timer for example.

```js
myStream.on('request', function(item) {
  // for each request
  console.log('Request: ', item.request.options.url);
  // for each response
  item.response.then(function(res) {
    console.log('Response: ', res.body);
  });
  // and pass along
  this.push(item);
});
```

#### The request item

- `item.request`: a [unirest](https://github.com/mashape/unirest-nodejs) request object
- `item.response`: a [Q](https://github.com/kriskowal/q) promise for the response
- `item.clone()`: returns a copy of the item, with the same request and a **new** response promise

#### Passing down requests

- You can call `this.push(item)` to forward the item to the next module.
- To multiply the number of requests, you can call `this.push(item.clone())` several times.
- Note that you don't *have* to forward every request.

## this.end()

Being a writable stream, this function will be called when the upstream module pushes `null`, i.e. is no longer emitting requests. You can decide to forward the end with `this.push(null)`, or ignore it to keep emitting requests yourself.

This is good place to generate reports. Note that this event will trigger while requests are still in flight. You can decide to wait for all pending reponses by calling `q.all()` on the response promises.

```js
myStream.on('end', function() {
  console.log('No more upstream requests!');
});
```

## on('shutdown')

This is called on every module if the user presses `Ctrl-C`. Modules that decided to ignore the upstream `end` event **must** respond to `shutdown`. You must not emit any new requests after this.

```js
myStream.on('shutdown', function() {
  console.log('Asked to shutdown');
  console.log('Not sending any more requests after this');
});
```

## this.terminate()

If you wish to shutdown the whole test, you can call `this.terminate()`. This will send a `SIGINT` to the whole process, which triggers the same behaviour as pressing `Ctrl-C`.

```js
setTimeout(function() {
  myStream.shutdown();
}, 1000);
```


# Full example

Here's a full example that prints every request and its response. You can find more examples at [freeloader-bundle](https://github.com/rprieto/freeloader-bundle).

```js
var util = require('util');
var FLS  = require('freeloader-stream');

function MyStream() {
  FLS.call(this);
  this.on('request', this.request);
}

util.inherits(MyStream, FLS);
MyStream.prototype.name = 'MyStream';

MyStream.prototype.request = function(item) {
  console.log('Req: ', item.request.options.url);
  item.response.then(function(res) {
    console.log('Res: ', res.body);
  });
  this.push(item);
};

MyStream.prototype.end = function() {
  console.log('Done!');
  this.push(null);
};

module.exports = function() {
  return new MyStream();
};
```
