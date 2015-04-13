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
  frame: function () {
    var fclock = this.cpu.cycles + 70224; // One frame, at 60Hz. One full VBLANK as well :)

    do {
      this.cpu.step(); //CPU handles interrupt checking, halt cycles, and stop cycles.
      this.gpu.step();
      this.timer.step();
      this.sound.step();
    } while (this.cpu.cycles < fclock);

    this.renderer.showInfo();
    this.requestNextFrame();
  },
  step: function () {
    this.cpu.step();
    this.gpu.step();
    this.timer.step();
    this.sound.step();
    this.renderer.showInfo();
  },
  requestNextFrame: function () {
    if (this.running && this.memory._romEnabled) {
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