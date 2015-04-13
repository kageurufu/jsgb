(function (GameBoy) {
  var Sound = function (gb) {
    this.gb = gb;
  };
  Sound.prototype = {
    reset: function () {
    },
    step: function () {
    },
    read: function (addr) {
    },
    write: function (addr, val) {
    }
  };

  GameBoy.Sound = Sound;
})(GameBoy);