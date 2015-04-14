var GameBoy = function (canvas_id, log_id, disassembler_id) {
  this.canvas = document.getElementById(canvas_id);

  this.cpu = new GameBoy.CPU(this);
  this.memory = new GameBoy.Memory(this);
  this.gpu = new GameBoy.GPU(this);
  this.input = new GameBoy.Input(this);
  this.sound = new GameBoy.Sound(this);
  this.timer = new GameBoy.Timer(this);
  this.serial = new GameBoy.Serial(this);

  this.renderer = new GameBoy.Renderer(this, log_id, disassembler_id);
  this.init();
};

GameBoy.prototype = {
  init: function () {
    this.renderer.init();
    this.reset();
  },
  reset: function () {
    this.running = false;

    this.cpu.reset();
    this.memory.reset();
    this.input.reset();
    this.gpu.reset();
    this.sound.reset();
    this.timer.reset();
    this.serial.reset();

    this.renderer.showInfo();
  },
  skipBios: function() {
    this.reset();
    this.cpu.r.a = 0x01
    this.cpu.r.fset();
    this.cpu.r.setBC(0x0013);
    this.cpu.r.setDE(0x00D8);
    this.cpu.r.setHL(0x014D);
    this.cpu.r.sp = 0xFFFE;
    this.cpu.r.pc = 0x0100;
    this.memory.write(0xFF05, 0x00);
    this.memory.write(0xFF06, 0x00);
    this.memory.write(0xFF07, 0x00);
    this.memory.write(0xFF10, 0x80);
    this.memory.write(0xFF11, 0xBF);
    this.memory.write(0xFF12, 0xF3);
    this.memory.write(0xFF14, 0xBF);
    this.memory.write(0xFF16, 0x3F);
    this.memory.write(0xFF17, 0x00);
    this.memory.write(0xFF19, 0xBF);
    this.memory.write(0xFF1A, 0x7F);
    this.memory.write(0xFF1B, 0xFF);
    this.memory.write(0xFF1C, 0x9F);
    this.memory.write(0xFF1E, 0xBF);
    this.memory.write(0xFF20, 0xFF);
    this.memory.write(0xFF21, 0x00);
    this.memory.write(0xFF22, 0x00);
    this.memory.write(0xFF23, 0xBF);
    this.memory.write(0xFF24, 0x77);
    this.memory.write(0xFF25, 0xF3);
    this.memory.write(0xFF26, 0xF1);
    this.memory.write(0xFF40, 0x91);
    this.memory.write(0xFF42, 0x00);
    this.memory.write(0xFF43, 0x00);
    this.memory.write(0xFF45, 0x00);
    this.memory.write(0xFF47, 0xFC);
    this.memory.write(0xFF48, 0xFF);
    this.memory.write(0xFF49, 0xFF);
    this.memory.write(0xFF50, 0x01); //Disable boot rom
    this.memory.write(0xFF4A, 0x00);
    this.memory.write(0xFF4B, 0x00);
    this.memory.write(0xFFFF, 0x00);

    this.renderer.showInfo();
  },
  frame: function () {
    this.requestNextFrame();
    var t0 = new Date();

    var fclock = this.cpu.cycles + (70224); // One frame, at 60Hz. One full VBLANK as well :)

    do {
      this.cpu.step(); //CPU handles interrupt checking, halt cycles, and stop cycles.
      this.gpu.step();
      this.timer.step();
      this.sound.step();
    } while (this.cpu.cycles < fclock);

    var t1 = new Date();
    document.getElementById("fps").textContent = Math.round(10000/(t1-t0))/10;
    //this.renderer.showInfo();
  },
  step: function () {
    this.cpu.step();
    this.gpu.step();
    this.timer.step();
    this.sound.step();
    this.renderer.showInfo();
  },
  requestNextFrame: function () {
    if (this.running) {
      requestAnimationFrame(this.frame.bind(this));
    }
  },
  run: function () {
    this.running = true;
    this.frame();
  },
  stop: function () {
    this.running = false;
  }
};

function fakeRequestAnimationFrame(callback) {
  setTimeout(callback, 1000 / 60);
}
window.requestAnimationFrame = !!window.requestAnimationFrame ? window.requestAnimationFrame : (!!window.mozRequestAnimationFrame ? window.mozRequestAnimationFrame : (!!window.wekbitRequestAnimationFrame ? window.webkitRequestAnimationFrame : fakeRequestAnimationFrame));