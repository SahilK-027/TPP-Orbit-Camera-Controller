export default class InputManager {
  constructor(game) {
    /**
     * Input manager configurations
     */
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      jump: false,
    };
    this.mapping = {
      87: 'forward', // W
      83: 'backward', // S
      65: 'left', // A
      68: 'right', // D
      32: 'jump', // Space
      16: 'sprint', // Shift
      38: 'forward', // Arrow Up
      40: 'backward', // Arrow Down
      37: 'left', // Arrow Left
      39: 'right', // Arrow Right
    };
    this.game = game;
  }

  initialize() {
    window.addEventListener('keydown', (e) => {
      this.onKeyDown(e);
    });
    window.addEventListener('keyup', (e) => {
      this.onKeyUp(e);
    });
  }

  onKeyDown(e) {
    this.onKey(e, true);
  }

  onKeyUp(e) {
    this.onKey(e, false);
  }

  onKey(e, bool) {
    const mapped = this.mapping[e.keyCode];
    if (mapped) {
      e.preventDefault();
      this.keys[mapped] = bool;
    }
  }

  consumeJump() {
    this.keys.jump = false;
  }

  get Actions() {
    return this.keys;
  }
}
