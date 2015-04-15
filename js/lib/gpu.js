(function (GameBoy) {
  var GPU = function (gb) {
    this.gb = gb;

    this._vram = new Uint8Array(new ArrayBuffer(0x2000));  // 2Kb, addressable from 0x8000 - 0x9FFF
    this._oam = new Uint8Array(new ArrayBuffer(0xa0)); // 0xFE00 - 0xFE9F
    this._scanrow = [];
    this._tilemap = [];
    /** @type GPU.OBJ **/
    this._objdata = [];

    this.r = {}

  };

  GPU.OBJ = function (x, y, tile, xflip, yflip, prio, palette) {
    this.x = x;
    this.y = y;
    this.tile = tile;
    this.xflip = xflip;
    this.yflip = yflip;
    this.prio = prio;
    this.palette = palette;
  };

  GPU.prototype = {
    _palette: {
      bg: [255, 255, 255, 255],
      obj0: [255, 255, 255, 255],
      obj1: [255, 255, 255, 255]
    },
    reset: function () {
      var i = 0x2000, j, k;
      while (i--) {
        this._vram[i] = 0;
      }
      i = 0xa0;
      while (i--) {
        this._oam[i] = 0;
      }
      i = 0x04;
      while (i--) {
        this._palette.bg[i] = 255;
        this._palette.obj0[i] = 255;
        this._palette.obj1[i] = 255;
      }
      i = 0x200;
      while (i--) {
        this._tilemap[i] = [];
        j = 0x8;
        while (j--) {
          this._tilemap[i][j] = [];
          k = 0x8;
          while (k--) {
            this._tilemap[i][j][k] = 0;
          }
        }
      }

      this.r.curline = 0;
      this.r.curscan = 0;
      this.r.mode = 2;
      this.r.modeclocks = 0;
      this.r.yscr = 0;
      this.r.xscr = 0;
      this.r.raster = 0;
      this.r.ints = 0;
      this.r.lcdon = 0;
      this.r.bgon = 0;
      this.r.objon = 0;
      this.r.winon = 0;
      this.r.objsize = 0;

      this.r.reg = [];

      this.r.bgtilebase = 0x0000;
      this.r.bgmapbase = 0x1800;
      this.r.wintilebase = 0x1800;

      for (i = 0; i < 160; i++) this._scanrow[i] = 0;
      for (i = 0; i < 40; i++) {
        this._objdata[i] = new ObjData(-16, -8, 0, 0, 0, 0, 0, i);
      }

      this._ctx = this.gb.canvas.getContext('2d');
      this._scrn = this._ctx.createImageData(160, 144);
      for (i = 0; i < this._scrn.data.length; i++) {
        this._scrn.data[i] = 0xFF;
      }
      this.blitScreen();
    },

    blitScreen: function () {
      this._ctx.putImageData(this._scrn, 0, 0);
    },
    read: function (addr) {
      if (addr >= 0x8000 && addr <= 0x9FFF) {
        return this._vram[addr & 0x1FFF];
      } else if (addr >= 0xFE00 && addr <= 0xFE9F) {
        return this._oam[addr & 0xFF];
      }
      switch (addr) {
        case 0xFF40: // FF40 LCD Control
          return (this.r.lcdon ? 0x80 : 0) |
              ((this.r.bgtilebase == 0x0000) ? 0x10 : 0) |
              ((this.r.bgmapbase == 0x1C00) ? 0x08 : 0) |
              (this.r.objsize ? 0x04 : 0) |
              (this.r.objon ? 0x02 : 0) |
              (this.r.bgon ? 0x01 : 0);
        case 0xFF41: // FF41 LCD Status
          // TODO: Fix this
          /*
           Bit 6 - LYC=LY Coincidence Interrupt (1=Enable) (Read/Write)
           Bit 5 - Mode 2 OAM Interrupt         (1=Enable) (Read/Write)
           Bit 4 - Mode 1 V-Blank Interrupt     (1=Enable) (Read/Write)
           Bit 3 - Mode 0 H-Blank Interrupt     (1=Enable) (Read/Write)
           Bit 2 - Coincidence Flag  (0:LYC<>LY, 1:LYC=LY) (Read Only)
           Bit 1-0 - Mode Flag       (Mode 0-3, see below) (Read Only)
             0: During H-Blank
             1: During V-Blank
             2: During Searching OAM
             3: During Transferring Data to LCD Driver
           */
          return (this.r.curline == this.r.raster ? 4 : 0) | this.r.mode;
        case 0xFF42: // FF42 SCY
          return this.r.yscr; 
        case 0xFF43: // FF43 SCX
          return this.r.xscr;
        case 0xFF44: // FF44 LY
          return this.r.curline;
        case 0xFF45: // FF45 LYC
          return this.r.raster;

        case 0xFF46: // FF46 DMA Transfer
        case 0xFF47: // FF47 BG and Window Palette
        case 0xFF48: // FF48 Obj0 Palette
        case 0xFF49: // FF49 Obj1 Palette
        case 0xFF4A: // FF4A Window Y
        case 0xFF4B: // FF4B Window X
        default:
          return this.r.reg[addr] || 0;
      }
    },
    write: function (addr, val) {
      if (addr >= 0x8000 && addr <= 0x9FFF) {
        this._vram[addr & 0x1FFF] = val;
        this.updateTileset(addr & 0x1FFF, val);
        return;
      } else if (addr >= 0xFE00 && addr <= 0xFE9F) {
        this._oam[addr & 0xFF] = val;
        this.updateOAM(addr, val);
        return;
      }
      this.r.reg[addr] = val;
      switch (addr) {
        case 0xFF40: // FF40 LCD Control
          this.r.lcdon = (val & 0x80) ? 1 : 0;
          this.r.bgtilebase = (val & 0x10) ? 0x0000 : 0x0800;
          this.r.bgmapbase = (val & 0x08) ? 0x1C00 : 0x1800;
          this.r.objsize = (val & 0x04) ? 1 : 0;
          this.r.objon = (val & 0x02) ? 1 : 0;
          this.r.bgon = (val & 0x01) ? 1 : 0;
          console.log("BGMapBase: $" + GameBoy.toHex(this.r.bgmapbase, 4));
          return;
        case 0xFF42: // FF42 SCY
          this.r.yscr = val;
          console.log("YSCR: $" + GameBoy.toHex(this.r.yscr, 2));
          return;
        case 0xFF43: // FF43 SCX
          this.r.xscr = val;
          return;
        case 0xFF45: // FF45 LYC
          this.r.raster = val;

        case 0xFF46: // FF46 DMA Transfer
          var v;
          for (var i = 0; i < 160; i++) {
            v = this.gb.memory.read((val << 8) + 1);
            this._oam[i] = v;
            this.updateOAM(0xFE00 + i, v);
          }
          break;
        case 0xFF47: // FF47 BG and Window Palette
          for (var i = 0; i < 4; i++) {
            switch ((val >> (i * 2)) & 3) {
              case 0:
                this._palette.bg[i] = 0xFF;
                break;
              case 1:
                this._palette.bg[i] = 0xC0;
                break;
              case 2:
                this._palette.bg[i] = 0x60;
                break;
              case 3:
                this._palette.bg[i] = 0x00;
                break;
            }
          }
          break;
        case 0xFF48: // FF48 Obj0 Palette
          for (var i = 0; i < 4; i++) {
            switch ((val >> (i * 2)) & 3) {
              case 0:
                this._palette.obj0[i] = 0xFF;
                break;
              case 1:
                this._palette.obj0[i] = 0xC0;
                break;
              case 2:
                this._palette.obj0[i] = 0x60;
                break;
              case 3:
                this._palette.obj0[i] = 0x00;
                break;
            }
          }
          break;
        case 0xFF49: // FF49 Obj1 Palette
          for (var i = 0; i < 4; i++) {
            switch ((val >> (i * 2)) & 3) {
              case 0:
                this._palette.obj1[i] = 0xFF;
                break;
              case 1:
                this._palette.obj1[i] = 0xC0;
                break;
              case 2:
                this._palette.obj1[i] = 0x60;
                break;
              case 3:
                this._palette.obj1[i] = 0x00;
                break;
            }
          }
          break;
        case 0xFF4A: // FF4A Window Y
        case 0xFF4B: // FF4B Window X
        default:
          break;
      }
    },

    updateTileset: function (addr, val) {
      var saddr = addr, tile, y, sx;
      if (addr & 0x01) {
        saddr = addr = addr - 1;
      }
      tile = (addr >> 4) & 0x1ff;
      y = (addr >> 1) & 7;
      for (var x = 0; x < 8; x++) {
        sx = 1 << (7 - x);
        this._tilemap[tile][y][x] = ((this._vram[saddr] & sx) ? 1 : 0) | ((this._vram[saddr + 1] & sx) ? 2 : 0);
      }
    },
    updateOAM: function (addr, val) {
      addr -= 0xFE00;
      var obj = addr >> 2;
      if (obj < 40) {
        switch (addr & 0x03) {
          case 0:
            this._objdata[obj].y = val - 16;
            break;
          case 1:
            this._objdata[obj].x = val - 8;
            break;
          case 2:
            if (this.r.objsize) {
              this._objdata[obj].tile = (val & 0xFE);
            } else {
              this._objdata[obj].tile = val;
            }
            break;
          case 3:
            this._objdata[obj].palette = (val & 0x10) ? 1 : 0;
            this._objdata[obj].xflip = (val & 0x20) ? 1 : 0;
            this._objdata[obj].yflip = (val & 0x40) ? 1 : 0;
            this._objdata[obj].prio = (val & 0x80) ? 1 : 0;
            break;
        }
      }
      this._objdatasorted = this._objdata;
      this._objdatasorted.sort(function (a, b) {
        if (a.x > b.x) return -1;
        if (a.num > b.num) return -1;
      })
    },
    step: function () {
      /*
       The magic happens here.
       We have 4 "modes"

       0:
       1:
       2:
       3:
       */
      this.r.modeclocks += this.gb.cpu.cycles;
      switch (this.r.mode) {
        case 0: //HBlank
          if (this.r.modeclocks >= 0xcc) {
            if (this.r.curline == 143) { // End of HBlank, render
              this.r.mode = 1;
              this.blitScreen();
              this.gb.memory._interrupts |= 0x01; //Set HBlank interrupt flag
            } else {
              this.r.mode = 2;
            }

            this.r.curline++;
            this.r.curscan += 640;
            this.r.modeclocks = 0;
          }
          break;
        case 1: //VBlank
          if (this.r.modeclocks >= 0x240) {
            this.r.modeclocks = 0;
            this.r.curline++;
            if (this.r.curline > 153) {
              this.r.curline = 0;
              this.r.curscan = 0;
              this.r.mode = 2;
            }
          }
          break;
        case 2: //OAM-Read
          if (this.r.modeclocks >= 0x50) {
            this.r.modeclocks = 0;
            this.r.mode = 3;
          }
          break;
        case 3: //VRAM-Read
          if (this.r.modeclocks >= 0xac) {
            this.r.modeclocks = 0;
            this.r.mode = 0;
            if (this.r.lcdon) {
              //We are actually displaying things
              this.renderScanBG();
              this.renderScanObj();
              this.renderWindow();
            }
          }
          break;
      }
    },
    renderScanBG: function () {
      if (this.r.bgon) {
        //We want to render the background
        var linebase = this.r.curscan,
            mapbase = this.r.bgmapbase + ((((this.r.curline + this.r.yscr) & 255) >> 3) << 5),
            y = (this.r.curline + this.r.yscr) & 7,
            x = this.r.xscr & 7,
            t = (this.r.xscr >> 3) & 31, //FUCK THIS
            w = 160,
            pixel, tile, tilerow;

        /*
         * 160x144x4
         * BG is a 256x256 pixel, 32x32 tile map in VRAM at 0x9800 or 0x9C00.
         * 
         * Each entry is a single number with the tile
         *
         * linebase will equal line * (4 * 160)
         * bgmapbase should be (at start) 0x1800
         * Therefore, mapbase should be:
         *   bgmapbase + ((current_line // 8) + yscr)
         * this.r.yscr is the background y scroll position, I need to track changes to this
         * this.r.curline is just the current line's y, 0,0 at top left
         * I need to determine why the >> 3) << 5 is applied, I'm almost sure its the issue
         */
        if(this.oldt != t) {
          console.log("t " + this.oldt + " -> " + t);
        }
        this.oldt = t;
        if (this.r.bgtilebase) {
          tile = this._vram[mapbase + t];
          if (tile < 128) tile = 256 + tile;
          tilerow = this._tilemap[tile][y];
          do { // while ( --w )
            //Loop through pixels from 0 - 160
            // Set them in the scanrow for obj rendering, as well as in the screen data
            this._scanrow[160 - x] = tilerow[x];
            this._scrn.data[linebase + 0] = this._palette.bg[tilerow[x]];
            this._scrn.data[linebase + 1] = this._palette.bg[tilerow[x]];
            this._scrn.data[linebase + 2] = this._palette.bg[tilerow[x]];
            this._scrn.data[linebase + 3] = 0xFF;
            x++;
            if (x == 8) {
              t = (t + 1) & 31;
              x = 0;
              tile = this._vram[mapbase + t];
              if (tile < 128) tile = 256 + tile;
              tilerow = this._tilemap[tile][y];
            }
            linebase += 4;
          } while (--w);
        } else {
          tilerow = this._tilemap[this._vram[mapbase + t]][y];
          do {
            this._scanrow[160 - x] = tilerow[x];
            this._scrn.data[linebase + 0] = this._palette.bg[tilerow[x]];
            this._scrn.data[linebase + 1] = this._palette.bg[tilerow[x]];
            this._scrn.data[linebase + 2] = this._palette.bg[tilerow[x]];
            this._scrn.data[linebase + 3] = 0xFF;
            x++;
            if (x == 8) {
              t = (t + 1) & 31;
              x = 0;
              tilerow = this._tilemap[this._vram[mapbase + t]][y];
            }
            linebase += 4;
          } while (--w);
        }
      }
    },
    renderWindow: function() {
      //TODO: implement
    },
    renderScanObj: function () {
      if (this.r.objon) {
        var cnt = 0;
        var tilerow, obj, pal, pixel, x, linebase = this.r.curscan;
        for (var i = 0; i < 40; i++) {
          obj = this._objdatasorted[i];
          if (obj.y <= this.r.curline && (obj.y + 8) > this.r.curline) {
            if (obj.yflip) {
              tilerow = this._tilemap[obj.tile][7 - (this.r.curline - obj.y)];
            } else {
              tilerow = this._tilemap[obj.tile][this.r.curline - obj.y];
            }

            if (obj.palette) {
              pal = this._palette.obj1;
            } else {
              pal = this._palette.obj0;
            }

            linebase = (this.r.curline * 160 + obj.x) * 4;

            for (x = 0; x < 8; x++) {
              if (obj.x + x >= 0 && obj.x + x < 160) {
                if (obj.xflip) {
                  if (tilerow[7 - x] && (obj.prio || !this.r._scanrow[x])) {
                    this._scrn.data[linebase + 0] = pal[tilerow[7 - x]];
                    this._scrn.data[linebase + 1] = pal[tilerow[7 - x]];
                    this._scrn.data[linebase + 2] = pal[tilerow[7 - x]];
                    this._scrn.data[linebase + 3] = 0xFF; //pal[tilerow[7 - x]];
                  }
                } else {
                  if (tilerow[7 - x] && (obj.prio || !this._scanrow[x])) {
                    this._scrn.data[linebase + 0] = pal[tilerow[x]];
                    this._scrn.data[linebase + 1] = pal[tilerow[x]];
                    this._scrn.data[linebase + 2] = pal[tilerow[x]];
                    this._scrn.data[linebase + 3] = 0xFF; //pal[tilerow[x]];
                  }

                }
              }
              linebase += 4;
            }
            cnt++;
            if (cnt > 10) break;
          }
        } // End obj loop
      }
    }
  };

  var ObjData = function (y, x, tile, palette, yflip, xflip, prio, num) {
    this.y = y;
    this.x = x;
    this.tile = tile;
    this.palette = palette;
    this.yflip = yflip;
    this.xflip = xflip;
    this.prio = prio;
    this.num = num;
  };

  GPU.PALETTES = [];
  GameBoy.GPU = GPU;
})(GameBoy);