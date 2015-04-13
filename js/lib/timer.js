(function (GameBoy) {
  var Timer = function (gb) {
    this.gb = gb;
  };
  Timer.prototype = {
    reset: function () {
    },
    step: function () {
    },
    read: function (addr) {
    },
    write: function (addr, val) {
    }
  };
  GameBoy.Timer = Timer;
})(GameBoy);