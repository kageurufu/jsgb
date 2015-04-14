(function (GameBoy) {
  var Input = function (gb) {
    this.gb = gb;

    // We want everything, Gamepad support, Keyboard support
    // I'm going to start with gamepads, cause I'm awesome
    //  (and a little bit crazy). I'm using a hacked on shim from
    // http://www.html5rocks.com/en/tutorials/doodles/gamepad/gamepad-tester/gamepad.js

    this.pressed = {};
    this._column = 0;
    this._columns = [0x0F, 0x0F];

    //gamepadSupport.init(this);
  };

  Input.prototype = {
    reset: function () {
      if (!this._registered) {
        this.register(this.gb.canvas);
      }
    },

    register: function (element) {
      var input = this;
      //Add our event handlers here.
      element.onkeydown = function (event) {
        event.preventDefault();
        input.keydown(event);
        return false;
      };
      element.onkeyup = function (event) {
        event.preventDefault();
        input.keyup(event);
        return false;
      };

      this._registered = true;
    },
    gamepadTick: function () {
      if (this.gamepad) {
        // TODO: Clean this up
        if (this.gamepad.buttons[Input.MAPPING.GAMEPAD.DOWN].value)
          this._columns[0] &= Input.COLMOD.PRESSED.DOWN;
        else
          this._columns[0] |= Input.COLMOD.RELEASED.DOWN;

        if (this.gamepad.buttons[Input.MAPPING.GAMEPAD.UP].value)
          this._columns[0] &= Input.COLMOD.PRESSED.UP;
        else
          this._columns[0] |= Input.COLMOD.RELEASED.UP;

        if (this.gamepad.buttons[Input.MAPPING.GAMEPAD.LEFT].value)
          this._columns[0] &= Input.COLMOD.PRESSED.LEFT;
        else
          this._columns[0] |= Input.COLMOD.RELEASED.LEFT;

        if (this.gamepad.buttons[Input.MAPPING.GAMEPAD.RIGHT].value)
          this._columns[0] &= Input.COLMOD.PRESSED.RIGHT;
        else
          this._columns[0] |= Input.COLMOD.RELEASED.RIGHT;

        if (this.gamepad.buttons[Input.MAPPING.GAMEPAD.A].value)
          this._columns[1] &= Input.COLMOD.PRESSED.A;
        else
          this._columns[1] |= Input.COLMOD.RELEASED.A;

        if (this.gamepad.buttons[Input.MAPPING.GAMEPAD.B].value)
          this._columns[1] &= Input.COLMOD.PRESSED.B;
        else
          this._columns[1] |= Input.COLMOD.RELEASED.B;

        if (this.gamepad.buttons[Input.MAPPING.GAMEPAD.SELECT].value)
          this._columns[1] &= Input.COLMOD.PRESSED.SELECT;
        else
          this._columns[1] |= Input.COLMOD.RELEASED.SELECT;

        if (this.gamepad.buttons[Input.MAPPING.GAMEPAD.START].value)
          this._columns[1] &= Input.COLMOD.PRESSED.START;
        else
          this._columns[1] |= Input.COLMOD.RELEASED.START;

        //console.log(GameBoy.toBin(this._columns[0], 4), GameBoy.toBin(this._columns[1], 4));
      }
    },
    keydown: function (event) {
      switch (event.keyCode) {
        //Column 1
        case Input.MAPPING.KEYBOARD.DOWN:
          this._columns[0] &= Input.COLMOD.PRESSED.DOWN;
          break;
        case Input.MAPPING.KEYBOARD.UP:
          this._columns[0] &= Input.COLMOD.PRESSED.UP;
          break;
        case Input.MAPPING.KEYBOARD.LEFT:
          this._columns[0] &= Input.COLMOD.PRESSED.LEFT;
          break;
        case Input.MAPPING.KEYBOARD.RIGHT:
          this._columns[0] &= Input.COLMOD.PRESSED.RIGHT;
          break;
        //Column 0
        case Input.MAPPING.KEYBOARD.A:
          this._columns[1] &= Input.COLMOD.PRESSED.A;
          break;
        case Input.MAPPING.KEYBOARD.B:
          this._columns[1] &= Input.COLMOD.PRESSED.B;
          break;
        case Input.MAPPING.KEYBOARD.SELECT:
          this._columns[1] &= Input.COLMOD.PRESSED.SELECT;
          break;
        case Input.MAPPING.KEYBOARD.START:
          this._columns[1] &= Input.COLMOD.PRESSED.START;
          break;
      }
      //console.log(GameBoy.toBin(this._columns[0], 4), GameBoy.toBin(this._columns[1], 4));
    },
    keyup: function (event) {
      switch (event.keyCode) {
        //Column 1
        case Input.MAPPING.KEYBOARD.DOWN:
          this._columns[0] |= Input.COLMOD.RELEASED.DOWN;
          break;
        case Input.MAPPING.KEYBOARD.UP:
          this._columns[0] |= Input.COLMOD.RELEASED.UP;
          break;
        case Input.MAPPING.KEYBOARD.LEFT:
          this._columns[0] |= Input.COLMOD.RELEASED.LEFT;
          break;
        case Input.MAPPING.KEYBOARD.RIGHT:
          this._columns[0] |= Input.COLMOD.RELEASED.RIGHT;
          break;
        //Column 0
        case Input.MAPPING.KEYBOARD.A:
          this._columns[1] |= Input.COLMOD.RELEASED.A;
          break;
        case Input.MAPPING.KEYBOARD.B:
          this._columns[1] |= Input.COLMOD.RELEASED.B;
          break;
        case Input.MAPPING.KEYBOARD.SELECT:
          this._columns[1] |= Input.COLMOD.RELEASED.SELECT;
          break;
        case Input.MAPPING.KEYBOARD.START:
          this._columns[1] |= Input.COLMOD.RELEASED.START;
          break;
      }
      //console.log(GameBoy.toBin(this._columns[0], 4), GameBoy.toBin(this._columns[1], 4));
    },
    updateGamepads: function (g) {
      if (g.length) {
        this.gamepad = g[0];
      }
    },
    write: function (addr, val) {
      this._column = val & 0x30;
    },
    read: function (addr, val) {
      switch (this._column) {
        case 0x10:
          return this._columns[0];
        case 0x20:
          return this._columns[1];
        case 0x00:
        default:
          return 0x00;
      }
    }
  };

  Input.COLMOD = {
    RELEASED: {
      DOWN: 0x1,
      UP: 0x2,
      LEFT: 0x4,
      RIGHT: 0x8,
      A: 0x1,
      B: 0x2,
      SELECT: 0x4,
      START: 0x8
    },
    PRESSED: {
      DOWN: 0xE,
      UP: 0xD,
      LEFT: 0xB,
      RIGHT: 0x7,
      A: 0xE,
      B: 0xD,
      SELECT: 0xB,
      START: 0x7
    }
  };

  Input.MAPPING = {
    KEYBOARD: {
      DOWN: 40,
      UP: 38,
      LEFT: 37,
      RIGHT: 39,
      A: 88,
      B: 90,
      START: 13,
      SELECT: 16
    },
    GAMEPAD: {
      DOWN: 13,
      UP: 12,
      LEFT: 14,
      RIGHT: 15,
      A: 1,
      B: 0,
      START: 9,
      SELECT: 8
    }
  };

  function findGetGamepads() {
    if (navigator.getGamepads) {
      return navigator.getGamepads;
    }
    if (navigator.webkitGetGamepads) {
      return navigator.webkitGetGamepads;
    }
  }


  var gamepadSupport = {
    // A number of typical buttons recognized by Gamepad API and mapped to
    // standard controls. Any extraneous buttons will have larger indexes.
    TYPICAL_BUTTON_COUNT: 16,

    // A number of typical axes recognized by Gamepad API and mapped to
    // standard controls. Any extraneous buttons will have larger indexes.
    TYPICAL_AXIS_COUNT: 4,

    // Whether we’re requestAnimationFrameing like it’s 1999.
    ticking: false,

    // The canonical list of attached gamepads, without “holes” (always
    // starting at [0]) and unified between Firefox and Chrome.
    gamepads: [],

    // Remembers the connected gamepads at the last check; used in Chrome
    // to figure out when gamepads get connected or disconnected, since no
    // events are fired.
    prevRawGamepadTypes: [],

    // Previous timestamps for gamepad state; used in Chrome to not bother with
    // analyzing the polled data if nothing changed (timestamp is the same
    // as last time).
    prevTimestamps: [],

    /**
     * Initialize support for Gamepad API.
     */
    init: function (handler) {
      var gamepadSupportAvailable = navigator.getGamepads || !!navigator.webkitGetGamepads || !!navigator.webkitGamepads;
      gamepadSupport.handler = handler;

      if (!gamepadSupportAvailable) {
        // It doesn’t seem Gamepad API is available – show a message telling
        // the visitor about it.
      } else {
        // Check and see if gamepadconnected/gamepaddisconnected is supported.
        // If so, listen for those events and don't start polling until a gamepad
        // has been connected.
        if ('ongamepadconnected' in window) {
          window.addEventListener('gamepadconnected',
              gamepadSupport.onGamepadConnect, false);
          window.addEventListener('gamepaddisconnected',
              gamepadSupport.onGamepadDisconnect, false);
        } else {
          // If connection events are not supported just start polling
          gamepadSupport.startPolling();
        }
      }
    },

    /**
     * React to the gamepad being connected.
     */
    onGamepadConnect: function (event) {
      // Add the new gamepad on the list of gamepads to look after.
      gamepadSupport.gamepads.push(event.gamepad);

      // Ask the tester to update the screen to show more gamepads.
      gamepadSupport.handler.updateGamepads(gamepadSupport.gamepads);

      // Start the polling loop to monitor button changes.
      gamepadSupport.startPolling();
    },

    /**
     * React to the gamepad being disconnected.
     */
    onGamepadDisconnect: function (event) {
      // Remove the gamepad from the list of gamepads to monitor.
      for (var i in gamepadSupport.gamepads) {
        if (gamepadSupport.gamepads[i].index == event.gamepad.index) {
          gamepadSupport.gamepads.splice(i, 1);
          break;
        }
      }

      // If no gamepads are left, stop the polling loop.
      if (gamepadSupport.gamepads.length == 0) {
        gamepadSupport.stopPolling();
      }

      // Ask the tester to update the screen to remove the gamepad.
      gamepadSupport.handler.updateGamepads(gamepadSupport.gamepads);
    },

    /**
     * Starts a polling loop to check for gamepad state.
     */
    startPolling: function () {
      // Don’t accidentally start a second loop, man.
      if (!gamepadSupport.ticking) {
        gamepadSupport.ticking = true;
        gamepadSupport.tick();
      }
    },

    /**
     * Stops a polling loop by setting a flag which will prevent the next
     * requestAnimationFrame() from being scheduled.
     */
    stopPolling: function () {
      gamepadSupport.ticking = false;
    },

    /**
     * A function called with each requestAnimationFrame(). Polls the gamepad
     * status and schedules another poll.
     */
    tick: function () {
      gamepadSupport.pollStatus();
      gamepadSupport.handler.gamepadTick();
      gamepadSupport.scheduleNextTick();
    },

    scheduleNextTick: function () {
      // Only schedule the next frame if we haven’t decided to stop via
      // stopPolling() before.
      if (gamepadSupport.ticking) {
        if (window.requestAnimationFrame) {
          window.requestAnimationFrame(gamepadSupport.tick);
        } else if (window.mozRequestAnimationFrame) {
          window.mozRequestAnimationFrame(gamepadSupport.tick);
        } else if (window.webkitRequestAnimationFrame) {
          window.webkitRequestAnimationFrame(gamepadSupport.tick);
        }
        // Note lack of setTimeout since all the browsers that support
        // Gamepad API are already supporting requestAnimationFrame().
      }
    },

    /**
     * Checks for the gamepad status. Monitors the necessary data and notices
     * the differences from previous state (buttons for Chrome/Firefox,
     * new connects/disconnects for Chrome). If differences are noticed, asks
     * to update the display accordingly. Should run as close to 60 frames per
     * second as possible.
     */
    pollStatus: function () {
      // Poll to see if gamepads are connected or disconnected. Necessary
      // only on Chrome.
      gamepadSupport.pollGamepads();

      for (var i in gamepadSupport.gamepads) {
        var gamepad = gamepadSupport.gamepads[i];

        // Don’t do anything if the current timestamp is the same as previous
        // one, which means that the state of the gamepad hasn’t changed.
        // This is only supported by Chrome right now, so the first check
        // makes sure we’re not doing anything if the timestamps are empty
        // or undefined.
        if (gamepad.timestamp &&
            (gamepad.timestamp == gamepadSupport.prevTimestamps[i])) {
          continue;
        }
        gamepadSupport.prevTimestamps[i] = gamepad.timestamp;

      }
    },

    // This function is called only on Chrome, which does not yet support
    // connection/disconnection events, but requires you to monitor
    // an array for changes.
    pollGamepads: function () {
      // Get the array of gamepads – the first method (getGamepads)
      // is the most modern one and is supported by Firefox 28+ and
      // Chrome 35+. The second one (webkitGetGamepads) is a deprecated method
      // used by older Chrome builds.
      var rawGamepads =
          (navigator.getGamepads && navigator.getGamepads()) ||
          (navigator.webkitGetGamepads && navigator.webkitGetGamepads());

      if (rawGamepads) {
        // We don’t want to use rawGamepads coming straight from the browser,
        // since it can have “holes” (e.g. if you plug two gamepads, and then
        // unplug the first one, the remaining one will be at index [1]).
        gamepadSupport.gamepads = [];

        // We only refresh the display when we detect some gamepads are new
        // or removed; we do it by comparing raw gamepad table entries to
        // “undefined.”
        var gamepadsChanged = false;

        for (var i = 0; i < rawGamepads.length; i++) {
          if (typeof rawGamepads[i] != gamepadSupport.prevRawGamepadTypes[i]) {
            gamepadsChanged = true;
            gamepadSupport.prevRawGamepadTypes[i] = typeof rawGamepads[i];
          }

          if (rawGamepads[i]) {
            gamepadSupport.gamepads.push(rawGamepads[i]);
          }
        }

        // Ask the tester to refresh the visual representations of gamepads
        // on the screen.
        if (gamepadsChanged) {
          gamepadSupport.handler.updateGamepads(gamepadSupport.gamepads);
        }
      }
    }
  };

  GameBoy.Input = Input;
})(GameBoy);