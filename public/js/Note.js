function Note(options) {
  // Allow passing just the location
  if (typeof options == "number" || options === 0) {
    var location = options;
    var options = {
      location: location
    };
  } else {
    if (!('location' in options)) {
      throw new IllegalArgumentException('Please specify the location when making'
                                         + ' a note');
    }
  }

  var options = options || {};

  this.value = options.value || 60; // Middle C
  this.velocity = options.velocity || 80;
  this.location = options.location; // Beat not set
}

// Notes can not go outside of MIDI bounds
Note.prototype.minValue = 0;
Note.prototype.maxValue = 127;
Note.prototype.minVelocity = 0;
Note.prototype.maxVelocity = 127;
