var sequencer;
window.onload = function() {
	sequencer = new Sequencer({
		elemSequencer: document.getElementById('sequencer'),
    song: new Song({
      nrMeasures: 2
    })
	});
  document.getElementById('button-playpause').addEventListener('click', function(){
		sequencer.playPause();
	});
  document.getElementById('button-oneone').addEventListener('click', function(){
		sequencer.goToLocation(0);
	});
	window.addEventListener('keydown', function(event){
		if(event.keyCode == 32){ // spacebar
			event.stopPropagation();
			event.preventDefault();
			sequencer.playPause();
		}
    // This breaks forms.
    // else if(event.keyCode == 13){ // enter
			// event.stopPropagation();
			// event.preventDefault();
			// sequencer.goToLocation(0);
		// }
	}, true);
};
