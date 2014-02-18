var util      = require('util');
var Transform = require('stream').Transform;

util.inherits(FreeLoaderStream, Transform);

function log() {
  if (process.env.DEBUG) {
    var args = Array.prototype.slice.call(arguments);
    console.log.apply(this, args);
  }
}

function FreeLoaderStream(count) {

  Transform.call(this, {objectMode : true});

  // Set when the pipeline is terminated
  this.finished = false;

  // Terminate event
  this.on('terminate', this.onTerminate);

  // Relay the termination event to upstream modules
  this.on('pipe', function(s) {
    this.on('terminate', function(err) {
      log(this.name + ': relay terminate');
      s.emit('terminate');
    });
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
  log(this.name + ': end');
  this.emit('finish');
  this.push(null);
};

FreeLoaderStream.prototype.onTerminate = function() {
  log(this.name + ': terminate');
  this.finished = true;
};


module.exports = FreeLoaderStream;
