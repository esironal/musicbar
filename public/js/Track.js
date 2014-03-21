function Track(options) {
  var options = options || {};

  // Allow passing just an instrument
  if (options.constructor.name == "Instrument") {
    var instrument = options;
    var options = {
      instrument: instrument
    };
  }

  if (!('instrument' in options)) {
    throw new IllegalArgumentException('A track must be passed an instrument');
  }

  this.instrument = options.instrument;
  this.name = options.name || this.instrument.name;
  this.volume = 80;
  this.muted = false;
  this.color = options.color || 'color-' + Math.round((Math.random() * 3) + 1);
  this.notes = {}
  this.id = -1;
}
/*
  Add a note to array.
*/
Track.prototype.addNote = function(note) {
  if (note.constructor.name != "Note") {
    throw new IllegalArgumentException("Please specify an object of type" +
                                       " Note to add.");
  }
  if (!(note.location in this.notes)) {
    this.notes[note.location] = {};
  }
  this.notes[note.location][note.value] = note;
}
/*
  Remove note from array.
*/
Track.prototype.removeNote = function(location, value){
  delete this.notes[location][value];
  if (Object.keys(this.notes[location]).length == 0) {
    delete this.notes[location];
  }
}
