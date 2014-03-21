function Grid(options) {
  var options = options || {};
  
  this.horizontalScale = 1;
  this.verticalScale = 1;
  this.displayedSubdivision = options.displayedSubdivision || 1;
  this.subdivisionWidth = 30;
}
