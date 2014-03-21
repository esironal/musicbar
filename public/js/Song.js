function Song(options) {
  var options = options || {};

  this.bpm = options.bpm || 120;
  this.nrMeasures = options.nrMeasures || 1;
  this.subdivision = options.subdivision || 8;
  this.indexLastLocation = this.subdivision * this.nrMeasures;
  this.intervalDuration = 240 / this.subdivision / this.bpm * 1000;

  this.tracks = [];
}
/*
  Add track to array.
*/
Song.prototype.addTrack = function(track) {
  track.id = this.tracks.length;
  this.tracks.push(track);
}
/*
  Delete track from array.
*/
Song.prototype.removeTrack = function(trackID) {
  delete this.tracks[trackID];
  this.tracks.length--;
}
