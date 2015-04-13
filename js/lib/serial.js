(function (GameBoy) {
  var Serial = function (gb) {
    this.gb = gb;
  };
  Serial.prototype = {
    reset: function () {
    },
    read: function (addr) {
      console.log("Serial read $" + GameBoy.toHex(addr, 4));
      return 0;
    },
    write: function (addr, val) {
      console.log("Serial write $" + GameBoy.toHex(addr, 4) + " - $" + GameBoy.toHex(val, 2));
    }
  };

  GameBoy.Serial = Serial;
})(GameBoy);