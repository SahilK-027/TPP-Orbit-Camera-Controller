import EventEmitter from './EventEmitter.class';

export default class Sizes extends EventEmitter {
  constructor() {
    super();
    /**
     * Sizes configurations
     */
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);

    let timeOut = null;

    window.addEventListener('resize', () => {
      // Resize event
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.pixelRatio = Math.min(window.devicePixelRatio, 2);
      this.trigger('resize');

      // Throttled resize
      if (timeOut) {
        clearTimeout(timeOut);
      }
      timeOut = setTimeout(() => {
        this.trigger('throttledResize');
      }, 400);
    });
  }
}
