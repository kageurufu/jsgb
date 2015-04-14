(function (GameBoy) {
  var Renderer = function (gb, log_id, disassembler_id) {
    this.gb = gb;

    this.e_log = document.getElementById(log_id);
    this.disassembler = document.getElementById(disassembler_id);
  };

  Renderer.prototype = {
    init: function () {
    },
    showInfo: function () {
      this.log(this._regsToString());
      this.disassembly();
    },
    log: function (s) {
      this.e_log.textContent = s;
    },
    disassembly: function () {
      var d = this.gb.cpu.disassemble(this.gb.cpu.r.pc, 64);
      this.disassembler.innerHTML = '';

      for (var i = 0; i < d.length; i++) {
        var li = document.createElement("li");
        li.dataset.addr = d[i].addr;
        li.textContent = d[i].d;
        li.onclick = this.disassemblerClick.bind(this);
        this.disassembler.appendChild(li);
      }
    },
    disassemblerClick: function (e) {
      var addr = e.target.dataset.addr;

      this.runTo(addr);
    },
    runTo: function (addr) {
      while (this.gb.cpu.r.pc != addr) {
        this.step();
      }
    },
    getRomTitle: function () {
      if (!this.romTitle) {

        //read from 0134 - 0142, convert to ascii, 0x00 to SPACE ( )
        var s = '', i, c;
        for (i = 0x0134; i <= 0x0142; i++) {
          c = this.gb.memory.read(i);
          if (c == 0x00) {
            s += " ";
          } else {
            s += String.fromCharCode(c);
          }
        }
        this.romTitle = s;
      }
      return this.romTitle;
    },
    step: function () {
      try {
        this.gb.cpu.exec();
      } catch (e) {
        var op = gb.cpu.ops[gb.memory.read(gb.cpu.r.pc)];
        console.log("Error at " + toHex(gb.cpu.r.pc, 4) + ", " + op.mnemo + " ($" + toHex(op.index, 2) + ")");
        throw e;
      }
      this.log(this._regsToString());
      this.disassembly();
      this.init();
    },
    _regsToString: function () {
      var s;
      s = this.getRomTitle() + "\n" +
      "A: $" + toHex(this.gb.cpu.r.a, 2) + "  PC: $" + toHex(this.gb.cpu.r.pc, 4) + "  SP: $" + toHex(this.gb.cpu.r.sp, 4) + " ($" + toHex(this.gb.memory.readWord(this.gb.cpu.r.sp), 4) + ")" + "\n" +
      "B: $" + toHex(this.gb.cpu.r.b, 2) + "  C: $" + toHex(this.gb.cpu.r.c, 2) + "  D: $" + toHex(this.gb.cpu.r.d, 2) + "  E: $" + toHex(this.gb.cpu.r.e, 2) + "\n" +
      "H: $" + toHex(this.gb.cpu.r.h, 2) + "  L: $" + toHex(this.gb.cpu.r.l, 2) + "  F: " +
      'z' + (this.gb.cpu.r.z ? '!' : ' ') +
      'n' + (this.gb.cpu.r.n ? '!' : ' ') +
      'h' + (this.gb.cpu.r.h ? '!' : ' ') +
      'c' + (this.gb.cpu.r.c ? '!' : ' ') + "\n" +
      "Input: b" + toBin(this.gb.input._columns[0], 4) + toBin(this.gb.input._columns[1], 4);
      return s;
    }
  };

  function toHex(val, len) {
    var pad = '0',
        s = val.toString(16);
    while (s.length < len) {
      s = pad + s;
    }
    return s;
  }

  function toBin(val, len) {
    var pad = '0',
        s = val.toString(2);
    while (s.length < len) {
      s = pad + s;
    }
    return s;
  }

  function rpad(s, len, chr) {
    if (chr === undefined) chr = ' ';
    while (s.length < len) {
      s = s + chr;
    }
    return s;
  }

  function lpad(s, len, chr) {
    if (chr === undefined) chr = ' ';
    while (s.length < len) {
      s = chr + s;
    }
    return s;
  }

  GameBoy.Renderer = Renderer;
  GameBoy.toHex = toHex;
  GameBoy.toBin = toBin;
  GameBoy.rpad = rpad;
  GameBoy.lpad = lpad;
})(GameBoy);