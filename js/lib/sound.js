(function (GameBoy) {
  var Sound = function (gb) {
    this.gb = gb;
    this._val = [];
  };
  Sound.prototype = {
    reset: function () {
    },
    step: function () {
    },
    read: function (addr) {
      return this._val[addr] || 0;
    },
    write: function (addr, val) {
      this._val[addr] = val;
    }
  };

  GameBoy.Sound = Sound;
})(GameBoy);