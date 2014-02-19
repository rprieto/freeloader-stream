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

  // Set when the pipeline is terminated
  this.shuttingDown = false;

  // Relay the shutdown event
  // from upstream all the way down
  this.on('pipe', function(upstream) {
    upstream.on('shutdown', function() {
      this.emit('shutdown');
    }.bind(this));
  }.bind(this));

}

FreeLoaderStream.prototype.name = 'FreeLoaderStream';

FreeLoaderStream.prototype._transform = function(chunk, encoding, callback) {
  log(this.name + ': _transform');
  if (!this.finished) {
    this.emit('request', chunk, callback);
    callback();
  }
};

FreeLoaderStream.prototype.end = function() {
  // should be overriden
}

FreeLoaderStream.prototype.terminate = function() {
  // Send the same signal as Ctrl-C
  // This will be caught by the emitter at the top
  this.finished = true;
  process.kill(process.pid, 'SIGINT');
};

module.exports = FreeLoaderStream;
