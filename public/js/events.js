function getEventTarget(e) {
  e = e || window.event;
  return e.target || e.srcElement;
}
