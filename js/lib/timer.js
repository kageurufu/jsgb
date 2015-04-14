(function (GameBoy) {
  var Timer = function (gb) {
    this.gb = gb;

    this.r = {}
    this.clock = {}
  };
  Timer.prototype = {
    reset: function () {
      this.r.div = 0;
      this.r.sdiv = 0;
      this.r.tma = 0;
      this.r.tima = 0;
      this.r.tac = 0;
      this.clock.main = 0;
      this.clock.last = 0;
      this.clock.sub = 0;
      this.clock.div = 0;
    },
    step: function () {
      this.clock.sub += this.gb.cpu.cycles - this.clock.last;
      this.clock.last = this.gb.cpu.cycles;

      if (this.clock.sub > 3) {
        this.clock.main++;
        this.clock.sub -= 4;

        this.clock.div++;
        if (this.clock.div == 16) {
          this.clock.div = 0;
          this.r.div++;
          this.r.div &= 0xFF;
        }
      }

      if (this.r.tac & 4) {
        switch (this.r.tac & 3) {
          case 0:
            if (this.clock.main >= 0x40) {
              this.inc();
            }
            break;
          case 1:
            if (this.clock.main >= 0x01) {
              this.inc();
            }
            break;
          case 2:
            if (this.clock.main >= 0x04) {
              this.inc();
            }
            break;
          case 3:
            if (this.clock.main >= 16) {
              this.inc();
            }
            break;
        }
      }
    },
    inc: function () {
      this.r.tima++;
      this.clock.main = 0;
      if (this.r.tima > 255) {
        this.r.tima = this.r.tma;
        this.gb.memory._if |= 0x04;
      }
    },
    read: function (addr) {
      switch (addr) {
        case 0xFF04:
          return this.r.div;
        case 0xFF05:
          return this.r.tima;
        case 0xFF06:
          return this.r.tma;
        case 0xFF07:
          return this.r.tac;
      }
    },
    write: function (addr, val) {
      switch (addr) {
        case 0xFF04:
          return this.r.div = 0;
        case 0xFF05:
          return this.r.tima = val;
        case 0xFF06:
          return this.r.tma = val;
        case 0xFF07:
          return this.r.tac = val & 0x7;
      }
    }
  };
  GameBoy.Timer = Timer;
})(GameBoy);