# freeloader-stream

Base class for [freeloader](https://github.com/rprieto/freeloader) modules.

Freeloader modules are just normal [Transform streams](http://nodejs.org/api/stream.html#stream_class_stream_transform_1) in `flowing` mode. This base class provides the core functionality to make it easier.

Most modules should only worry about 4 things:

## on('request')

The `request` event is emitted for every request going through. Always assume there will be more than 1 request, since an upstream module could be emitting several requests on a timer for example.

```js
this.on('request', function(item) {
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
this.on('end', function() {
  console.log('No more upstream requests!');
});
```

## on('pause')

This is called if a downstream module asked the pipeline to stop. Modules that decided to ignore the upstream `end` event **must** respond to `pause`. You must not emit any new requests after this.

```js
this.on('pause', function() {
  console.log('Not sending any more requests after this');
});
```

## this.pause()

This notifies upstream modules that you don't want to get any more requests. They should honor this, which will terminate the pipeline once the event loop is clear.

```js
var myStream = this;
setTimeout(function() {
  myStream.pause();
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
