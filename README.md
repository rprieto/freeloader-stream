# freeloader-stream

Base class for [freeloader](https://github.com/rprieto/freeloader) modules.

Freeloader modules are just normal [Transform streams](http://nodejs.org/api/stream.html#stream_class_stream_transform_1). However you must handle a few events so that all modules play nice, and so the pipeline can shut down gracefully. This base class provides a lot of the core functionality to make it easier.

Most modules should only worry about 3 things:

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

- `item.request`: the [unirest](https://github.com/mashape/unirest-nodejs) request object
- `item.response`: a [Q](https://github.com/kriskowal/q) promise for the response
- `item.clone()`: to returns a copy of the item, with the same request and a **new** response promise

#### Passing down requests

- You can call `this.push(item)` to forward the item to the next module.
- To multiply the number of requests, you can call `this.push(item.clone())` several times. Each clone will have their own response promise.
- If you decide to stop sending requests, you can call `this.push(null)` to signify the source has dried up.

## on('finish')

This function will be called when the whole test has finished. You can override it to generate reports.

```js
myStream.on('finish', function() {
  console.log('Done!');
});
```

## emit('terminate')

The only event you might need to emit is `this.emit('terminate')`, which signals the whole pipeline to shut down. The event will bubble all the way to the top, and call `on('finish')` on every module on the way down. 

```js
setTimeout(function() {
  myStream.emit('terminate');
}, 1000);
```

# Full example

Here's a full example that prints every request and its response. You can find more examples at [freeloader-bundle](https://github.com/rprieto/freeloader-bundle).

```js
var util = require('util');
var FLS  = require('freeloader-stream');

function MyStream() {
  FLS.call(this);
  this.on('request', this.onRequest);
  this.on('close', this.onClose);
}

util.inherits(MyStream, FLS);
MyStream.prototype.name = 'MyStream';

MyStream.prototype.onRequest = function(item, callback) {
  // for each request
  console.log('Req: ', item.request.options.url);
  // for each response
  item.response.then(function(res) {
    console.log('Res: ', res.body);
  });
  // and pass along
  this.push(item);
  callback();
};

MyStream.prototype.onClose = function() {
  // finished!
  process.stdout.write('Done!');
};

module.exports = function() {
  return new MyStream();
};
```
