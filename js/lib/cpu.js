(function (GameBoy) {
  var CPU = function (gb) {
    this.gb = gb;

    this.r = new CPU.Registers();
    this.ops = OPS;
    this.cb = CB_OPS;

    this.cycles = 0;
  };

  CPU.prototype = {
    reset: function () {
      this.cycles = 0;
      this.halted = false;
      this.stopped = false;
    },
    step: function () {
      if (!this.halted && !this.stopped) {
        this.cycles += this.exec();
      } else {
        this.cycles += 1;
      }
      this.checkInterrupts();
    },
    exec: function () {
      var opcode = this.gb.memory.read(this.r.pc),
          op = this.ops[opcode],
          cycles = op.cycles;

      cycles += op.exec(this.gb);

      this.r.pc += op.len;
      return cycles;
    },
    checkInterrupts: function () {
      if (this.interruptsEnabled && this.gb.memory._ie && this.gb.memory._if) {
        //Interrupt set, run it
        this.halted = false;
        this.interruptsEnabled = false;
        var whichInterrupt = this.gb.memory._ie & this.gb.memory._if;
        if (whichInterrupt & 0x01) {
          this.gb.memory._if &= 0xfe;
          OP_FUNCS.RST(0x40)(gb);
        } else if (whichInterrupt & 0x02) {
          this.gb.memory._if &= 0xfd;
          OP_FUNCS.RST(0x48)(gb);
        } else if (whichInterrupt & 0x04) {
          this.gb.memory._if &= 0xfb;
          OP_FUNCS.RST(0x50)(gb);
        } else if (whichInterrupt & 0x08) {
          this.gb.memory._if &= 0xf7;
          OP_FUNCS.RST(0x58)(gb);
        } else if (whichInterrupt & 0x10) {
          this.gb.memory._if &= 0xef;
          OP_FUNCS.RST(0x60)(gb);
        } else {
          this.interruptsEnabled = true;
        }
      }
    },
    disassemble: function (addr, count) {
      var out = [];
      while (count) {
        try {
          var op = this.ops[this.gb.memory.read(addr)],
              v = {addr: addr},
              d = "$" + GameBoy.toHex(addr, 4) + "  ";

          if (op.index == 0xCB) {
            d += GameBoy.toHex(addr + 1, 2) + " " + this.cb[this.gb.memory.read(addr + 1)].mnemo;
            addr += 2;

          } else {
            d += GameBoy.toHex(op.index, 2) + " " + GameBoy.rpad(op.mnemo, 14) + " ";
            var h = "  ",
                l = "  ";

            switch (op.len) {
              case 3:
                h = GameBoy.toHex(this.gb.memory.read(addr + 2), 2);
              case 2:
                l = GameBoy.toHex(this.gb.memory.read(addr + 1), 2);
            }
            d += h + " " + l;
            addr += op.len;
          }
          v.d = d;
          out.push(v);
          count--;
        } catch (e) {
          console.log(e);
          break;
        }
      }
      return out;
    }
  };

  var Registers = function () {
    this._pc = 0;
    this._sp = 0;
    this._a = 0;
    this._b = 0;
    this._c = 0;
    this._d = 0;
    this._e = 0;
    this._h = 0;
    this._l = 0;

    this.f = {
      z: 0, // Zero Flag
      n: 0, // Add/Sub
      h: 0, // Half Carry 
      c: 0 // Carry
    };
  };

  Registers.prototype = {
    get a() {
      return this._a
    },
    set a(v) {
      this._a = v;
      if (v === undefined) {
        throw 'Undefined register set'
      }
    },
    get b() {
      return this._b
    },
    set b(v) {
      this._b = v;
      if (v === undefined) {
        throw 'Undefined register set'
      }
    },
    get c() {
      return this._c
    },
    set c(v) {
      this._c = v;
      if (v === undefined) {
        throw 'Undefined register set'
      }
    },
    get d() {
      return this._d
    },
    set d(v) {
      this._d = v;
      if (v === undefined) {
        throw 'Undefined register set'
      }
    },
    get e() {
      return this._e
    },
    set e(v) {
      this._e = v;
      if (v === undefined) {
        throw 'Undefined register set'
      }
    },
    get h() {
      return this._h
    },
    set h(v) {
      this._h = v;
      if (v === undefined) {
        throw 'Undefined register set'
      }
    },
    get l() {
      return this._l
    },
    set l(v) {
      this._l = v;
      if (v === undefined) {
        throw 'Undefined register set'
      }
    },
    get pc() {
      return this._pc;
    },
    set pc(v) {
      if (v < 0 || v > 0xFFFF) {
        throw 'Bad address change';
      }
      this._pc = v;
    },
    get sp() {
      return this._sp;
    },
    set sp(v) {
      if (v < 0 || v > 0xFFFF) {
        throw 'Bad stack pointer change';
      }
      this._sp = v;
    },
    getBC: function () {
      return (this.b << 8) + this.c;
    },
    getDE: function () {
      return (this.d << 8) + this.e;
    },
    getHL: function () {
      return (this.h << 8) + this.l;
    },
    setBC: function (val) {
      this.b = (val >> 8) & 0xFF;
      this.c = val & 0xFF;
    },
    setDE: function (val) {
      this.d = (val >> 8) & 0xFF;
      this.e = val & 0xFF;
    },
    setHL: function (val) {
      this.h = (val >> 8) & 0xFF;
      this.l = val & 0xFF;
    },
    fset: function (z, n, h, c) {
      this.f.z = z ? 1 : 0;
      this.f.n = n ? 1 : 0;
      this.f.h = h ? 1 : 0;
      this.f.c = c ? 1 : 0;
    }
  };

  var OpInfo = function (index, mnemo, op, addr, len, cycles) {
    this.index = index;
    this.mnemo = mnemo;
    this.op = op;
    this.addr = addr;
    this.len = len;
    this.cycles = cycles;
  };

  OpInfo.prototype = {
    exec: function (gb) {
      var cycles = this.cycles;
      cycles += this.op(gb, this.addr) || 0;
      return cycles
    },
    toString: function () {
      return this.mnemo;
    }
  };

  var OP_FUNCS = {
    UNDOCUMENTED: function (gb) {
      console.log(this, gb.cpu.r);
      throw 'Undocumented Opcode';
    },
    UNIMPLEMENTED: function (gb) {
      console.log(this, gb.cpu.r);

      throw this;
    },
    ENABLE_INTERRUPTS: function (gb) {
      gb.cpu.interruptsEnabled = true;
    },
    DISABLE_INTERRUPTS: function (gb) {
      gb.cpu.interruptsEnabled = false;
    },
    HALT: function (gb) {
      gb.cpu.halted = true;
    },
    STOP: function (gb) {
      gb.cpu.stopped = true;
    },
    NOP: function () {
    },
    RST: function (pc) {
      return function (gb) {
        HELPERS.pushStackWord(gb, gb.cpu.r.pc);
        gb.cpu.r.pc = pc;
      };
    },
    CB: function (gb) {
      var cb = gb.cpu.cb[gb.memory.read(gb.cpu.r.pc + 1)];
      cb.exec(gb);
      return cb.cycles;
    },
    /* Stack Operations */
    PUSH: function (r1, r2) {
      return function (gb) {
        HELPERS.pushStack(gb, gb.cpu.r[r1]);
        HELPERS.pushStack(gb, gb.cpu.r[r2]);
      }
    },
    POP: function (r1, r2) {
      return function (gb) {
        gb.cpu.r[r2] = HELPERS.popStack(gb);
        gb.cpu.r[r1] = HELPERS.popStack(gb);
      }
    },
    LDIrrA: function (gb, addr) {
      //Load a into (HL), increment HL
      var address = addr(gb);
      gb.memory.write(address, gb.cpu.r.a);
      gb.cpu.r.setHL((gb.cpu.r.getHL() + 1) & 0xFFFF);
    },
    LDrrxx: function (pair) {
      var setter = "set" + pair;
      return function (gb) {
        gb.cpu.r[setter](gb.memory.readWord(gb.cpu.r.pc + 1));
      }
    },
    LDSPxx: function (gb) {
      gb.cpu.r.sp = gb.memory.readWord(gb.cpu.r.pc + 1);
    },
    LDHLxx: function (gb) {
      gb.cpu.r.setHL(gb.memory.readWord(gb.cpu.r.pc + 1));
    },
    LDHLA: function (gb, addr) {
      gb.memory.write(addr(gb), gb.cpu.r.a);
      gb.cpu.r.setHL(gb.cpu.r.getHL() - 1);
    },
    /* Jumps */
    JPNZcc: function (gb, addr) {
      if (!gb.cpu.r.z) {
        var address = addr(gb);
        gb.cpu.r.pc = gb.memory.readWord(address) - this.len;
        return 4;
      }
    },
    JPZxx: function (gb, addr) {
      if (gb.cpu.r.z) {
        var address = addr(gb);
        gb.cpu.r.pc = gb.memory.readWord(address) - this.len;
        return 4;
      }
    },
    JPNCxx: function (gb, addr) {
      if (!gb.cpu.r.c) {
        var address = addr(gb);
        gb.cpu.r.pc = gb.memory.readWord(address) - this.len;
        return 4;
      }
    },
    JPCxx: function (gb, addr) {
      if (gb.cpu.r.c) {
        var address = addr(gb);
        gb.cpu.r.pc = gb.memory.readWord(address) - this.len;
        return 4;
      }
    },
    JPxx: function (gb, addr) {
      var address = addr(gb);
      gb.cpu.r.pc = gb.memory.readWord(address) - this.len;
    },
    JPd16: function(gb) {
      gb.cpu.r.pc = gb.memory.readWord(gb.cpu.r.pc + 1) - this.len;
    },
    /* Indirect jumps */
    JRx: function (gb, addr) {
      var offset = HELPERS.SIGNED(gb.memory.read(gb.cpu.r.pc + 1));
      gb.cpu.r.pc = gb.cpu.r.pc + offset;
      return 4;
    },
    JRNZx: function (gb) {
      if (!gb.cpu.r.f.z) {
        var offset = HELPERS.SIGNED(gb.memory.read(gb.cpu.r.pc + 1));
        gb.cpu.r.pc = gb.cpu.r.pc + offset;
        return 4;
      }
    },
    JRZx: function (gb, addr) {
      if (gb.cpu.r.f.z) {
        var offset = HELPERS.SIGNED(gb.memory.read(gb.cpu.r.pc + 1));
        gb.cpu.r.pc = gb.cpu.r.pc + offset;
        return 4;
      }
    },
    JRNCx: function (gb, addr) {
      if (!gb.cpu.r.f.c) {
        var offset = HELPERS.SIGNED(gb.memory.read(gb.cpu.r.pc + 1));
        gb.cpu.r.pc = gb.cpu.r.pc + offset;
        return 4;
      }
    },
    JRCx: function (gb, addr) {
      if (gb.cpu.r.f.c) {
        var offset = HELPERS.SIGNED(gb.memory.read(gb.cpu.r.pc + 1));
        gb.cpu.r.pc = gb.cpu.r.pc + offset;
        return 4;
      }
    },
    CALL: function (gb) {
      HELPERS.pushStackWord(gb, gb.cpu.r.pc + 2);
      gb.cpu.r.pc = gb.memory.readWord(gb.cpu.r.pc + 1) - 3;
    },
    CALLZ: function (gb) {
      if (gb.cpu.r.f.z) {
        HELPERS.pushStackWord(gb, gb.cpu.r.pc + 2);
        gb.cpu.r.pc = gb.memory.readWord(gb.cpu.r.pc + 1) - 3;
        return 12;
      }
    },
    CALLNZ: function (gb) {
      if (!gb.cpu.r.f.z) {
        HELPERS.pushStackWord(gb, gb.cpu.r.pc + 2);
        gb.cpu.r.pc = gb.memory.readWord(gb.cpu.r.pc + 1) - 3;
        return 12;
      }
    },
    CALLC: function (gb) {
      if (gb.cpu.r.f.c) {
        HELPERS.pushStackWord(gb, gb.cpu.r.pc + 2);
        gb.cpu.r.pc = gb.memory.readWord(gb.cpu.r.pc + 1) - 3;
        return 12;
      }
    },
    CALLNC: function (gb) {
      if (!gb.cpu.r.f.c) {
        HELPERS.pushStackWord(gb, gb.cpu.r.pc + 2);
        gb.cpu.r.pc = gb.memory.readWord(gb.cpu.r.pc + 1) - 3;
        return 12;
      }
    },
    RET: function (gb) {
      gb.cpu.r.pc = HELPERS.popStackWord(gb);
    },
    RETI: function (gb) {
      gb.cpu.interruptsEnabled = true;
      gb.cpu.r.pc = HELPERS.popStackWord(gb);
    },
    RETZ: function (gb) {
      if (gb.cpu.r.f.z) {
        gb.cpu.r.pc = HELPERS.popStackWord(gb);
        return 12;
      }
    },
    RETC: function (gb) {
      if (gb.cpu.r.f.c) {
        gb.cpu.r.pc = HELPERS.popStackWord(gb);
        return 12;
      }
    },
    RETNZ: function (gb) {
      if (!gb.cpu.r.f.z) {
        gb.cpu.r.pc = HELPERS.popStackWord(gb);
        return 12;
      }
    },
    RETNC: function (gb) {
      if (!gb.cpu.r.f.c) {
        gb.cpu.r.pc = HELPERS.popStackWord(gb);
        return 12;
      }
    },
    /* LD R,R */
    LDrr: function (r1, r2) {
      return function (gb) {
        gb.cpu.r[r1] = gb.cpu.r[r2];
      }
    },
    LDrx: function (r) {
      return function (gb) {
        gb.cpu.r[r] = gb.memory.read(gb.cpu.r.pc + 1);
      }
    },
    LDxxA: function (gb, addr) {
      gb.memory.write(addr(gb), gb.cpu.r.a);
    },
    LDxxSP: function (gb, addr) {
      //Does this write the full word? I'll do that until I find out
      gb.memory.writeWord(addr(gb), gb.cpu.r.sp);
    },
    LDA: function (gb, addr) {
      var val = gb.memory.read(addr(gb));

      gb.cpu.r.a = val;
    },
    LDHLr: function (r) { // Write value from register to (HL)
      return function (gb, addr) {
        gb.memory.write(addr(gb), gb.cpu.r[r]);
      }
    },
    LDrHL: function (r) { // Read value from (HL) to register
      return function (gb, addr) {
        gb.cpu.r[r] = gb.memory.read(addr(gb));
      }
    },
    INCr: function (r) {
      return function (gb) {
        gb.cpu.r[r] = (gb.cpu.r[r] + 1) & 0xFF;
        //SET FLAGS
      }
    },
    DECr: function (r) {
      return function (gb) {
        gb.cpu.r[r] = (gb.cpu.r[r] - 1) & 0xFF;
        //SET FLAGS
        gb.cpu.r.f.z = gb.cpu.r[r] ? 0 : 1;
        gb.cpu.r.f.n = 1;
        gb.cpu.r.f.h = 0;
      }
    },
    DECr_b: function () {
      Z80._r.b--;
      Z80._r.b &= 255;
      Z80._ops.fz(Z80._r.b);
      Z80._r.m = 1;
      Z80._r.t = 4;
    },
    fz: function (i, ass) {
      Z80._r.f = 0;
      if (!(i & 255)) Z80._r.f |= 0x80;
      Z80._r.f |= ass ? 0x40 : 0;
    },
    INCrr: function (rr) {
      var getter = "get" + rr,
          setter = "set" + rr;
      return function (gb) {
        var val = gb.cpu.r[getter]() + 1;
        val = val & 0xFFFF;
        gb.cpu.r[setter](val)
      }
    },
    DECrr: function (rr) {
      var getter = "get" + rr,
          setter = "set" + rr;
      return function (gb) {
        var val = gb.cpu.r[getter]() - 1;
        val = val & 0xFFFF;
        gb.cpu.r[setter](val)
      }
    },
    CP: function (gb, addr) {
      var cmp = gb.memory.read(addr(gb));
      gb.cpu.r.f.z = gb.cpu.r.a == cmp;
      gb.cpu.r.f.h = 0; //TODO: fix
      gb.cpu.r.f.n = 1;
      gb.cpu.r.f.c = gb.cpu.r.a < cmp;
    },
    INC: function (gb, addr) {
      var address = addr(gb),
          val = (gb.memory.read(address) + 1) & 0xFF;
      gb.memory.write(address, val);
      gb.cpu.r.f.z = val ? 0 : 1;
      gb.cpu.r.f.n = 1;
      gb.cpu.r.f.h = 0;
    },
    DEC: function (gb, addr) {
      var address = addr(gb),
          val = (gb.memory.read(address) - 1) & 0xFF;
      gb.memory.write(address, val);
      gb.cpu.r.f.z = val ? 0 : 1;
      gb.cpu.r.f.n = 1;
      gb.cpu.r.f.h = 0;
    },
    INCSP: function (gb) {
      gb.cpu.r.sp = (gb.cpu.r.sp + 1) & 0xFFFF;
      gb.cpu.r.z = gb.cpu.r.sp ? 0 : 1;
      gb.cpu.r.n = 0;
      gb.cpu.r.h = 0; // TODO: FIX
    },
    DECSP: function (gb) {
      gb.cpu.r.sp = (gb.cpu.r.sp - 1) & 0xFFFF;
      gb.cpu.r.z = gb.cpu.r.sp ? 0 : 1;
      gb.cpu.r.n = 1;
      gb.cpu.r.h = 0; // TODO: FIX
    },
    ADDHLrr: function (rr) {
      return function (gb) {
      };
    },
    ADDHLSP: function (gb) {
    },
    ADD: function (gb, addr) {
      gb.cpu.r.a += gb.memory.read(addr(gb));

      gb.cpu.r.n = 0;
      gb.cpu.r.h = 0; // TODO: FIX
      gb.cpu.r.c = gb.cpu.r.a > 0xFF;

      gb.cpu.r.a &= 0xFF;
      gb.cpu.r.z = gb.cpu.r.a ? 0 : 1;
    },
    ADDAr: function (r) {
      return function (gb) {
        gb.cpu.r.a += gb.cpu.r[r];

        gb.cpu.r.n = 0;
        gb.cpu.r.h = 0; // TODO: FIX
        gb.cpu.r.c = gb.cpu.r.a > 0xFF;

        gb.cpu.r.a &= 0xFF;
        gb.cpu.r.z = gb.cpu.r.a ? 0 : 1;
      }
    },
    ADCAr: function (r) {
      return function (gb) {
        throw 'NotImplemented';
      }
    },
    SBCAr: function (r) {
      return function (gb) {
        throw 'NotImplemented';
      }
    },
    SUBr: function (r) {
      return function (gb) {
        var val = gb.cpu.r.a - gb.cpu.r[r];
        gb.cpu.r.a = val & 0xFF;
        gb.cpu.r.fset(!gb.cpu.r.a, 1, 1, val > 0);
      }
    },
    ANDr: function (r) {
      return function (gb) {
        gb.cpu.r.a &= gb.cpu.r[r];
        gb.cpu.r.fset(!gb.cpu.r.a, 0, 1, 0);
        gb.cpu.r.a &= 0xFF;
      }
    },
    ORr: function (r) {
      return function (gb) {
        gb.cpu.r.a |= gb.cpu.r[r];
        gb.cpu.r.fset(!gb.cpu.r.a, 0, 1, 0);
        gb.cpu.r.a &= 0xFF;
      }
    },
    CPr: function (r) {
      return function (gb) {
        throw 'NotImplemented';
      }
    },
    XORr: function (r) {
      return function (gb) {
        gb.cpu.r.a ^= gb.cpu.r[r];
        gb.cpu.r.fset(!gb.cpu.r.a, 0, 0, 0);
      }
    },
    XORxx: function (gb, addr) {
      var address = addr(gb);
      gb.cpu.r.a = gb.cpu.r.a ^ gb.memory.read(address);
      gb.cpu.r.f.z = val ? 0 : 1;
      gb.cpu.r.f.c = 0;
      gb.cpu.r.f.h = 0;
      gb.cpu.r.f.n = 0;
    },
    /* CB Specials */
    RLC: function (reg) {
      return function (gb) {
        gb.cpu.r[reg] = HELPERS.RLC(gb, gb.cpu.r[reg]);
      }
    },
    RRC: function (reg) {
      return function (gb) {
        gb.cpu.r[reg] = HELPERS.RRC(gb, gb.cpu.r[reg]);
      }
    },
    RL: function (reg) {
      return function (gb) {
        gb.cpu.r[reg] = HELPERS.RL(gb, gb.cpu.r[reg]);
      }
    },
    RR: function (reg) {
      return function (gb) {
        gb.cpu.r[reg] = HELPERS.RR(gb, gb.cpu.r[reg]);
      }
    },
    SLA: function (reg) {
      return function (gb) {
        gb.cpu.r[reg] = HELPERS.SLA(gb, gb.cpu.r[reg]);
      }
    },
    SRA: function (reg) {
      return function (gb) {
        gb.cpu.r[reg] = HELPERS.SRA(gb, gb.cpu.r[reg]);
      }
    },
    SWAP: function (reg) {
      return function (gb) {
        gb.cpu.r[reg] = HELPERS.SWAP(gb, gb.cpu.r[reg]);
      }
    },
    SRL: function (reg) {
      return function (gb) {
        gb.cpu.r[reg] = HELPERS.SRL(gb, gb.cpu.r[reg]);
      }
    },
    RRC_HL: function (gb) {
      var address = gb.cpu.r.getHL();
      gb.memory.write(address, HELPERS.RLC(gb, gb.memory.read(address)));
    },
    RLC_HL: function (gb) {
      var address = gb.cpu.r.getHL();
      gb.memory.write(address, HELPERS.RLC(gb, gb.memory.read(address)));
    },
    RL_HL: function (gb) {
      var address = gb.cpu.r.getHL();
      gb.memory.write(address, HELPERS.RL(gb, gb.memory.read(address)));
    },
    RR_HL: function (gb) {
      var address = gb.cpu.r.getHL();
      gb.memory.write(address, HELPERS.RR(gb, gb.memory.read(address)));
    },
    SLA_HL: function (gb) {
      var address = gb.cpu.r.getHL();
      gb.memory.write(address, HELPERS.SLA(gb, gb.memory.read(address)));
    },
    SRA_HL: function (gb) {
      var address = gb.cpu.r.getHL();
      gb.memory.write(address, HELPERS.SRA(gb, gb.memory.read(address)));
    },
    SWAP_HL: function (gb) {
      var address = gb.cpu.r.getHL();
      gb.memory.write(address, HELPERS.SWAP(gb, gb.memory.read(address)));
    },
    SRL_HL: function (gb) {
      var address = gb.cpu.r.getHL();
      gb.memory.write(address, HELPERS.SRL(gb, gb.memory.read(address)));
    },
    BIT: function (bit, reg) {
      var mask = 1 << bit;

      return function (gb) {
        gb.cpu.r.f.z = (gb.cpu.r[reg] & mask) >> bit;
        gb.cpu.r.f.n = 0;
        gb.cpu.r.f.h = 1;
      }
    },
    SET: function (bit, reg) {
      var mask = 1 << bit;
      return function (gb) {
        gb.cpu.r[reg] |= mask;
      }
    },
    RES: function (bit, reg) {
      var mask = 0xFF ^ (1 << bit);
      return function (gb) {
        gb.cpu.r[reg] &= mask;
      }
    },
    BIT_HL: function (bit) {
      var mask = 1 << bit;
      return function (gb, addr) {
        gb.cpu.r.f.z = (gb.memory.read(addr()) & mask) >> bit;
        gb.cpu.r.f.n = 0;
        gb.cpu.r.f.h = 1;
      }
    },
    SET_HL: function (bit) {
      var mask = 1 << bit;
      return function (gb, addr) {
        var address = addr(gb);
        gb.memory.write(address, gb.memory.read(address) | mask)
      }
    },
    RES_HL: function (bit) {
      var mask = 1 << bit;
      return function (gb, addr) {
        var address = addr(gb);
        gb.memory.write(address, gb.memory.read(address) & mask)
      }
    }
  };

  var ADDR_MODE = {
    INDIRECT_BC: function (gb) {
      return gb.cpu.r.getBC();
    },
    INDIRECT_DE: function (gb) {
      return gb.cpu.r.getDE();
    },
    INDIRECT_HL: function (gb) {
      return gb.cpu.r.getHL();
    },
    INDIRECT_C: function (gb) {
      return gb.cpu.r.c + 0xFF00;
    },
    DIRECT_N: function (gb) {
      return gb.cpu.r.pc + 1;
    },
    INDIRECT_N: function (gb) {
      return 0xFF00 + gb.memory.read(gb.cpu.r.pc + 1);
    },
    INDIRECT_NN: function (gb) {
      return gb.memory.readWord(gb.cpu.r.pc + 1);
    }
  };

  var HELPERS = {
    pushStackWord: function (gb, val) {
      gb.cpu.r.sp = (gb.cpu.r.sp - 1) & 0xFFFF;
      gb.memory.write(gb.cpu.r.sp, val >> 8);
      gb.cpu.r.sp = (gb.cpu.r.sp - 1) & 0xFFFF;
      gb.memory.write(gb.cpu.r.sp, val & 0xFF);
    },
    pushStack: function (gb, val) {
      gb.cpu.r.sp = (gb.cpu.r.sp - 1) & 0xFFFF;
      gb.memory.write(gb.cpu.r.sp, val & 0xFF);
    },
    popStack: function (gb) {
      var val = gb.memory.read(gb.cpu.r.sp);
      gb.cpu.r.sp = (gb.cpu.r.sp + 1) & 0xFFFF;
      return val;
    },
    popStackWord: function (gb) {
      var val = gb.memory.read(gb.cpu.r.sp);
      gb.cpu.r.sp = (gb.cpu.r.sp + 1) & 0xFFFF;
      val += (gb.memory.read(gb.cpu.r.sp) << 8) & 0xFF00;
      gb.cpu.r.sp = (gb.cpu.r.sp + 1) & 0xFFFF;
      return val;
    },
    SIGNED: function (val) {
      if (val > 127) {
        val = -((~val + 1) & 0xFF);
      }
      return val;
    },
    RLC: function (gb, val) {
      var carry = val & 0x80 ? 1 : 0;
      val = val << 1 | carry;
      gb.cpu.r.f.z = val ? 0 : 1;
      gb.cpu.r.f.h = 0;
      gb.cpu.r.f.n = 0;
      gb.cpu.r.f.c = carry;
      return val;
    },
    RL: function (gb, val) {
      var carry = val & 0x80 ? 1 : 0;
      val = (val << 1 | gb.cpu.r.f.c) & 0xFF;
      gb.cpu.r.f.z = val ? 0 : 1;
      gb.cpu.r.f.h = 0;
      gb.cpu.r.f.n = 0;
      gb.cpu.r.f.c = carry;
      return val;
    },
    SLA: function (gb, val) {
      gb.cpu.r.f.c = val & 0x80 ? 1 : 0;
      val = (val << 1) & 0xFF;
      gb.cpu.r.f.z = val ? 0 : 1;
      gb.cpu.r.f.h = 0;
      gb.cpu.r.f.n = 0;
      return val;
    },
    RRC: function (gb, val) {
      var bit0 = val & 0x01;
      val = (val >> 1 | (gb.cpu.r.f.c << 7)) & 0xFF;
      gb.cpu.r.f.z = val ? 0 : 1;
      gb.cpu.r.f.h = 0;
      gb.cpu.r.f.n = 0;
      gb.cpu.r.f.c = bit0;
      return val;
    },
    RR: function (gb, val) {
      var bit0 = val & 0x01;
      val = (val >> 1 | (bit0 << 7)) & 0xFF;
      gb.cpu.r.f.z = val ? 0 : 1;
      gb.cpu.r.f.h = 0;
      gb.cpu.r.f.n = 0;
      gb.cpu.r.f.c = bit0;
      return val;
    },
    SRA: function (gb, val) {
      gb.cpu.r.f.c = val & 0x01;
      val = ((val >> 1) | (val & 0x80)) & 0xFF;
      gb.cpu.r.f.z = val ? 0 : 1;
      gb.cpu.r.f.h = 0;
      gb.cpu.r.f.n = 0;
      return val;
    },
    SRL: function (gb, val) {
      // Shift n right into carry, MSB set to 0;
      gb.cpu.r.f.c = val & 0x01;
      gb.cpu.r.f.h = 0;
      gb.cpu.r.f.n = 0;
      val = (val >> 1 & 0xFF) & 0xFF;
      gb.cpu.r.f.z = val ? 0 : 1;
      return val;
    },
    SWAP: function (gb, val) {
      // SWAP AAAABBBB -> BBBBAAAA, Znhc
      var h = (val & 0xF0) >> 4;
      var l = (val & 0x0F);

      val = ((l << 4) + h) & 0xFF;
      gb.cpu.r.f.z = val ? 0 : 1;
      gb.cpu.r.f.h = 0;
      gb.cpu.r.f.n = 0;
      gb.cpu.r.f.c = 0;
      return val;
    }
  };

  var OPS = {
    0x09: new OpInfo(0x09, "ADD HL,BC", OP_FUNCS.ADDHLrr('BC'), null, 1, 8),
    0x19: new OpInfo(0x19, "ADD HL,DE", OP_FUNCS.ADDHLrr('DE'), null, 1, 8),
    0x29: new OpInfo(0x29, "ADD HL,HL", OP_FUNCS.ADDHLrr('HL'), null, 1, 8),
    0x39: new OpInfo(0x39, "ADD HL,SP", OP_FUNCS.ADDHLSP, null, 1, 8),
    0x86: new OpInfo(0x86, "ADD A,(HL)", OP_FUNCS.ADD, ADDR_MODE.INDIRECT_HL, 1, 8),
    0xC6: new OpInfo(0xC6, "ADD A,d8", OP_FUNCS.ADD, ADDR_MODE.DIRECT_N, 2, 8),

    0xC2: new OpInfo(0xC2, "JP NZ,a16", OP_FUNCS.JPNZcc, null, 3, 12 /* or 16 */),
    0xCA: new OpInfo(0xCA, "JP Z,a16", OP_FUNCS.JPZxx, null, 3, 12 /* or 16 */),
    0xD2: new OpInfo(0xD2, "JP NC,a16", OP_FUNCS.JPNCxx, null, 3, 12 /* or 16 */),
    0xDA: new OpInfo(0xDA, "JP C,a16", OP_FUNCS.JPCxx, null, 3, 16 / 12),
    0xC3: new OpInfo(0xC3, "JP a16", OP_FUNCS.JPd16, ADDR_MODE.DIRECT_NN, 3, 16),
    0xE9: new OpInfo(0xE9, "JP (HL)", OP_FUNCS.JPxx, ADDR_MODE.INDIRECT_HL, 1, 4),

    0x18: new OpInfo(0x18, "JR r8", OP_FUNCS.JRx, null, 2, 8),
    0x20: new OpInfo(0x20, "JR NZ,r8", OP_FUNCS.JRNZx, null, 2, 8 /* 12 for page break */),
    0x28: new OpInfo(0x28, "JR Z,r8", OP_FUNCS.JRZx, null, 2, 8 /* 12 for page break */),
    0x30: new OpInfo(0x30, "JR NC,r8", OP_FUNCS.JRNCx, null, 2, 8 /* 12 for page break */),
    0x38: new OpInfo(0x38, "JR C,r8", OP_FUNCS.JRCx, null, 2, 12),

    0xAE: new OpInfo(0xAE, "XOR (HL)", OP_FUNCS.XORxx, ADDR_MODE.INDIRECT_HL, 1, 8),
    0xEE: new OpInfo(0xEE, "XOR d8", OP_FUNCS.XORxx, ADDR_MODE.DIRECT_N, 2, 8),

    0xC7: new OpInfo(0xC7, "RST 00H", OP_FUNCS.RST(0x00), null, 1, 16),
    0xCF: new OpInfo(0xCF, "RST 08H", OP_FUNCS.RST(0x08), null, 1, 16),
    0xD7: new OpInfo(0xD7, "RST 10H", OP_FUNCS.RST(0x10), null, 1, 16),
    0xDF: new OpInfo(0xDF, "RST 18H", OP_FUNCS.RST(0x18), null, 1, 16),
    0xE7: new OpInfo(0xE7, "RST 20H", OP_FUNCS.RST(0x20), null, 1, 16),
    0xEF: new OpInfo(0xEF, "RST 28H", OP_FUNCS.RST(0x28), null, 1, 16),
    0xF7: new OpInfo(0xF7, "RST 30H", OP_FUNCS.RST(0x30), null, 1, 16),
    0xFF: new OpInfo(0xFF, "RST 38H", OP_FUNCS.RST(0x38), null, 1, 16),

    0xBE: new OpInfo(0xBE, "CP (HL)", OP_FUNCS.CP, ADDR_MODE.INDIRECT_HL, 1, 8),
    0xFE: new OpInfo(0xFE, "CP d8", OP_FUNCS.CP, ADDR_MODE.DIRECT_N, 2, 8),

    // Untested
    0xF2: new OpInfo(0xF2, "LD A,(C)", OP_FUNCS.LDA, ADDR_MODE.INDIRECT_C, 2, 8),

    0xEA: new OpInfo(0xEA, "LD (a16),A", OP_FUNCS.LDxxA, ADDR_MODE.INDIRECT_NN, 3, 16),
    0x08: new OpInfo(0x08, "LD (a16),SP", OP_FUNCS.LDxxSP, ADDR_MODE.INDIRECT_NN, 3, 20),

    0xF0: new OpInfo(0xF0, "LDH A,(a8)", OP_FUNCS.LDA, ADDR_MODE.INDIRECT_N, 2, 12),

    0x02: new OpInfo(0x02, "LD (BC),A", OP_FUNCS.LDxxA, ADDR_MODE.INDIRECT_BC, 1, 8),
    0x12: new OpInfo(0x12, "LD (DE),A", OP_FUNCS.LDxxA, ADDR_MODE.INDIRECT_DE, 1, 8),
    0x36: new OpInfo(0x36, "LD (HL),d8", OP_FUNCS.LDxxA, ADDR_MODE.INDIRECT_HL, 2, 12),

    // Unimplemented (I'm just trying to get through the BIOS right now >_> )

    0xFA: new OpInfo(0xFA, "LD A,(a16)", OP_FUNCS.UNIMPLEMENTED, null, 3, 16),
    0x2A: new OpInfo(0x2A, "LD A,(HL+)", OP_FUNCS.UNIMPLEMENTED, null, 1, 8),
    0x3A: new OpInfo(0x3A, "LD A,(HL-)", OP_FUNCS.UNIMPLEMENTED, null, 1, 8),


    0xF8: new OpInfo(0xF8, "LD HL,SP+r8", OP_FUNCS.UNIMPLEMENTED, null, 2, 12),
    0xF9: new OpInfo(0xF9, "LD SP,HL", OP_FUNCS.UNIMPLEMENTED, null, 1, 8),

    0x27: new OpInfo(0x27, "DAA", OP_FUNCS.UNIMPLEMENTED, null, 1, 4),
    0x2F: new OpInfo(0x2F, "CPL", OP_FUNCS.UNIMPLEMENTED, null, 1, 4),
    0x37: new OpInfo(0x37, "SCF", OP_FUNCS.UNIMPLEMENTED, null, 1, 4),
    0x3F: new OpInfo(0x3F, "CCF", OP_FUNCS.UNIMPLEMENTED, null, 1, 4),

    0x96: new OpInfo(0x96, "SUB (HL)", OP_FUNCS.UNIMPLEMENTED, null, 1, 8),
    0xA6: new OpInfo(0xA6, "AND (HL)", OP_FUNCS.UNIMPLEMENTED, null, 1, 8),
    0xB6: new OpInfo(0xB6, "OR (HL)", OP_FUNCS.UNIMPLEMENTED, null, 1, 8),
    0xF6: new OpInfo(0xF6, "OR d8", OP_FUNCS.UNIMPLEMENTED, null, 2, 8),
    0xE6: new OpInfo(0xE6, "AND d8", OP_FUNCS.UNIMPLEMENTED, null, 2, 8),

    0xE8: new OpInfo(0xE8, "ADD SP,r8", OP_FUNCS.UNIMPLEMENTED, null, 2, 16),

    0x9E: new OpInfo(0x9E, "SBC A,(HL)", OP_FUNCS.UNIMPLEMENTED, null, 1, 8),
    0xDE: new OpInfo(0xDE, "SBC A,d8", OP_FUNCS.UNIMPLEMENTED, null, 2, 8),

    0xD6: new OpInfo(0xD6, "SUB d8", OP_FUNCS.UNIMPLEMENTED, null, 2, 8),

    0xCE: new OpInfo(0xCE, "ADC A,d8", OP_FUNCS.UNIMPLEMENTED, null, 2, 8),
    0x8E: new OpInfo(0x8E, "ADC A,(HL)", OP_FUNCS.UNIMPLEMENTED, null, 1, 8),

    // Working
    0x34: new OpInfo(0x34, "INC (HL)", OP_FUNCS.INC, ADDR_MODE.INDIRECT_HL, 1, 12),
    0x35: new OpInfo(0x35, "DEC (HL)", OP_FUNCS.DEC, ADDR_MODE.INDIRECT_HL, 1, 12),


    0x00: new OpInfo(0x00, "NOP", OP_FUNCS.NOP, null, 1, 4),
    0x01: new OpInfo(0x01, "LD BC,d16", OP_FUNCS.LDrrxx("BC"), null, 3, 12),
    0x03: new OpInfo(0x03, "INC BC", OP_FUNCS.INCrr("BC"), null, 1, 8),
    0x04: new OpInfo(0x04, "INC B", OP_FUNCS.INCr("b"), null, 1, 4),
    0x05: new OpInfo(0x05, "DEC B", OP_FUNCS.DECr("b"), null, 1, 4),
    0x06: new OpInfo(0x06, "LD B,d8", OP_FUNCS.LDrx("b"), null, 2, 8),
    0x07: new OpInfo(0x07, "RLCA", OP_FUNCS.RLC('a'), null, 1, 4),
    0x0A: new OpInfo(0x0A, "LD A,(BC)", OP_FUNCS.LDA, ADDR_MODE.INDIRECT_BC, 1, 8),
    0x0B: new OpInfo(0x0B, "DEC BC", OP_FUNCS.DECrr("BC"), null, 1, 8),
    0x0C: new OpInfo(0x0C, "INC C", OP_FUNCS.INCr("c"), null, 1, 4),
    0x0D: new OpInfo(0x0D, "DEC C", OP_FUNCS.DECr("c"), null, 1, 4),
    0x0E: new OpInfo(0x0E, "LD C,d8", OP_FUNCS.LDrx("c"), null, 2, 8),
    0x0F: new OpInfo(0x0F, "RRCA", OP_FUNCS.RRC('a'), null, 1, 4),
    0x10: new OpInfo(0x10, "STOP 0", OP_FUNCS.STOP, null, 2, 4),
    0x11: new OpInfo(0x11, "LD DE,d16", OP_FUNCS.LDrrxx("DE"), null, 3, 12),
    0x13: new OpInfo(0x13, "INC DE", OP_FUNCS.INCrr("DE"), null, 1, 8),
    0x14: new OpInfo(0x14, "INC D", OP_FUNCS.INCr("d"), null, 1, 4),
    0x15: new OpInfo(0x15, "DEC D", OP_FUNCS.DECr("d"), null, 1, 4),
    0x16: new OpInfo(0x16, "LD D,d8", OP_FUNCS.LDrx("d"), null, 2, 8),
    0x17: new OpInfo(0x17, "RLA", OP_FUNCS.RL('a'), null, 1, 12),
    0x1A: new OpInfo(0x1A, "LD A,(DE)", OP_FUNCS.LDA, ADDR_MODE.INDIRECT_DE, 1, 8),
    0x1B: new OpInfo(0x1B, "DEC DE", OP_FUNCS.DECrr("DE"), null, 1, 8),
    0x1C: new OpInfo(0x1C, "INC E", OP_FUNCS.INCr("e"), null, 1, 4),
    0x1D: new OpInfo(0x1D, "DEC E", OP_FUNCS.DECr("e"), null, 1, 4),
    0x1E: new OpInfo(0x1E, "LD E,d8", OP_FUNCS.LDrx("e"), null, 2, 8),
    0x1F: new OpInfo(0x1F, "RRA", OP_FUNCS.RR('a'), null, 1, 4),
    0x21: new OpInfo(0x21, "LD HL,d16", OP_FUNCS.LDHLxx, null, 3, 12),
    0x22: new OpInfo(0x22, "LD (HL+),A", OP_FUNCS.LDIrrA, ADDR_MODE.INDIRECT_HL, 1, 8),
    0x23: new OpInfo(0x23, "INC HL", OP_FUNCS.INCrr("HL"), null, 1, 8),
    0x24: new OpInfo(0x24, "INC H", OP_FUNCS.INCr("h"), null, 1, 4),
    0x25: new OpInfo(0x25, "DEC H", OP_FUNCS.DECr("h"), null, 1, 4),
    0x26: new OpInfo(0x26, "LD H,d8", OP_FUNCS.LDrx("h"), null, 2, 8),
    0x2B: new OpInfo(0x2B, "DEC HL", OP_FUNCS.DECrr("HL"), null, 1, 8),
    0x2C: new OpInfo(0x2C, "INC L", OP_FUNCS.INCr("l"), null, 1, 4),
    0x2D: new OpInfo(0x2D, "DEC L", OP_FUNCS.DECr("l"), null, 1, 4),
    0x2E: new OpInfo(0x2E, "LD L,d8", OP_FUNCS.LDrx("l"), null, 2, 8),
    0x31: new OpInfo(0x31, "LD SP,d16", OP_FUNCS.LDSPxx, null, 3, 12),
    0x32: new OpInfo(0x32, "LD (HL-),A", OP_FUNCS.LDHLA, ADDR_MODE.INDIRECT_HL, 1, 8),
    0x33: new OpInfo(0x33, "INC SP", OP_FUNCS.INCSP, null, 1, 8),
    0x3B: new OpInfo(0x3B, "DEC SP", OP_FUNCS.DECSP, null, 1, 8),
    0x3C: new OpInfo(0x3C, "INC A", OP_FUNCS.INCr("a"), null, 1, 4),
    0x3D: new OpInfo(0x3D, "DEC A", OP_FUNCS.DECr("a"), null, 1, 4),
    0x3E: new OpInfo(0x3E, "LD A,d8", OP_FUNCS.LDrx("a"), null, 2, 8),
    0x40: new OpInfo(0x40, "LD B,B", OP_FUNCS.LDrr('b', 'b'), null, 1, 4),
    0x41: new OpInfo(0x41, "LD B,C", OP_FUNCS.LDrr('b', 'c'), null, 1, 4),
    0x42: new OpInfo(0x42, "LD B,D", OP_FUNCS.LDrr('b', 'd'), null, 1, 4),
    0x43: new OpInfo(0x43, "LD B,E", OP_FUNCS.LDrr('b', 'e'), null, 1, 4),
    0x44: new OpInfo(0x44, "LD B,H", OP_FUNCS.LDrr('b', 'h'), null, 1, 4),
    0x45: new OpInfo(0x45, "LD B,L", OP_FUNCS.LDrr('b', 'l'), null, 1, 4),
    0x46: new OpInfo(0x46, "LD B,(HL)", OP_FUNCS.LDrHL('b'), ADDR_MODE.INDIRECT_HL, 1, 4),
    0x47: new OpInfo(0x47, "LD B,A", OP_FUNCS.LDrr('b', 'a'), null, 1, 4),
    0x48: new OpInfo(0x48, "LD C,B", OP_FUNCS.LDrr('c', 'b'), null, 1, 4),
    0x49: new OpInfo(0x49, "LD C,C", OP_FUNCS.LDrr('c', 'c'), null, 1, 4),
    0x4A: new OpInfo(0x4A, "LD C,D", OP_FUNCS.LDrr('c', 'd'), null, 1, 4),
    0x4B: new OpInfo(0x4B, "LD C,E", OP_FUNCS.LDrr('c', 'e'), null, 1, 4),
    0x4C: new OpInfo(0x4C, "LD C,H", OP_FUNCS.LDrr('c', 'h'), null, 1, 4),
    0x4D: new OpInfo(0x4D, "LD C,L", OP_FUNCS.LDrr('c', 'l'), null, 1, 4),
    0x4E: new OpInfo(0x4E, "LD C,(HL)", OP_FUNCS.LDrHL('c'), ADDR_MODE.INDIRECT_HL, 1, 4),
    0x4F: new OpInfo(0x4F, "LD C,A", OP_FUNCS.LDrr('c', 'a'), null, 1, 4),
    0x50: new OpInfo(0x50, "LD D,B", OP_FUNCS.LDrr('d', 'b'), null, 1, 4),
    0x51: new OpInfo(0x51, "LD D,C", OP_FUNCS.LDrr('d', 'c'), null, 1, 4),
    0x52: new OpInfo(0x52, "LD D,D", OP_FUNCS.LDrr('d', 'd'), null, 1, 4),
    0x53: new OpInfo(0x53, "LD D,E", OP_FUNCS.LDrr('d', 'e'), null, 1, 4),
    0x54: new OpInfo(0x54, "LD D,H", OP_FUNCS.LDrr('d', 'h'), null, 1, 4),
    0x55: new OpInfo(0x55, "LD D,L", OP_FUNCS.LDrr('d', 'l'), null, 1, 4),
    0x56: new OpInfo(0x56, "LD D,(HL)", OP_FUNCS.LDrHL('d'), ADDR_MODE.INDIRECT_HL, 1, 4),
    0x57: new OpInfo(0x57, "LD D,A", OP_FUNCS.LDrr('d', 'a'), null, 1, 4),
    0x58: new OpInfo(0x58, "LD E,B", OP_FUNCS.LDrr('e', 'b'), null, 1, 4),
    0x59: new OpInfo(0x59, "LD E,C", OP_FUNCS.LDrr('e', 'c'), null, 1, 4),
    0x5A: new OpInfo(0x5A, "LD E,D", OP_FUNCS.LDrr('e', 'd'), null, 1, 4),
    0x5B: new OpInfo(0x5B, "LD E,E", OP_FUNCS.LDrr('e', 'e'), null, 1, 4),
    0x5C: new OpInfo(0x5C, "LD E,H", OP_FUNCS.LDrr('e', 'h'), null, 1, 4),
    0x5D: new OpInfo(0x5D, "LD E,L", OP_FUNCS.LDrr('e', 'l'), null, 1, 4),
    0x5E: new OpInfo(0x5E, "LD E,(HL)", OP_FUNCS.LDrHL('e'), ADDR_MODE.INDIRECT_HL, 1, 4),
    0x5F: new OpInfo(0x5F, "LD E,A", OP_FUNCS.LDrr('e', 'a'), null, 1, 4),
    0x60: new OpInfo(0x60, "LD H,B", OP_FUNCS.LDrr('h', 'b'), null, 1, 4),
    0x61: new OpInfo(0x61, "LD H,C", OP_FUNCS.LDrr('h', 'c'), null, 1, 4),
    0x62: new OpInfo(0x62, "LD H,D", OP_FUNCS.LDrr('h', 'd'), null, 1, 4),
    0x63: new OpInfo(0x63, "LD H,E", OP_FUNCS.LDrr('h', 'e'), null, 1, 4),
    0x64: new OpInfo(0x64, "LD H,H", OP_FUNCS.LDrr('h', 'h'), null, 1, 4),
    0x65: new OpInfo(0x65, "LD H,L", OP_FUNCS.LDrr('h', 'l'), null, 1, 4),
    0x66: new OpInfo(0x66, "LD H,(HL)", OP_FUNCS.LDrHL('h'), ADDR_MODE.INDIRECT_HL, 1, 4),
    0x67: new OpInfo(0x67, "LD H,A", OP_FUNCS.LDrr('h', 'a'), null, 1, 4),
    0x68: new OpInfo(0x68, "LD L,B", OP_FUNCS.LDrr('l', 'b'), null, 1, 4),
    0x69: new OpInfo(0x69, "LD L,C", OP_FUNCS.LDrr('l', 'c'), null, 1, 4),
    0x6A: new OpInfo(0x6A, "LD L,D", OP_FUNCS.LDrr('l', 'd'), null, 1, 4),
    0x6B: new OpInfo(0x6B, "LD L,E", OP_FUNCS.LDrr('l', 'e'), null, 1, 4),
    0x6C: new OpInfo(0x6C, "LD L,H", OP_FUNCS.LDrr('l', 'h'), null, 1, 4),
    0x6D: new OpInfo(0x6D, "LD L,L", OP_FUNCS.LDrr('l', 'l'), null, 1, 4),
    0x6E: new OpInfo(0x6E, "LD L,(HL)", OP_FUNCS.LDrHL('l'), ADDR_MODE.INDIRECT_HL, 1, 4),
    0x6F: new OpInfo(0x6F, "LD L,A", OP_FUNCS.LDrr('l', 'a'), null, 1, 4),
    0x70: new OpInfo(0x70, "LD (HL),B", OP_FUNCS.LDHLr('b'), ADDR_MODE.INDIRECT_HL, 1, 4),
    0x71: new OpInfo(0x71, "LD (HL),C", OP_FUNCS.LDHLr('c'), ADDR_MODE.INDIRECT_HL, 1, 4),
    0x72: new OpInfo(0x72, "LD (HL),D", OP_FUNCS.LDHLr('d'), ADDR_MODE.INDIRECT_HL, 1, 4),
    0x73: new OpInfo(0x73, "LD (HL),E", OP_FUNCS.LDHLr('e'), ADDR_MODE.INDIRECT_HL, 1, 4),
    0x74: new OpInfo(0x74, "LD (HL),H", OP_FUNCS.LDHLr('h'), ADDR_MODE.INDIRECT_HL, 1, 4),
    0x75: new OpInfo(0x75, "LD (HL),L", OP_FUNCS.LDHLr('l'), ADDR_MODE.INDIRECT_HL, 1, 4),
    0x76: new OpInfo(0x76, "HALT", OP_FUNCS.HALT, null, 1, 4),
    0x77: new OpInfo(0x77, "LD (HL),A", OP_FUNCS.LDHLr('a'), ADDR_MODE.INDIRECT_HL, 1, 4),
    0x78: new OpInfo(0x78, "LD A,B", OP_FUNCS.LDrr('a', 'b'), null, 1, 4),
    0x79: new OpInfo(0x79, "LD A,C", OP_FUNCS.LDrr('a', 'c'), null, 1, 4),
    0x7A: new OpInfo(0x7A, "LD A,D", OP_FUNCS.LDrr('a', 'd'), null, 1, 4),
    0x7B: new OpInfo(0x7B, "LD A,E", OP_FUNCS.LDrr('a', 'e'), null, 1, 4),
    0x7C: new OpInfo(0x7C, "LD A,H", OP_FUNCS.LDrr('a', 'h'), null, 1, 4),
    0x7D: new OpInfo(0x7D, "LD A,L", OP_FUNCS.LDrr('a', 'l'), null, 1, 4),
    0x7E: new OpInfo(0x7E, "LD A,(HL)", OP_FUNCS.LDA, ADDR_MODE.INDIRECT_HL, 1, 4),
    0x7F: new OpInfo(0x7F, "LD A,A", OP_FUNCS.LDrr('a', 'a'), null, 1, 4),
    0x80: new OpInfo(0x80, "ADD A,B", OP_FUNCS.ADDAr('b'), null, 1, 4),
    0x81: new OpInfo(0x81, "ADD A,C", OP_FUNCS.ADDAr('c'), null, 1, 4),
    0x82: new OpInfo(0x82, "ADD A,D", OP_FUNCS.ADDAr('d'), null, 1, 4),
    0x83: new OpInfo(0x83, "ADD A,E", OP_FUNCS.ADDAr('e'), null, 1, 4),
    0x84: new OpInfo(0x84, "ADD A,H", OP_FUNCS.ADDAr('h'), null, 1, 4),
    0x85: new OpInfo(0x85, "ADD A,L", OP_FUNCS.ADDAr('l'), null, 1, 4),
    0x87: new OpInfo(0x87, "ADD A,A", OP_FUNCS.ADDAr('a'), null, 1, 4),
    0x88: new OpInfo(0x88, "ADC A,B", OP_FUNCS.ADCAr('b'), null, 1, 4),
    0x89: new OpInfo(0x89, "ADC A,C", OP_FUNCS.ADCAr('c'), null, 1, 4),
    0x8A: new OpInfo(0x8A, "ADC A,D", OP_FUNCS.ADCAr('d'), null, 1, 4),
    0x8B: new OpInfo(0x8B, "ADC A,E", OP_FUNCS.ADCAr('e'), null, 1, 4),
    0x8C: new OpInfo(0x8C, "ADC A,H", OP_FUNCS.ADCAr('h'), null, 1, 4),
    0x8D: new OpInfo(0x8D, "ADC A,L", OP_FUNCS.ADCAr('l'), null, 1, 4),
    0x8F: new OpInfo(0x8F, "ADC A,A", OP_FUNCS.ADCAr('a'), null, 1, 4),
    0x90: new OpInfo(0x90, "SUB B", OP_FUNCS.SUBr('b'), null, 1, 4),
    0x91: new OpInfo(0x91, "SUB C", OP_FUNCS.SUBr('c'), null, 1, 4),
    0x92: new OpInfo(0x92, "SUB D", OP_FUNCS.SUBr('d'), null, 1, 4),
    0x93: new OpInfo(0x93, "SUB E", OP_FUNCS.SUBr('e'), null, 1, 4),
    0x94: new OpInfo(0x94, "SUB H", OP_FUNCS.SUBr('h'), null, 1, 4),
    0x95: new OpInfo(0x95, "SUB L", OP_FUNCS.SUBr('l'), null, 1, 4),
    0x97: new OpInfo(0x97, "SUB A", OP_FUNCS.SUBr('a'), null, 1, 4),
    0x98: new OpInfo(0x98, "SBC A,B", OP_FUNCS.SBCAr('b'), null, 1, 4),
    0x99: new OpInfo(0x99, "SBC A,C", OP_FUNCS.SBCAr('c'), null, 1, 4),
    0x9A: new OpInfo(0x9A, "SBC A,D", OP_FUNCS.SBCAr('d'), null, 1, 4),
    0x9B: new OpInfo(0x9B, "SBC A,E", OP_FUNCS.SBCAr('e'), null, 1, 4),
    0x9C: new OpInfo(0x9C, "SBC A,H", OP_FUNCS.SBCAr('h'), null, 1, 4),
    0x9D: new OpInfo(0x9D, "SBC A,L", OP_FUNCS.SBCAr('l'), null, 1, 4),
    0x9F: new OpInfo(0x9F, "SBC A,A", OP_FUNCS.SBCAr('a'), null, 1, 4),
    0xA0: new OpInfo(0xA0, "AND B", OP_FUNCS.ANDr('b'), null, 1, 4),
    0xA1: new OpInfo(0xA1, "AND C", OP_FUNCS.ANDr('c'), null, 1, 4),
    0xA2: new OpInfo(0xA2, "AND D", OP_FUNCS.ANDr('d'), null, 1, 4),
    0xA3: new OpInfo(0xA3, "AND E", OP_FUNCS.ANDr('e'), null, 1, 4),
    0xA4: new OpInfo(0xA4, "AND H", OP_FUNCS.ANDr('h'), null, 1, 4),
    0xA5: new OpInfo(0xA5, "AND L", OP_FUNCS.ANDr('l'), null, 1, 4),
    0xA7: new OpInfo(0xA7, "AND A", OP_FUNCS.ANDr('a'), null, 1, 4),
    0xA8: new OpInfo(0xA8, "XOR B", OP_FUNCS.XORr('b'), null, 1, 4),
    0xA9: new OpInfo(0xA9, "XOR C", OP_FUNCS.XORr('c'), null, 1, 4),
    0xAA: new OpInfo(0xAA, "XOR D", OP_FUNCS.XORr('d'), null, 1, 4),
    0xAB: new OpInfo(0xAB, "XOR E", OP_FUNCS.XORr('e'), null, 1, 4),
    0xAC: new OpInfo(0xAC, "XOR H", OP_FUNCS.XORr('h'), null, 1, 4),
    0xAD: new OpInfo(0xAD, "XOR L", OP_FUNCS.XORr('l'), null, 1, 4),
    0xAF: new OpInfo(0xAF, "XOR A", OP_FUNCS.XORr('a'), null, 1, 4),
    0xB0: new OpInfo(0xB0, "OR B", OP_FUNCS.ORr('b'), null, 1, 4),
    0xB1: new OpInfo(0xB1, "OR C", OP_FUNCS.ORr('c'), null, 1, 4),
    0xB2: new OpInfo(0xB2, "OR D", OP_FUNCS.ORr('d'), null, 1, 4),
    0xB3: new OpInfo(0xB3, "OR E", OP_FUNCS.ORr('e'), null, 1, 4),
    0xB4: new OpInfo(0xB4, "OR H", OP_FUNCS.ORr('h'), null, 1, 4),
    0xB5: new OpInfo(0xB5, "OR L", OP_FUNCS.ORr('l'), null, 1, 4),
    0xB7: new OpInfo(0xB7, "OR A", OP_FUNCS.ORr('a'), null, 1, 4),
    0xB8: new OpInfo(0xB8, "CP B", OP_FUNCS.CPr('b'), null, 1, 4),
    0xB9: new OpInfo(0xB9, "CP C", OP_FUNCS.CPr('c'), null, 1, 4),
    0xBA: new OpInfo(0xBA, "CP D", OP_FUNCS.CPr('d'), null, 1, 4),
    0xBB: new OpInfo(0xBB, "CP E", OP_FUNCS.CPr('e'), null, 1, 4),
    0xBC: new OpInfo(0xBC, "CP H", OP_FUNCS.CPr('h'), null, 1, 4),
    0xBD: new OpInfo(0xBD, "CP L", OP_FUNCS.CPr('l'), null, 1, 4),
    0xBF: new OpInfo(0xBF, "CP A", OP_FUNCS.CPr('a'), null, 1, 4),
    0xC0: new OpInfo(0xC0, "RET NZ", OP_FUNCS.RETNZ, null, 1, 8 /* or 20 */),
    0xC1: new OpInfo(0xC1, "POP BC", OP_FUNCS.POP('b', 'c'), null, 1, 12),
    0xC4: new OpInfo(0xC4, "CALL NZ,a16", OP_FUNCS.CALLNZ, null, 3, 12 /* or 24 */),
    0xC5: new OpInfo(0xC5, "PUSH BC", OP_FUNCS.PUSH('b', 'c'), null, 1, 16),
    0xC8: new OpInfo(0xC8, "RET Z", OP_FUNCS.RETZ, null, 1, 20 / 8),
    0xC9: new OpInfo(0xC9, "RET", OP_FUNCS.RET, null, 1, 16),
    0xCB: new OpInfo(0xCB, "CB", OP_FUNCS.CB, null, 2, 4), // Really 1, but all CB are 1 as well. Saves cycles
    0xCC: new OpInfo(0xCC, "CALL Z,a16", OP_FUNCS.CALLZ, null, 3, 12 /* or 24 */),
    0xCD: new OpInfo(0xCD, "CALL a16", OP_FUNCS.CALL, null, 3, 24),
    0xD0: new OpInfo(0xD0, "RET NC", OP_FUNCS.RETNC, null, 1, 8 /* or 20 */),
    0xD1: new OpInfo(0xD1, "POP DE", OP_FUNCS.POP('d', 'e'), null, 1, 12),
    0xD3: new OpInfo(0xD3, "BAD", OP_FUNCS.UNDOCUMENTED, null, 1, 4),
    0xD4: new OpInfo(0xD4, "CALL NC,a16", OP_FUNCS.CALLNC, null, 3, 12 /* or 24? */),
    0xD5: new OpInfo(0xD5, "PUSH DE", OP_FUNCS.PUSH('d', 'e'), null, 1, 16),
    0xD8: new OpInfo(0xD8, "RET C", OP_FUNCS.RETC, null, 1, 20 / 8),
    0xD9: new OpInfo(0xD9, "RETI", OP_FUNCS.RETI, null, 1, 16),
    0xDB: new OpInfo(0xDB, "BAD", OP_FUNCS.UNDOCUMENTED, null, 1, 4),
    0xDC: new OpInfo(0xDC, "CALL C,a16", OP_FUNCS.CALLC, null, 3, 12 /* or 24? */),
    0xDD: new OpInfo(0xDD, "BAD", OP_FUNCS.UNDOCUMENTED, null, 1, 4),
    0xE0: new OpInfo(0xE0, "LDH (a8),A", OP_FUNCS.LDxxA, ADDR_MODE.INDIRECT_N, 2, 12), // LDH (a8),A - 2  12
    0xE1: new OpInfo(0xE1, "POP HL", OP_FUNCS.POP('h', 'l'), null, 1, 12),
    0xE2: new OpInfo(0xE2, "LD (C),A", OP_FUNCS.LDxxA, ADDR_MODE.INDIRECT_C, 1, 8), // LD (C),A - 1  8
    0xE3: new OpInfo(0xE3, "BAD", OP_FUNCS.UNDOCUMENTED, null, 1, 4),
    0xE4: new OpInfo(0xE4, "BAD", OP_FUNCS.UNDOCUMENTED, null, 1, 4),
    0xE5: new OpInfo(0xE5, "PUSH HL", OP_FUNCS.PUSH('h', 'l'), null, 1, 16),
    0xEB: new OpInfo(0xEB, "BAD", OP_FUNCS.UNDOCUMENTED, null, 1, 4),
    0xEC: new OpInfo(0xEC, "BAD", OP_FUNCS.UNDOCUMENTED, null, 1, 4),
    0xED: new OpInfo(0xED, "BAD", OP_FUNCS.UNDOCUMENTED, null, 1, 4),
    0xF1: new OpInfo(0xF1, "POP AF", OP_FUNCS.POP('a', 'f'), null, 1, 12),
    0xF3: new OpInfo(0xF3, "DI", OP_FUNCS.DISABLE_INTERRUPTS, null, 1, 4),
    0xF4: new OpInfo(0xF4, "BAD", OP_FUNCS.UNDOCUMENTED, null, 1, 4),
    0xF5: new OpInfo(0xF5, "PUSH AF", OP_FUNCS.PUSH('a', 'f'), null, 1, 16),
    0xFB: new OpInfo(0xFB, "EI", OP_FUNCS.ENABLE_INTERRUPTS, null, 1, 4),
    0xFC: new OpInfo(0xFC, "BAD", OP_FUNCS.UNDOCUMENTED, null, 1, 4),
    0xFD: new OpInfo(0xFD, "BAD", OP_FUNCS.UNDOCUMENTED, null, 1, 4)
  };

  var CB_OPS = {
    0x00: new OpInfo(0x00, "RLC B", OP_FUNCS.RLC('b'), null, 2, 8),
    0x01: new OpInfo(0x01, "RLC C", OP_FUNCS.RLC('c'), null, 2, 8),
    0x02: new OpInfo(0x02, "RLC D", OP_FUNCS.RLC('d'), null, 2, 8),
    0x03: new OpInfo(0x03, "RLC E", OP_FUNCS.RLC('e'), null, 2, 8),
    0x04: new OpInfo(0x04, "RLC H", OP_FUNCS.RLC('h'), null, 2, 8),
    0x05: new OpInfo(0x05, "RLC L", OP_FUNCS.RLC('l'), null, 2, 8),
    0x06: new OpInfo(0x06, "RLC (HL)", OP_FUNCS.RLC_HL, ADDR_MODE.INDIRECT_HL, 2, 16),
    0x07: new OpInfo(0x07, "RLC A", OP_FUNCS.RLC('a'), null, 1, 8),
    0x08: new OpInfo(0x08, "RRC B", OP_FUNCS.RRC('b'), null, 2, 8),
    0x09: new OpInfo(0x09, "RRC C", OP_FUNCS.RRC('c'), null, 2, 8),
    0x0A: new OpInfo(0x0A, "RRC D", OP_FUNCS.RRC('d'), null, 2, 8),
    0x0B: new OpInfo(0x0B, "RRC E", OP_FUNCS.RRC('e'), null, 2, 8),
    0x0C: new OpInfo(0x0C, "RRC H", OP_FUNCS.RRC('h'), null, 2, 8),
    0x0D: new OpInfo(0x0D, "RRC L", OP_FUNCS.RRC('l'), null, 2, 8),
    0x0E: new OpInfo(0x0E, "RRC (HL)", OP_FUNCS.RRC_HL, ADDR_MODE.INDIRECT_HL, 2, 16),
    0x0F: new OpInfo(0x0F, "RRC A", OP_FUNCS.RRC('a'), null, 1, 8),

    0x10: new OpInfo(0x10, "RL B", OP_FUNCS.RL("b"), null, 2, 8),
    0x11: new OpInfo(0x11, "RL C", OP_FUNCS.RL("c"), null, 2, 8),
    0x12: new OpInfo(0x12, "RL D", OP_FUNCS.RL("d"), null, 2, 8),
    0x13: new OpInfo(0x13, "RL E", OP_FUNCS.RL("e"), null, 2, 8),
    0x14: new OpInfo(0x14, "RL H", OP_FUNCS.RL("h"), null, 2, 8),
    0x15: new OpInfo(0x15, "RL L", OP_FUNCS.RL("l"), null, 2, 8),
    0x16: new OpInfo(0x16, "RL (HL)", OP_FUNCS.RL_HL, ADDR_MODE.INDIRECT_HL, 2, 8),
    0x17: new OpInfo(0x17, "RL A", OP_FUNCS.RL("a"), null, 2, 8),

    0x18: new OpInfo(0x18, "RR B", OP_FUNCS.RR("b"), null, 2, 8),
    0x19: new OpInfo(0x19, "RR C", OP_FUNCS.RR("c"), null, 2, 8),
    0x1A: new OpInfo(0x1A, "RR D", OP_FUNCS.RR("d"), null, 2, 8),
    0x1B: new OpInfo(0x1B, "RR E", OP_FUNCS.RR("e"), null, 2, 8),
    0x1C: new OpInfo(0x1C, "RR H", OP_FUNCS.RR("h"), null, 2, 8),
    0x1D: new OpInfo(0x1D, "RR L", OP_FUNCS.RR("l"), null, 2, 8),
    0x1E: new OpInfo(0x1E, "RR (HL)", OP_FUNCS.RR_HL, ADDR_MODE.INDIRECT_HL, 2, 8),
    0x1F: new OpInfo(0x1F, "RR A", OP_FUNCS.RR("a"), null, 2, 8),

    0x20: new OpInfo(0x20, "SLA B", OP_FUNCS.SLA("b"), null, 2, 8),
    0x21: new OpInfo(0x21, "SLA C", OP_FUNCS.SLA("c"), null, 2, 8),
    0x22: new OpInfo(0x22, "SLA D", OP_FUNCS.SLA("d"), null, 2, 8),
    0x23: new OpInfo(0x23, "SLA E", OP_FUNCS.SLA("e"), null, 2, 8),
    0x24: new OpInfo(0x24, "SLA H", OP_FUNCS.SLA("h"), null, 2, 8),
    0x25: new OpInfo(0x25, "SLA L", OP_FUNCS.SLA("l"), null, 2, 8),
    0x26: new OpInfo(0x26, "SLA (HL)", OP_FUNCS.SLA_HL, ADDR_MODE.INDIRECT_HL, 2, 8),
    0x27: new OpInfo(0x27, "SLA A", OP_FUNCS.SLA("a"), null, 2, 8),

    0x28: new OpInfo(0x28, "SRA B", OP_FUNCS.SRA("b"), null, 2, 8),
    0x29: new OpInfo(0x29, "SRA C", OP_FUNCS.SRA("c"), null, 2, 8),
    0x2A: new OpInfo(0x2A, "SRA D", OP_FUNCS.SRA("d"), null, 2, 8),
    0x2B: new OpInfo(0x2B, "SRA E", OP_FUNCS.SRA("e"), null, 2, 8),
    0x2C: new OpInfo(0x2C, "SRA H", OP_FUNCS.SRA("h"), null, 2, 8),
    0x2D: new OpInfo(0x2D, "SRA L", OP_FUNCS.SRA("l"), null, 2, 8),
    0x2E: new OpInfo(0x2E, "SRA (HL)", OP_FUNCS.SRA_HL, ADDR_MODE.INDIRECT_HL, 2, 8),
    0x2F: new OpInfo(0x2F, "SRA A", OP_FUNCS.SRA("a"), null, 2, 8),

    0x30: new OpInfo(0x30, "SWAP B", OP_FUNCS.SWAP("b"), null, 2, 8),
    0x31: new OpInfo(0x31, "SWAP C", OP_FUNCS.SWAP("c"), null, 2, 8),
    0x32: new OpInfo(0x32, "SWAP D", OP_FUNCS.SWAP("d"), null, 2, 8),
    0x33: new OpInfo(0x33, "SWAP E", OP_FUNCS.SWAP("e"), null, 2, 8),
    0x34: new OpInfo(0x34, "SWAP H", OP_FUNCS.SWAP("h"), null, 2, 8),
    0x35: new OpInfo(0x35, "SWAP L", OP_FUNCS.SWAP("l"), null, 2, 8),
    0x36: new OpInfo(0x36, "SWAP (HL)", OP_FUNCS.SWAP_HL, ADDR_MODE.INDIRECT_HL, 2, 8),
    0x37: new OpInfo(0x37, "SWAP A", OP_FUNCS.SWAP("a"), null, 2, 8),

    0x38: new OpInfo(0x38, "SRL B", OP_FUNCS.SRL("b"), null, 2, 8),
    0x39: new OpInfo(0x39, "SRL C", OP_FUNCS.SRL("c"), null, 2, 8),
    0x3A: new OpInfo(0x3A, "SRL D", OP_FUNCS.SRL("d"), null, 2, 8),
    0x3B: new OpInfo(0x3B, "SRL E", OP_FUNCS.SRL("e"), null, 2, 8),
    0x3C: new OpInfo(0x3C, "SRL H", OP_FUNCS.SRL("h"), null, 2, 8),
    0x3D: new OpInfo(0x3D, "SRL L", OP_FUNCS.SRL("l"), null, 2, 8),
    0x3E: new OpInfo(0x3E, "SRL (HL)", OP_FUNCS.SRL_HL, ADDR_MODE.INDIRECT_HL, 2, 8),
    0x3F: new OpInfo(0x3F, "SRL A", OP_FUNCS.SRL("a"), null, 2, 8),

    0x40: new OpInfo(0x40, "BIT 0,B", OP_FUNCS.BIT(0, "b"), null, 2, 8),
    0x41: new OpInfo(0x41, "BIT 0,C", OP_FUNCS.BIT(0, "c"), null, 2, 8),
    0x42: new OpInfo(0x42, "BIT 0,D", OP_FUNCS.BIT(0, "d"), null, 2, 8),
    0x43: new OpInfo(0x43, "BIT 0,E", OP_FUNCS.BIT(0, "e"), null, 2, 8),
    0x44: new OpInfo(0x44, "BIT 0,H", OP_FUNCS.BIT(0, "h"), null, 2, 8),
    0x45: new OpInfo(0x45, "BIT 0,L", OP_FUNCS.BIT(0, "l"), null, 2, 8),
    0x46: new OpInfo(0x46, "BIT 0,(HL)", OP_FUNCS.BIT_HL(0), ADDR_MODE.INDIRECT_HL, 2, 16),
    0x47: new OpInfo(0x47, "BIT 0,A", OP_FUNCS.BIT(0, "a"), null, 2, 8),

    0x48: new OpInfo(0x48, "BIT 1,B", OP_FUNCS.BIT(1, "b"), null, 2, 8),
    0x49: new OpInfo(0x49, "BIT 1,C", OP_FUNCS.BIT(1, "c"), null, 2, 8),
    0x4A: new OpInfo(0x4A, "BIT 1,D", OP_FUNCS.BIT(1, "d"), null, 2, 8),
    0x4B: new OpInfo(0x4B, "BIT 1,E", OP_FUNCS.BIT(1, "e"), null, 2, 8),
    0x4C: new OpInfo(0x4C, "BIT 1,H", OP_FUNCS.BIT(1, "h"), null, 2, 8),
    0x4D: new OpInfo(0x4D, "BIT 1,L", OP_FUNCS.BIT(1, "l"), null, 2, 8),
    0x4E: new OpInfo(0x4E, "BIT 1,(HL)", OP_FUNCS.BIT_HL(1), ADDR_MODE.INDIRECT_HL, 2, 16),
    0x4F: new OpInfo(0x4F, "BIT 1,A", OP_FUNCS.BIT(1, "a"), null, 2, 8),

    0x50: new OpInfo(0x50, "BIT 2,B", OP_FUNCS.BIT(2, "b"), null, 2, 8),
    0x51: new OpInfo(0x51, "BIT 2,C", OP_FUNCS.BIT(2, "c"), null, 2, 8),
    0x52: new OpInfo(0x52, "BIT 2,D", OP_FUNCS.BIT(2, "d"), null, 2, 8),
    0x53: new OpInfo(0x53, "BIT 2,E", OP_FUNCS.BIT(2, "e"), null, 2, 8),
    0x54: new OpInfo(0x54, "BIT 2,H", OP_FUNCS.BIT(2, "h"), null, 2, 8),
    0x55: new OpInfo(0x55, "BIT 2,L", OP_FUNCS.BIT(2, "l"), null, 2, 8),
    0x56: new OpInfo(0x56, "BIT 2,(HL)", OP_FUNCS.BIT_HL(2), ADDR_MODE.INDIRECT_HL, 2, 16),
    0x57: new OpInfo(0x57, "BIT 2,A", OP_FUNCS.BIT(2, "a"), null, 2, 8),

    0x58: new OpInfo(0x58, "BIT 3,B", OP_FUNCS.BIT(3, "b"), null, 2, 8),
    0x59: new OpInfo(0x59, "BIT 3,C", OP_FUNCS.BIT(3, "c"), null, 2, 8),
    0x5A: new OpInfo(0x5A, "BIT 3,D", OP_FUNCS.BIT(3, "d"), null, 2, 8),
    0x5B: new OpInfo(0x5B, "BIT 3,E", OP_FUNCS.BIT(3, "e"), null, 2, 8),
    0x5C: new OpInfo(0x5C, "BIT 3,H", OP_FUNCS.BIT(3, "h"), null, 2, 8),
    0x5D: new OpInfo(0x5D, "BIT 3,L", OP_FUNCS.BIT(3, "l"), null, 2, 8),
    0x5E: new OpInfo(0x5E, "BIT 3,(HL)", OP_FUNCS.BIT_HL(3), ADDR_MODE.INDIRECT_HL, 2, 16),
    0x5F: new OpInfo(0x5F, "BIT 3,A", OP_FUNCS.BIT(3, "a"), null, 2, 8),

    0x60: new OpInfo(0x60, "BIT 4,B", OP_FUNCS.BIT(4, "b"), null, 2, 8),
    0x61: new OpInfo(0x61, "BIT 4,C", OP_FUNCS.BIT(4, "c"), null, 2, 8),
    0x62: new OpInfo(0x62, "BIT 4,D", OP_FUNCS.BIT(4, "d"), null, 2, 8),
    0x63: new OpInfo(0x63, "BIT 4,E", OP_FUNCS.BIT(4, "e"), null, 2, 8),
    0x64: new OpInfo(0x64, "BIT 4,H", OP_FUNCS.BIT(4, "h"), null, 2, 8),
    0x65: new OpInfo(0x65, "BIT 4,L", OP_FUNCS.BIT(4, "l"), null, 2, 8),
    0x66: new OpInfo(0x66, "BIT 4,(HL)", OP_FUNCS.BIT_HL(4), ADDR_MODE.INDIRECT_HL, 2, 16),
    0x67: new OpInfo(0x67, "BIT 4,A", OP_FUNCS.BIT(4, "a"), null, 2, 8),

    0x68: new OpInfo(0x68, "BIT 5,B", OP_FUNCS.BIT(5, "b"), null, 2, 8),
    0x69: new OpInfo(0x69, "BIT 5,C", OP_FUNCS.BIT(5, "c"), null, 2, 8),
    0x6A: new OpInfo(0x6A, "BIT 5,D", OP_FUNCS.BIT(5, "d"), null, 2, 8),
    0x6B: new OpInfo(0x6B, "BIT 5,E", OP_FUNCS.BIT(5, "e"), null, 2, 8),
    0x6C: new OpInfo(0x6C, "BIT 5,H", OP_FUNCS.BIT(5, "h"), null, 2, 8),
    0x6D: new OpInfo(0x6D, "BIT 5,L", OP_FUNCS.BIT(5, "l"), null, 2, 8),
    0x6E: new OpInfo(0x6E, "BIT 5,(HL)", OP_FUNCS.BIT_HL(5), ADDR_MODE.INDIRECT_HL, 2, 16),
    0x6F: new OpInfo(0x6F, "BIT 5,A", OP_FUNCS.BIT(5, "a"), null, 2, 8),

    0x70: new OpInfo(0x70, "BIT 6,B", OP_FUNCS.BIT(6, "b"), null, 2, 8),
    0x71: new OpInfo(0x71, "BIT 6,C", OP_FUNCS.BIT(6, "c"), null, 2, 8),
    0x72: new OpInfo(0x72, "BIT 6,D", OP_FUNCS.BIT(6, "d"), null, 2, 8),
    0x73: new OpInfo(0x73, "BIT 6,E", OP_FUNCS.BIT(6, "e"), null, 2, 8),
    0x74: new OpInfo(0x74, "BIT 6,H", OP_FUNCS.BIT(6, "h"), null, 2, 8),
    0x75: new OpInfo(0x75, "BIT 6,L", OP_FUNCS.BIT(6, "l"), null, 2, 8),
    0x76: new OpInfo(0x76, "BIT 6,(HL)", OP_FUNCS.BIT_HL(6), ADDR_MODE.INDIRECT_HL, 2, 16),
    0x77: new OpInfo(0x77, "BIT 6,A", OP_FUNCS.BIT(6, "a"), null, 2, 8),

    0x78: new OpInfo(0x78, "BIT 7,B", OP_FUNCS.BIT(7, "b"), null, 2, 8),
    0x79: new OpInfo(0x79, "BIT 7,C", OP_FUNCS.BIT(7, "c"), null, 2, 8),
    0x7A: new OpInfo(0x7A, "BIT 7,D", OP_FUNCS.BIT(7, "d"), null, 2, 8),
    0x7B: new OpInfo(0x7B, "BIT 7,E", OP_FUNCS.BIT(7, "e"), null, 2, 8),
    0x7C: new OpInfo(0x7C, "BIT 7,H", OP_FUNCS.BIT(7, "h"), null, 2, 8),
    0x7D: new OpInfo(0x7D, "BIT 7,L", OP_FUNCS.BIT(7, "l"), null, 2, 8),
    0x7E: new OpInfo(0x7E, "BIT 7,(HL)", OP_FUNCS.BIT_HL(7), ADDR_MODE.INDIRECT_HL, 2, 16),
    0x7F: new OpInfo(0x7F, "BIT 7,A", OP_FUNCS.BIT(7, "a"), null, 2, 8),

    0x80: new OpInfo(0x80, "RES 0,B", OP_FUNCS.RES(0, "b"), null, 2, 8),
    0x81: new OpInfo(0x81, "RES 0,C", OP_FUNCS.RES(0, "c"), null, 2, 8),
    0x82: new OpInfo(0x82, "RES 0,D", OP_FUNCS.RES(0, "d"), null, 2, 8),
    0x83: new OpInfo(0x83, "RES 0,E", OP_FUNCS.RES(0, "e"), null, 2, 8),
    0x84: new OpInfo(0x84, "RES 0,H", OP_FUNCS.RES(0, "h"), null, 2, 8),
    0x85: new OpInfo(0x85, "RES 0,L", OP_FUNCS.RES(0, "l"), null, 2, 8),
    0x86: new OpInfo(0x86, "RES 0,(HL)", OP_FUNCS.RES_HL(0), ADDR_MODE.INDIRECT_HL, 2, 16),
    0x87: new OpInfo(0x87, "RES 0,A", OP_FUNCS.RES(0, "a"), null, 2, 8),

    0x88: new OpInfo(0x88, "RES 1,B", OP_FUNCS.RES(1, "b"), null, 2, 8),
    0x89: new OpInfo(0x89, "RES 1,C", OP_FUNCS.RES(1, "c"), null, 2, 8),
    0x8A: new OpInfo(0x8A, "RES 1,D", OP_FUNCS.RES(1, "d"), null, 2, 8),
    0x8B: new OpInfo(0x8B, "RES 1,E", OP_FUNCS.RES(1, "e"), null, 2, 8),
    0x8C: new OpInfo(0x8C, "RES 1,H", OP_FUNCS.RES(1, "h"), null, 2, 8),
    0x8D: new OpInfo(0x8D, "RES 1,L", OP_FUNCS.RES(1, "l"), null, 2, 8),
    0x8E: new OpInfo(0x8E, "RES 1,(HL)", OP_FUNCS.RES_HL(1), ADDR_MODE.INDIRECT_HL, 2, 16),
    0x8F: new OpInfo(0x8F, "RES 1,A", OP_FUNCS.RES(1, "a"), null, 2, 8),

    0x90: new OpInfo(0x90, "RES 2,B", OP_FUNCS.RES(2, "b"), null, 2, 8),
    0x91: new OpInfo(0x91, "RES 2,C", OP_FUNCS.RES(2, "c"), null, 2, 8),
    0x92: new OpInfo(0x92, "RES 2,D", OP_FUNCS.RES(2, "d"), null, 2, 8),
    0x93: new OpInfo(0x93, "RES 2,E", OP_FUNCS.RES(2, "e"), null, 2, 8),
    0x94: new OpInfo(0x94, "RES 2,H", OP_FUNCS.RES(2, "h"), null, 2, 8),
    0x95: new OpInfo(0x95, "RES 2,L", OP_FUNCS.RES(2, "l"), null, 2, 8),
    0x96: new OpInfo(0x96, "RES 2,(HL)", OP_FUNCS.RES_HL(2), ADDR_MODE.INDIRECT_HL, 2, 16),
    0x97: new OpInfo(0x97, "RES 2,A", OP_FUNCS.RES(2, "a"), null, 2, 8),

    0x98: new OpInfo(0x98, "RES 3,B", OP_FUNCS.RES(3, "b"), null, 2, 8),
    0x99: new OpInfo(0x99, "RES 3,C", OP_FUNCS.RES(3, "c"), null, 2, 8),
    0x9A: new OpInfo(0x9A, "RES 3,D", OP_FUNCS.RES(3, "d"), null, 2, 8),
    0x9B: new OpInfo(0x9B, "RES 3,E", OP_FUNCS.RES(3, "e"), null, 2, 8),
    0x9C: new OpInfo(0x9C, "RES 3,H", OP_FUNCS.RES(3, "h"), null, 2, 8),
    0x9D: new OpInfo(0x9D, "RES 3,L", OP_FUNCS.RES(3, "l"), null, 2, 8),
    0x9E: new OpInfo(0x9E, "RES 3,(HL)", OP_FUNCS.RES_HL(3), ADDR_MODE.INDIRECT_HL, 2, 16),
    0x9F: new OpInfo(0x9F, "RES 3,A", OP_FUNCS.RES(3, "a"), null, 2, 8),

    0xA0: new OpInfo(0xA0, "RES 4,B", OP_FUNCS.RES(4, "b"), null, 2, 8),
    0xA1: new OpInfo(0xA1, "RES 4,C", OP_FUNCS.RES(4, "c"), null, 2, 8),
    0xA2: new OpInfo(0xA2, "RES 4,D", OP_FUNCS.RES(4, "d"), null, 2, 8),
    0xA3: new OpInfo(0xA3, "RES 4,E", OP_FUNCS.RES(4, "e"), null, 2, 8),
    0xA4: new OpInfo(0xA4, "RES 4,H", OP_FUNCS.RES(4, "h"), null, 2, 8),
    0xA5: new OpInfo(0xA5, "RES 4,L", OP_FUNCS.RES(4, "l"), null, 2, 8),
    0xA6: new OpInfo(0xA6, "RES 4,(HL)", OP_FUNCS.RES_HL(4), ADDR_MODE.INDIRECT_HL, 2, 16),
    0xA7: new OpInfo(0xA7, "RES 4,A", OP_FUNCS.RES(4, "a"), null, 2, 8),

    0xA8: new OpInfo(0xA8, "RES 5,B", OP_FUNCS.RES(5, "b"), null, 2, 8),
    0xA9: new OpInfo(0xA9, "RES 5,C", OP_FUNCS.RES(5, "c"), null, 2, 8),
    0xAA: new OpInfo(0xAA, "RES 5,D", OP_FUNCS.RES(5, "d"), null, 2, 8),
    0xAB: new OpInfo(0xAB, "RES 5,E", OP_FUNCS.RES(5, "e"), null, 2, 8),
    0xAC: new OpInfo(0xAC, "RES 5,H", OP_FUNCS.RES(5, "h"), null, 2, 8),
    0xAD: new OpInfo(0xAD, "RES 5,L", OP_FUNCS.RES(5, "l"), null, 2, 8),
    0xAE: new OpInfo(0xAE, "RES 5,(HL)", OP_FUNCS.RES_HL(5), ADDR_MODE.INDIRECT_HL, 2, 16),
    0xAF: new OpInfo(0xAF, "RES 5,A", OP_FUNCS.RES(5, "a"), null, 2, 8),

    0xB0: new OpInfo(0xB0, "RES 6,B", OP_FUNCS.RES(6, "b"), null, 2, 8),
    0xB1: new OpInfo(0xB1, "RES 6,C", OP_FUNCS.RES(6, "c"), null, 2, 8),
    0xB2: new OpInfo(0xB2, "RES 6,D", OP_FUNCS.RES(6, "d"), null, 2, 8),
    0xB3: new OpInfo(0xB3, "RES 6,E", OP_FUNCS.RES(6, "e"), null, 2, 8),
    0xB4: new OpInfo(0xB4, "RES 6,H", OP_FUNCS.RES(6, "h"), null, 2, 8),
    0xB5: new OpInfo(0xB5, "RES 6,L", OP_FUNCS.RES(6, "l"), null, 2, 8),
    0xB6: new OpInfo(0xB6, "RES 6,(HL)", OP_FUNCS.RES_HL(6), ADDR_MODE.INDIRECT_HL, 2, 16),
    0xB7: new OpInfo(0xB7, "RES 6,A", OP_FUNCS.RES(6, "a"), null, 2, 8),

    0xB8: new OpInfo(0xB8, "RES 7,B", OP_FUNCS.RES(7, "b"), null, 2, 8),
    0xB9: new OpInfo(0xB9, "RES 7,C", OP_FUNCS.RES(7, "c"), null, 2, 8),
    0xBA: new OpInfo(0xBA, "RES 7,D", OP_FUNCS.RES(7, "d"), null, 2, 8),
    0xBB: new OpInfo(0xBB, "RES 7,E", OP_FUNCS.RES(7, "e"), null, 2, 8),
    0xBC: new OpInfo(0xBC, "RES 7,H", OP_FUNCS.RES(7, "h"), null, 2, 8),
    0xBD: new OpInfo(0xBD, "RES 7,L", OP_FUNCS.RES(7, "l"), null, 2, 8),
    0xBE: new OpInfo(0xBE, "RES 7,(HL)", OP_FUNCS.RES_HL(7), ADDR_MODE.INDIRECT_HL, 2, 16),
    0xBF: new OpInfo(0xBF, "RES 7,A", OP_FUNCS.RES(7, "a"), null, 2, 8),

    0xC0: new OpInfo(0xC0, "SET 0,B", OP_FUNCS.SET(0, "b"), null, 2, 8),
    0xC1: new OpInfo(0xC1, "SET 0,C", OP_FUNCS.SET(0, "c"), null, 2, 8),
    0xC2: new OpInfo(0xC2, "SET 0,D", OP_FUNCS.SET(0, "d"), null, 2, 8),
    0xC3: new OpInfo(0xC3, "SET 0,E", OP_FUNCS.SET(0, "e"), null, 2, 8),
    0xC4: new OpInfo(0xC4, "SET 0,H", OP_FUNCS.SET(0, "h"), null, 2, 8),
    0xC5: new OpInfo(0xC5, "SET 0,L", OP_FUNCS.SET(0, "l"), null, 2, 8),
    0xC6: new OpInfo(0xC6, "SET 0,(HL)", OP_FUNCS.SET_HL(0), ADDR_MODE.INDIRECT_HL, 2, 16),
    0xC7: new OpInfo(0xC7, "SET 0,A", OP_FUNCS.SET(0, "a"), null, 2, 8),

    0xC8: new OpInfo(0xC8, "SET 1,B", OP_FUNCS.SET(1, "b"), null, 2, 8),
    0xC9: new OpInfo(0xC9, "SET 1,C", OP_FUNCS.SET(1, "c"), null, 2, 8),
    0xCA: new OpInfo(0xCA, "SET 1,D", OP_FUNCS.SET(1, "d"), null, 2, 8),
    0xCB: new OpInfo(0xCB, "SET 1,E", OP_FUNCS.SET(1, "e"), null, 2, 8),
    0xCC: new OpInfo(0xCC, "SET 1,H", OP_FUNCS.SET(1, "h"), null, 2, 8),
    0xCD: new OpInfo(0xCD, "SET 1,L", OP_FUNCS.SET(1, "l"), null, 2, 8),
    0xCE: new OpInfo(0xCE, "SET 1,(HL)", OP_FUNCS.SET_HL(1), ADDR_MODE.INDIRECT_HL, 2, 16),
    0xCF: new OpInfo(0xCF, "SET 1,A", OP_FUNCS.SET(1, "a"), null, 2, 8),

    0xD0: new OpInfo(0xD0, "SET 2,B", OP_FUNCS.SET(2, "b"), null, 2, 8),
    0xD1: new OpInfo(0xD1, "SET 2,C", OP_FUNCS.SET(2, "c"), null, 2, 8),
    0xD2: new OpInfo(0xD2, "SET 2,D", OP_FUNCS.SET(2, "d"), null, 2, 8),
    0xD3: new OpInfo(0xD3, "SET 2,E", OP_FUNCS.SET(2, "e"), null, 2, 8),
    0xD4: new OpInfo(0xD4, "SET 2,H", OP_FUNCS.SET(2, "h"), null, 2, 8),
    0xD5: new OpInfo(0xD5, "SET 2,L", OP_FUNCS.SET(2, "l"), null, 2, 8),
    0xD6: new OpInfo(0xD6, "SET 2,(HL)", OP_FUNCS.SET_HL(2), ADDR_MODE.INDIRECT_HL, 2, 16),
    0xD7: new OpInfo(0xD7, "SET 2,A", OP_FUNCS.SET(2, "a"), null, 2, 8),

    0xD8: new OpInfo(0xD8, "SET 3,B", OP_FUNCS.SET(3, "b"), null, 2, 8),
    0xD9: new OpInfo(0xD9, "SET 3,C", OP_FUNCS.SET(3, "c"), null, 2, 8),
    0xDA: new OpInfo(0xDA, "SET 3,D", OP_FUNCS.SET(3, "d"), null, 2, 8),
    0xDB: new OpInfo(0xDB, "SET 3,E", OP_FUNCS.SET(3, "e"), null, 2, 8),
    0xDC: new OpInfo(0xDC, "SET 3,H", OP_FUNCS.SET(3, "h"), null, 2, 8),
    0xDD: new OpInfo(0xDD, "SET 3,L", OP_FUNCS.SET(3, "l"), null, 2, 8),
    0xDE: new OpInfo(0xDE, "SET 3,(HL)", OP_FUNCS.SET_HL(3), ADDR_MODE.INDIRECT_HL, 2, 16),
    0xDF: new OpInfo(0xDF, "SET 3,A", OP_FUNCS.SET(3, "a"), null, 2, 8),

    0xE0: new OpInfo(0xE0, "SET 4,B", OP_FUNCS.SET(4, "b"), null, 2, 8),
    0xE1: new OpInfo(0xE1, "SET 4,C", OP_FUNCS.SET(4, "c"), null, 2, 8),
    0xE2: new OpInfo(0xE2, "SET 4,D", OP_FUNCS.SET(4, "d"), null, 2, 8),
    0xE3: new OpInfo(0xE3, "SET 4,E", OP_FUNCS.SET(4, "e"), null, 2, 8),
    0xE4: new OpInfo(0xE4, "SET 4,H", OP_FUNCS.SET(4, "h"), null, 2, 8),
    0xE5: new OpInfo(0xE5, "SET 4,L", OP_FUNCS.SET(4, "l"), null, 2, 8),
    0xE6: new OpInfo(0xE6, "SET 4,(HL)", OP_FUNCS.SET_HL(4), ADDR_MODE.INDIRECT_HL, 2, 16),
    0xE7: new OpInfo(0xE7, "SET 4,A", OP_FUNCS.SET(4, "a"), null, 2, 8),

    0xE8: new OpInfo(0xE8, "SET 5,B", OP_FUNCS.SET(5, "b"), null, 2, 8),
    0xE9: new OpInfo(0xE9, "SET 5,C", OP_FUNCS.SET(5, "c"), null, 2, 8),
    0xEA: new OpInfo(0xEA, "SET 5,D", OP_FUNCS.SET(5, "d"), null, 2, 8),
    0xEB: new OpInfo(0xEB, "SET 5,E", OP_FUNCS.SET(5, "e"), null, 2, 8),
    0xEC: new OpInfo(0xEC, "SET 5,H", OP_FUNCS.SET(5, "h"), null, 2, 8),
    0xED: new OpInfo(0xED, "SET 5,L", OP_FUNCS.SET(5, "l"), null, 2, 8),
    0xEE: new OpInfo(0xEE, "SET 5,(HL)", OP_FUNCS.SET_HL(5), ADDR_MODE.INDIRECT_HL, 2, 16),
    0xEF: new OpInfo(0xEF, "SET 5,A", OP_FUNCS.SET(5, "a"), null, 2, 8),

    0xF0: new OpInfo(0xF0, "SET 6,B", OP_FUNCS.SET(6, "b"), null, 2, 8),
    0xF1: new OpInfo(0xF1, "SET 6,C", OP_FUNCS.SET(6, "c"), null, 2, 8),
    0xF2: new OpInfo(0xF2, "SET 6,D", OP_FUNCS.SET(6, "d"), null, 2, 8),
    0xF3: new OpInfo(0xF3, "SET 6,E", OP_FUNCS.SET(6, "e"), null, 2, 8),
    0xF4: new OpInfo(0xF4, "SET 6,H", OP_FUNCS.SET(6, "h"), null, 2, 8),
    0xF5: new OpInfo(0xF5, "SET 6,L", OP_FUNCS.SET(6, "l"), null, 2, 8),
    0xF6: new OpInfo(0xF6, "SET 6,(HL)", OP_FUNCS.SET_HL(6), ADDR_MODE.INDIRECT_HL, 2, 16),
    0xF7: new OpInfo(0xF7, "SET 6,A", OP_FUNCS.SET(6, "a"), null, 2, 8),

    0xF8: new OpInfo(0xF8, "SET 7,B", OP_FUNCS.SET(7, "b"), null, 2, 8),
    0xF9: new OpInfo(0xF9, "SET 7,C", OP_FUNCS.SET(7, "c"), null, 2, 8),
    0xFA: new OpInfo(0xFA, "SET 7,D", OP_FUNCS.SET(7, "d"), null, 2, 8),
    0xFB: new OpInfo(0xFB, "SET 7,E", OP_FUNCS.SET(7, "e"), null, 2, 8),
    0xFC: new OpInfo(0xFC, "SET 7,H", OP_FUNCS.SET(7, "h"), null, 2, 8),
    0xFD: new OpInfo(0xFD, "SET 7,L", OP_FUNCS.SET(7, "l"), null, 2, 8),
    0xFE: new OpInfo(0xFE, "SET 7,(HL)", OP_FUNCS.SET_HL(7), ADDR_MODE.INDIRECT_HL, 2, 16),
    0xFF: new OpInfo(0xFF, "SET 7,A", OP_FUNCS.SET(7, "a"), null, 2, 8)
  };

  CPU.Registers = Registers;
  GameBoy.CPU = CPU;
})(GameBoy);