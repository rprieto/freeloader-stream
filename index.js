var util      = require('util');
var Transform = require('stream').Transform;

util.inherits(FreeLoaderStream, Transform);

function log() {
  if (process.env.DEBUG) {
    var args = Array.prototype.slice.call(arguments);
    console.log.apply(this, args);
  }
}

function FreeLoaderStream(options) {

  options = options || {};
  options.objectMode = true;
  Transform.call(this, options);

  // still running?
  this.finished = false;

  this.on('pause', function() {
    log(this.name, ': on pause');
    this.finished = true;
  }.bind(this));

  this.on('pipe', function(upstream) {

    // put upstream modules in flowing mode
    // we must send down every request as fast as possible
    upstream.on('data', function(chunk) {
      log('\n' + this.name + ' got data from ' + upstream.name);
      if (!this.finished) {
        this.emit('request', chunk);
      }
    }.bind(this));

    // and if we're asking to pause
    // they should too
    this.on('pause', function() {
      upstream.emit('pause');
    });

  }.bind(this));

}

FreeLoaderStream.prototype.name = 'FreeLoaderStream';

FreeLoaderStream.prototype.end = function() {
  // should be overriden
}

module.exports = FreeLoaderStream;
