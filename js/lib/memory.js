(function (GameBoy) {

  var Memory = function (gb) {
    this.gb = gb;
    this.mapper = null;

    this._ram = new Uint8Array(new ArrayBuffer(0x10000));

    this._eram = new Uint8Array(new ArrayBuffer(0x2000)); //2K
    this._wram = new Uint8Array(new ArrayBuffer(0x2000)); //2Kish (shadow)
    this._zram = new Uint8Array(new ArrayBuffer(0x7F)); //127B

    this._bios = getAsset("DMG_ROM.bin").asUint8Array();
    this._rom = getAsset("roms/Asteroids.gb").asUint8Array();

    this._romEnabled = true;


    this._if = 0; //0xFF0F
    this._ie = 0; //0xFFFF
  };

  Memory.prototype = {
    reset: function () {
    },
    read: function (addr) {
      switch (addr & 0xF000) {
        case 0x0000:
          // BIOS indexing
          if (addr <= 0xFF && this._romEnabled)
            return this._bios[addr];

        case 0x1000:
        case 0x2000:
        case 0x3000:
          // ROM 0
          return this._rom[addr];

        case 0x4000:
        case 0x5000:
        case 0x6000:
        case 0x7000:
          // ROM 1 (Bankable)
          return this._rom[addr];

        case 0x8000:
        case 0x9000:
          // VRam
          return this.gb.gpu.read(addr);

        case 0xA000:
        case 0xB000:
          // Cartridge RAM (8k)
          return this._eram[addr & 0x1FFF];

        case 0xC000:
          //Working RAM (Bank 0)
          return this._wram[addr & 0x0FFF];

        case 0xD000:
          //Working RAM (Switchable)
          return this._wram[addr & 0x1FFF];

        case 0xE000:
          // Working RAM Shadow
          return this._wram[addr & 0x1FFF];

        case 0xF000:
          /* Special Registers
           *
           * Input
           *   FF00 Joypad
           * Serial Data
           *   FF01 Serial Transfer Data
           *   FF02 Serial IO Control
           * Timer
           *   FF04 Divider
           *   FF05 TIMA counter
           *   FF06 TIMA modulo
           *   FF07 TAC Timer Control
           * MMU Interrupt
           *   FF0F Interrupt Flag
           * Sound FF10 - FF3F
           *   FF10 Sound Mode 1, Sweep
           *   FF11 Sound Mode 1, Length/Wave
           *   FF12 Sound Mode 1, Envelope
           *   FF13 Sound Mode 1, Frequency Lo
           *   FF14 Sound Mode 1, Frequency Hi
           *   FF15 Sound Mode 2, Sweep
           *   FF16 Sound Mode 2, Length/Wave
           *   FF17 Sound Mode 2, Envelope
           *   FF18 Sound Mode 2, Frequency Lo
           *   FF19 Sound Mode 2, Frequency Hi
           *   FF1A Sound Mode 3, On/Off
           *   FF1B Sound Mode 3, Length
           *   FF1C Sound Mode 3, Output Level
           *   FF1D Sound Mode 3, Frequency Lo
           *   FF1E Sound Mode 3, Frequency Hi
           *   FF20 Sound Mode 4, Length
           *   FF21 Sound Mode 4, Envelope
           *   FF22 Sound Mode 4, Polynomial counter
           *   FF23 Sound Mode 4, Counter/Consecutive
           *   FF24 Sound Mode 4, Channel Control/ON-OFF/Volume
           *   FF25 Sound Mode Output Terminal (bitset)
           *     Bit 7 - Output sound 4 to SO2 terminal
           *     Bit 6 - Output sound 3 to SO2 terminal
           *     Bit 5 - Output sound 2 to SO2 terminal
           *     Bit 4 - Output sound 1 to SO2 terminal
           *     Bit 3 - Output sound 4 to SO1 terminal
           *     Bit 2 - Output sound 3 to SO1 terminal
           *     Bit 1 - Output sound 2 to SO1 terminal
           *     Bit 0 - Output sound 1 to SO1 terminal
           *   FF26 Sound ON/Off
           *   FF30 - FF3F Wave Pattern RAM
           * GPU FF40 FF4B
           *   FF40 LCD Control
           *   FF41 LCD Status
           *   FF42 SCY
           *   FF43 SCX
           *   FF44 LY
           *   FF45 LYC
           *   FF46 DMA Transfer
           *   FF47 BG and Window Palette
           *   FF48 Obj0 Palette
           *   FF49 Obj1 Palette
           *   FF4A Window Y
           *   FF4B Window X
           * MM Interrupt
           *   FFFF Interrupt Enable
           */
          /* Special areas
           FE00	FE9F	Sprite attribute table (OAM)
           FEA0	FEFF	Not Usable
           FF00 FF7F	I/O Registers
           FF00 FF00 - Joypad
           FF04 FF07 - Timer
           FF80	FFFE	High RAM (HRAM)
           FFFF	FFFF	Interrupts Enable Register
           */
          if (addr <= 0xFDFF) {
            // Mirror RAM, E000 FDFF
            return this._wram[addr & 0x1FFF];
          } else if (addr <= 0xFE9F) {
            return this.gb.gpu.read(addr); //OAM, FE00 FE9F
          } else if (addr < 0xFF00) {
            return 0; //Unusable, FEA0 FEFF
          } else if (addr == 0xFF00) {
            return this.gb.input.read(addr); // Input FF00
          } else if (addr <= 0xFF02) {
            return this.gb.serial.read(addr); //Serial FF01 FF02
          } else if (addr == 0xFF03) {
            return 0; // Unused?
          } else if (addr <= 0xFF07) {
            return this.gb.timer.read(addr);
          } else if (addr <= 0xFF0E) {
            // Unusable
            return 0;
          } else if (addr == 0xFF0F) {
            return this._if; //Interrupt Flag, FF0F
          } else if (addr <= 0xFF3f) {
            return this.gb.sound.read(addr); //Sound FF10 FF3F
          } else if (addr <= 0xFF4B) {
            return this.gb.gpu.read(addr); //GPU Registers, FF40 FF4B
          } else if (addr <= 0xFF7F) {
            return 0; //Unused;
          } else if (addr <= 0xFFFE) {
            return this._zram[addr & 0x7F];
          } else if (addr == 0xFFFF) {
            return this._ie;
          } else {
            //I'm pretty sure i've covered everything, but lets throw up anyway
            throw 'Unimplemented memory area' + GameBoy.toHex(addr, 4);
          }
      }
    },

    readWord: function (addr) {
      return (this.read(addr + 1) << 8) + this.read(addr);
    },
    write: function (addr, val) {
      val &= 0xFF;
      switch (addr & 0xF000) {
        case 0x0000:
          // BIOS indexing
          if (addr <= 0xFF && this._romEnabled)
            throw 'Write to BIOS ROM';

        case 0x1000:
        case 0x2000:
        case 0x3000:
          // ROM 0
          console.log("Write to ROM at $" + GameBoy.toHex(addr, 4));
          this._rom[addr] = val;
          return;

        case 0x4000:
        case 0x5000:
        case 0x6000:
        case 0x7000:
          // ROM 1 (Bankable)
          console.log("Write to ROM at $" + GameBoy.toHex(addr, 4));
          return this._rom[addr] = val;
          return;
        case 0x8000:
        case 0x9000:
          // VRam
          return this.gb.gpu.write(addr, val);

        case 0xA000:
        case 0xB000:
          // Cartridge RAM (8k)
          return this._eram[addr & 0x1FFF] = val;

        case 0xC000:
          //Working RAM (Bank 0)
          this._wram[addr & 0x0FFF] = val;

        case 0xD000:
          //Working RAM (Switchable)
          this._wram[addr & 0x1FFF] = val;

        case 0xE000:
          // Working RAM Shadow
          this._wram[addr & 0x1FFF] = val;

        case 0xF000:
          /* Special Registers
           *
           * Input
           *   FF00 Joypad
           * Serial Data
           *   FF01 Serial Transfer Data
           *   FF02 Serial IO Control
           * Timer
           *   FF04 Divider
           *   FF05 TIMA counter
           *   FF06 TIMA modulo
           *   FF07 TAC Timer Control
           * MMU Interrupt
           *   FF0F Interrupt Flag
           * Sound FF10 - FF3F
           *   FF10 Sound Mode 1, Sweep
           *   FF11 Sound Mode 1, Length/Wave
           *   FF12 Sound Mode 1, Envelope
           *   FF13 Sound Mode 1, Frequency Lo
           *   FF14 Sound Mode 1, Frequency Hi
           *   FF15 Sound Mode 2, Sweep
           *   FF16 Sound Mode 2, Length/Wave
           *   FF17 Sound Mode 2, Envelope
           *   FF18 Sound Mode 2, Frequency Lo
           *   FF19 Sound Mode 2, Frequency Hi
           *   FF1A Sound Mode 3, On/Off
           *   FF1B Sound Mode 3, Length
           *   FF1C Sound Mode 3, Output Level
           *   FF1D Sound Mode 3, Frequency Lo
           *   FF1E Sound Mode 3, Frequency Hi
           *   FF20 Sound Mode 4, Length
           *   FF21 Sound Mode 4, Envelope
           *   FF22 Sound Mode 4, Polynomial counter
           *   FF23 Sound Mode 4, Counter/Consecutive
           *   FF24 Sound Mode 4, Channel Control/ON-OFF/Volume
           *   FF25 Sound Mode Output Terminal (bitset)
           *     Bit 7 - Output sound 4 to SO2 terminal
           *     Bit 6 - Output sound 3 to SO2 terminal
           *     Bit 5 - Output sound 2 to SO2 terminal
           *     Bit 4 - Output sound 1 to SO2 terminal
           *     Bit 3 - Output sound 4 to SO1 terminal
           *     Bit 2 - Output sound 3 to SO1 terminal
           *     Bit 1 - Output sound 2 to SO1 terminal
           *     Bit 0 - Output sound 1 to SO1 terminal
           *   FF26 Sound ON/Off
           *   FF30 - FF3F Wave Pattern RAM
           * GPU FF40 FF4B
           *   FF40 LCD Control
           *   FF41 LCD Status
           *   FF42 SCY
           *   FF43 SCX
           *   FF44 LY
           *   FF45 LYC
           *   FF46 DMA Transfer
           *   FF47 BG and Window Palette
           *   FF48 Obj0 Palette
           *   FF49 Obj1 Palette
           *   FF4A Window Y
           *   FF4B Window X
           * MM Interrupt
           *   FFFF Interrupt Enable
           */
          /* Special areas
           FE00	FE9F	Sprite attribute table (OAM)
           FEA0	FEFF	Not Usable
           FF00 FF7F	I/O Registers
           FF00 FF00 - Joypad
           FF04 FF07 - Timer
           FF80	FFFE	High RAM (HRAM)
           FFFF	FFFF	Interrupts Enable Register
           */
          if (addr <= 0xFDFF) {
            // Mirror RAM, E000 FDFF
            this._wram[addr & 0x1FFF] = val;
            return;
          } else if (addr <= 0xFE9F) {
            this.gb.gpu.write(addr, val); //OAM, FE00 FE9F
            return;
          } else if (addr < 0xFF00) {
            return; //Unusable, FEA0 FEFF
          } else if (addr == 0xFF00) {
            this.gb.input.write(addr, val); // Input FF00
            return;
          } else if (addr <= 0xFF02) {
            this.gb.serial.write(addr, val); //Serial FF01 FF02
            return;
          } else if (addr == 0xFF03) {
            return; // Unused?
          } else if (addr <= 0xFF07) {
            this.gb.timer.write(addr, val);
            return;
          } else if (addr <= 0xFF0E) {
            // Unusable
            return;
          } else if (addr == 0xFF0F) {
            this._if = val; //Interrupt Flag, FF0F
            return;
          } else if (addr <= 0xFF3f) {
            this.gb.sound.write(addr, val); //Sound FF10 FF3F
            return;
          } else if (addr <= 0xFF4B) {
            this.gb.gpu.write(addr, val); //GPU Registers, FF40 FF4B
            return;
          } else if (addr == 0xFF50) {
            this._romEnabled = false;
            console.log("ROM Finished");
            return;
          } else if (addr <= 0xFF7F) {
            return; //Unused;
          } else if (addr <= 0xFFFE) {
            this._zram[addr & 0x7F] = val;
          } else if (addr == 0xFFFF) {
            this._ie = val;
            return;
          } else {
            throw 'Unimplemented write $' + GameBoy.toHex(val, 2) + ' to memory $' + GameBoy.toHex(addr, 4);
          }
      }
    },
    writeWord: function (addr, val) {
      this.write(addr, val >> 8);
      this.write(addr + 1, val);
    }
  };

  GameBoy.Memory = Memory;
})(GameBoy);