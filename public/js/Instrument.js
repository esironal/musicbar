function Instrument(options) {
  var options = options || {};
  if (!( ('name' in options) && ('id' in options) )) {
    throw new IllegalArgumentException('An instrument must be passed a name' +
                                       ' and id');
  }

  this.name = options.name;
  this.id = options.id;
  this.volume = options.volume || 80;
  this.monophonic = ('monophonic' in options) ? !!options.monophonic : false;

  if (this.volume < this.minVolume) {
    this.volume = this.minVolume;
  }
  if (this.volume > this.maxVolume) {
    this.volume = this.maxVolume;
  }
}

Instrument.prototype.minVolume = 0;
Instrument.prototype.maxVolume = 100;
