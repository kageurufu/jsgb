(function (GameBoy) {
  var Serial = function (gb) {
    this.gb = gb;

    this.output = document.getElementById("SERIAL");
    this.enabled = !!this.output;
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
      if(this.enabled) {
        this.output.textContent += String.fromCharCode(val);
      }
    }
  };

  GameBoy.Serial = Serial;
})(GameBoy);