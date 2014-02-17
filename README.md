# freeloader-stream

Base class for [freeloader](https://github.com/rprieto/freeloader) streams.
These are [Transform streams](http://nodejs.org/api/stream.html#stream_class_stream_transform_1), which are both readable and writable.

You can create your own stream from scratch, but this class provides a lot of the core functionality to make it easier.

## An example

```js
var util = require('util');
var FLS  = require('freeloader-stream');

function MyStream() {
  FLS.call(this);
}

util.inherits(MyStream, FLS);
MyStream.prototype.name = 'MyStream';

MyStream.prototype._transform = function(item, encoding, callback) {
  FLS.prototype._transform.call(this);
  // for each request
  process.stdout.write('o');
  // for each response
  item.response.then(function(res) {
    process.stdout.write('x');
  });
  // and pass along
  this.push(item);
  callback();
};

MyStream.prototype.end = function() {
  // finished!
  FLS.prototype.end.call(this);
  process.stdout.write('!');
};

module.exports = function() {
  return new MyStream();
};
```

## How it works

### _transform()

The `_transform` function will be called for every request going through. Always assume there will be more than 1 request, since an upstream module could be emitting several on a timer for example.

The `item` parameter is an object that contains:

- `request`: the [unirest](https://github.com/mashape/unirest-nodejs) request object
- `response`: a [Q](https://github.com/kriskowal/q) promise for a response
- `clone()`: a function that returns a copy of the item, with the same request and a **new** response promise

Inside the `_transform` function, you can call `this.push(item)` to forward the item to the next module. As long as you clone the item, you can call `push` several times to multiply the number of requests.

### end()

This function will be called when the test has finished. You can override it to generate reports. You must call `this.push(null)` to pass down the `end()` event downstream.

### emit()

The only event you should emit is `this.emit('terminate')`, which signals the whole pipeline to shut down. The event will bubble all the way to the top, and call `end()` on every module on the way down. 
