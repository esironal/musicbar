//  ____
// / ___|  ___  __ _ _   _  ___ _ __   ___ ___ _ __
// \___ \ / _ \/ _` | | | |/ _ \ '_ \ / __/ _ \ '__|
//  ___) |  __/ (_| | |_| |  __/ | | | (_|  __/ |
// |____/ \___|\__, |\__,_|\___|_| |_|\___\___|_|
//                |_|
//
function Sequencer(options) {
  // ========== Options ========== //
  var options = options || {};

  // check for mandatory options
  if(!('elemSequencer' in options)){
    throw new IllegalArgumentException("Please specify the following mandatory options:"
      + " elemSequencer.");
  }

  this.elemSequencer = options.elemSequencer;
  this.elemArrangement = this.elemSequencer.querySelector('.arrangement');
  this.elemBottomControls = this.elemSequencer.querySelector('.bottom-controls');

  // ========== Setup ========== //
  var self = this;

  this.song = options.song || new Song();
  this.grid = new Grid({
    displayedSubdivision: this.song.subdivision
  });
  this.library = new Library();

  this.indexCurrentLocation = 0;
  this.loop = true;
  this.states = {
    PAUSE: 1,
    PLAY: 2
  };
  this.state = this.states.PAUSE;
  this.tools = {
    ADD: 1,
    DELETE: 2,
    CHANGEVALUE: 3
  }
  this.selectedTool = this.tools.ADD;
  this.audioElems = {};

  // ========== Load instruments from library ========== //
  this.song.tracks = [];
  // Add all tracks from the library to selector
  var addTrackSelect = this.elemBottomControls.querySelector('.add-track select');
  for (index in this.library.instruments) {
    var addTrackOption = document.createElement('option');
    addTrackOption.setAttribute('value', index);
    addTrackOption.innerHTML = this.library.instruments[index].name;
    addTrackSelect.appendChild(addTrackOption);
  }
  // Bind the selector
  var addTrackButton = this.elemBottomControls.querySelector('.add-track button');
  addTrackButton.addEventListener('click', function() {
    var selected = addTrackSelect.options[addTrackSelect.selectedIndex];
    var selectedID = selected.value;
    var addedTrack = new Track(self.library.instruments[selectedID]);
    self.song.addTrack(addedTrack);
    self.pushTrack(addedTrack);
  });
  // Add first instrument
  var track = new Track(this.library.instruments['acoustic-grand-piano']);
  this.song.addTrack(track);
  this.pushTrack(track);

  // ========== Intervals ========== //
  this.intervals = {};
  this.intervals.loop = setInterval(function(){
    self.logic();
  }, this.song.intervalDuration);


  // ========== DOM Setup ========== //
  this.initTimeline();
  // this.loadAllSounds();

  // ========== Events ==========

  // set up onclick for note selection
  // TODO: improve this part's logic
  this.elemArrangement.addEventListener('click', function(e){
    var target = getEventTarget(e);
    if (!target.classList.contains('note') &&
        !target.classList.contains('track') &&
        !target.classList.contains('value-row')
      ){
      return;
    }

    var distanceLeft = e.pageX;
    var value = false;

    // If we selected a value-row, get its value then its track
    if (target.classList.contains('value-row')) {
      value = parseInt(target.getAttribute('value'));
      var track = target.parentNode.parentNode.parentNode;
    }
    // If we selected a note, get its value and track
    if (target.classList.contains('note')) {
      // Get value from parentNode which is a value-row
      value = parseInt(target.getAttribute('value'));

      var track = target.parentNode.parentNode.parentNode;
      if (target.classList.contains('note-full')) {
        track = track.parentNode;
      }
    }
    // If we selected a track, we already have the track
    if (target.classList.contains('track')) {
      var track = target;
    }

    var info = track.querySelector('.info');
    infoWidth = getComputedStyle(info, '')['width'].replace("px", "");;
    var compensatedDifferenceLeft = distanceLeft - infoWidth;
    var location = Math.floor(compensatedDifferenceLeft
                              / self.grid.subdivisionWidth);

    var trackID = track.getAttribute('trackID');

    if (location in self.song.tracks[trackID]
        || target.classList.contains('note')) {
      self.song.tracks[trackID].removeNote(location, value);
      self.popNote(trackID, location, value);
    } else {
      var note = new Note({
        location: location,
        value: value
      });
      self.song.tracks[trackID].addNote(note);
      self.pushNote(trackID, note);
    }
  });

  // set up onclick for tool selection
  [].forEach.call(
    this.elemBottomControls.querySelectorAll('.select-tool button'),
    function(elem) {
      elem.addEventListener('click', function() {
        if (this.classList.contains('btn-primary')) {
          [].forEach.call(
            self.elemBottomControls.querySelectorAll('.select-tool button.btn-success'),
            function(elem) {
              elem.classList.remove('btn-success');
              elem.classList.add('btn-primary');
            }
          );
          this.classList.remove('btn-primary');
          this.classList.add('btn-success');
          self.selectedTool = parseInt(this.getAttribute('value'));
        }
      });
    }
  );
}
/*
  Make the minimum necessary timeline DOM content.
*/
Sequencer.prototype.initTimeline = function() {
  // Add cursor
  this.elemCursor = this.createElement('div', ['cursor', 'primary']);
  this.elemCursor.style['width'] = this.grid.subdivisionWidth + 'px';
  this.elemArrangement.appendChild(this.elemCursor);
  this.updateCursor();

  // Add lines at the end of beats
  for(var indexCursor = 0; indexCursor <= this.song.indexLastLocation;
      indexCursor += this.grid.displayedSubdivision
  ){
    this.addMarkerAfterLocation(indexCursor);
  }
}
/*
  Add a line at the end of a location (like a bar line).
*/
Sequencer.prototype.addMarkerAfterLocation = function(location) {
  var cursor = this.createElement('div', ['cursor', 'marker']);
  cursor.style['left'] = location * this.grid.subdivisionWidth + 'px';
  this.elemArrangement.appendChild(cursor);
}
/*
  Look through the existing events and load any notes they need
*/
Sequencer.prototype.loadAllSounds = function() {
  for (indexTrack in this.song.tracks){
    var track = this.song.tracks[indexTrack];
    for (indexNote in track.notes) {
      var note = track.notes[indexNote];
      if(!this.isAudioLoaded(note.id, note.value)){
        this.loadAudio(note.id, note.value);
      }
    }
  }
}
/*
  Make a location the current location.
*/
Sequencer.prototype.goToLocation = function(location) {
  this.indexCurrentLocation = location;
  this.updateCursor();
}
/*
  Method to simplify DOM element creation
*/
Sequencer.prototype.createElement = function(tag, classes, id) {
  // Element
  if (typeof tag == "undefined") {
    throw new IllegalArgumentException("A tag name must be specified.");
  }
  var elem = document.createElement(tag);

  // Classes
  if (typeof classes != "undefined" && classes.length > 0) {
    for (indexClass in classes) {
      elem.classList.add(classes[indexClass]);
    }
  }

  // ID
  if (typeof id != "undefined") {
    elem.setAttribute('id', id);
  }

  return elem;
}
/*
  Add track to DOM.
*/
Sequencer.prototype.pushTrack = function(trackToPush) {
  var tracks = this.elemArrangement.querySelector('.tracks');
  var self = this;

  // track
  // -- notes
  //    -- summary
  //    -- full
  // -- separator
  // -- info
  //    -- identifier
  //       -- number
  //       -- name
  //    -- controls
  //       -- btn btn-xs delete
  //       -- btn btn-xs mute

  // track
  var track = this.createElement('div', ['track', 'track-' + trackToPush.id,
                                        trackToPush.color, 'clearfix']);
  track.setAttribute('trackID', trackToPush.id);

  // notes
  var notes = this.createElement('div', ['notes', 'clearfix']);
  var notesSummary = this.createElement('div', ['summary']);
  notes.appendChild(notesSummary);
  var notesFull = this.createElement('div', ['full']);
  for (var i = 0; i < 128; i++) {
    var row = this.createElement('div', ['value-row', 'value-row-' + i]);
    row.setAttribute('value', i);
      var separator = this.createElement('div', ['row-separator']);
      row.appendChild(separator);

      var value = this.createElement('div', ['value']);
      value.innerHTML = i;
      row.appendChild(value);

    notesFull.appendChild(row);
  }
  notes.appendChild(notesFull);
  track.appendChild(notes);

  // separator
  var separator = this.createElement('div', ['separator']);
  track.appendChild(separator);

  // info
  var info = this.createElement('div', ['info']);
    // identifier
    var identifier = this.createElement('div', ['identifier']);
      // number
      var number = this.createElement('div', ['number']);
      number.innerHTML = trackToPush.id + 1;
      identifier.appendChild(number);
      // name
      var name = this.createElement('div', ['name']);
      name.innerHTML = trackToPush.name;
      identifier.appendChild(name);
    info.appendChild(identifier);
    // controls
    var controls = this.createElement('div', ['controls']);
      // delete
      var buttonDelete = this.createElement('button',
                                             ['btn', 'btn-xs', 'delete']);
      buttonDelete.innerHTML = '×';
      controls.appendChild(buttonDelete);
      // mute
      var buttonMute = this.createElement('button',
                                             ['btn', 'btn-xs', 'mute']);
      buttonMute.innerHTML = 'M';
      controls.appendChild(buttonMute);
    info.appendChild(controls);
  track.appendChild(info);

  tracks.appendChild(track);

  track.addEventListener('click', function(e) {
    var target = getEventTarget(e);
    if (target.classList.contains('btn')) {
      var track = target.parentNode.parentNode.parentNode;
      var trackID = track.getAttribute('trackID');
      if (target.classList.contains('mute')) {
        self.song.tracks[trackID].muted = !self.song.tracks[trackID].muted;
        target.classList.toggle('active');
        track.classList.toggle('muted');
      } else if (target.classList.contains('delete')) {
        self.song.removeTrack(trackID);
        self.popTrack(trackID);
      }
    } else if (target.classList.contains('name')) {
      var track = target.parentNode.parentNode.parentNode;
      if (track.classList.contains('expanded')) {

        track.classList.remove('expanded');
      } else {
        track.classList.add('expanded');
      }
    }
  });
}
/*
  Remove track from DOM.
*/
Sequencer.prototype.popTrack = function(trackID) {
  var track = this.elemArrangement.querySelector('.track-' + trackID);
  track.parentNode.removeChild(track);
}
/*
  Add note to DOM.
*/
Sequencer.prototype.pushNote = function(trackID, note){
  var elemNotes = this.elemArrangement.querySelector('.tracks .track.track-'
                                                     + trackID + ' .notes');

  var elemNotesSummary = elemNotes.querySelector('.summary');
  if (elemNotesSummary.querySelector('.note-at-' + note.location) == null) {
    var elemNoteSummary = this.createElement('div', ['note',
                                             'note-at-' + note.location,
                                             'note-summary']);
    elemNoteSummary.setAttribute('value', note.value);
    elemNoteSummary.setAttribute('velocity', note.velocity);
    elemNoteSummary.style['left'] = note.location
                                   * this.grid.subdivisionWidth
                                   + 'px';
    elemNoteSummary.style['width'] = this.grid.subdivisionWidth + 'px';
    elemNotesSummary.appendChild(elemNoteSummary);
  }

  var elemNotesFull = elemNotes.querySelector('.full');
  var elemValueRow = elemNotesFull.querySelector('.value-row-' + note.value);
  var elemNote = this.createElement('div', ['note',
                                           'note-at-' + note.location,
                                           'note-full']);
  elemNote.setAttribute('value', note.value);
  elemNote.setAttribute('velocity', note.velocity);
  elemNote.style['left'] = note.location
                                 * this.grid.subdivisionWidth
                                 + 'px';
  elemNote.style['width'] = this.grid.subdivisionWidth + 'px';
  elemValueRow.appendChild(elemNote);
}
/*
  Remote note from DOM.
*/
Sequencer.prototype.popNote = function(trackID, location, value){
  var elemNotes = this.elemArrangement.querySelector('.tracks .track.track-'
                                                     + trackID + ' .notes');

  var elemNotesSummary = elemNotes.querySelector('.summary');
  var elemNoteSummary = elemNotesSummary.querySelector('.note-at-' + location);
  if (elemNoteSummary != null) {
    elemNoteSummary.parentNode.removeChild(elemNoteSummary);
  }

  var elemNotesFull = elemNotes.querySelector('.full');
  var elemNoteFull = elemNotesFull.querySelector('.value-row-' + value
                                                 + ' .note-at-' + location);
  if (elemNoteFull != null) {
    elemNoteFull.parentNode.removeChild(elemNoteFull);
  }
}
/*
  Play if paused and pause if playing.
*/
Sequencer.prototype.playPause = function(){
  if (this.state == this.states.PLAY) {
    this.state = this.states.PAUSE;
  } else if (this.state == this.states.PAUSE) {
    this.state = this.states.PLAY;
  }
}
/*
  Play a sound from the audioElems dictionary.
*/
Sequencer.prototype.playAudio = function(id, value, volume){
  if (this.isAudioLoaded(id, value)) {
    var audioElem = this.audioElems[id][value];
    audioElem.currentTime = 0;
    audioElem.volume(volume);
    audioElem.play();
  } else {
    var self = this;
    this.loadAudio(id, value, true);
  }
}
/*
  Load an audio file into the audioElems dictionary.
*/
Sequencer.prototype.loadAudio = function(id, value, autoplay, onloadCallback, onloaderrorCallback){
  if(typeof onloadCallback == 'undefined') onloadCallback = function(){};
  if(typeof onloaderrorCallback == 'undefined') onloaderrorCallback = function(){};
  var self = this;

  var onload = function(){
    if(!(id in self.audioElems)){
      self.audioElems[id] = {};
    }
    self.audioElems[id][value] = sound;
    onloadCallback();
  }
  var onloaderror = function(){
    onloaderrorCallback();
  }

  var url = 'audio/' + id + '/' + value + '.mp3';
  var sound = new Howl({
    urls: [url],
    autoplay: autoplay,
    onload: onload,
    onloaderror: onloaderror
  });
}
/*
  Check if an audio file exists in the audioElems dictionary.
*/
Sequencer.prototype.isAudioLoaded = function(id, value){
  return ((id in this.audioElems) && (value in this.audioElems[id])
          && typeof this.audioElems[id][value] != "undefined");
}
/*
  This is the main loop.
*/
Sequencer.prototype.logic = function(){
  if(this.state == this.states.PLAY){
    if(this.indexCurrentLocation >= this.song.indexLastLocation){
      this.indexCurrentLocation = 0;
      if(!this.loop){
        this.state = this.states.PAUSE;
      }
    }
    this.updateCursor();
    for (indexTrack in this.song.tracks) {
      var track = this.song.tracks[indexTrack];
      if(this.indexCurrentLocation in track.notes && !track.muted){
        var notes = track.notes[this.indexCurrentLocation];
        for (indexNote in notes) {
          var note = notes[indexNote];
          var instrument = track.instrument;
          this.playAudio(instrument.id, note.value, track.volume / 100);
        }
      }
    }
    this.indexCurrentLocation++;
  }
}
/*
  Move the cursor (i.e. line that indicates which part is playing).
*/
Sequencer.prototype.updateCursor = function(){
  this.elemCursor.style['left'] = this.indexCurrentLocation
                                  * this.grid.subdivisionWidth
                                  + 'px';
}
