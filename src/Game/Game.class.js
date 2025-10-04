import * as THREE from 'three';
import Sizes from './Utils/Sizes.class';
import Time from './Utils/Time.class';
import Camera from './Core/Camera.class';
import Renderer from './Core/Renderer.class';
import World from './Scenes/WorldScene/World.scene';
import DebugGUI from './Utils/DebugGUI';
import InputManager from './Input/InputManager.class';
import UIController from './UI/UIController.class';

export default class Game {
  constructor(canvas, resources, isDebugMode) {
    /**
     * Singleton
     */
    if (Game.instance) {
      return Game.instance;
    }
    Game.instance = this;

    /**
     * Debug handler
     */
    this.isDebugMode = isDebugMode;
    if (this.isDebugMode) {
      this.debug = new DebugGUI();
    }

    /**
     * WebGL essential components
     */
    this.canvas = canvas;
    this.sizes = new Sizes();
    this.time = new Time();
    this.scene = new THREE.Scene();
    this.camera = new Camera();
    this.renderer = new Renderer();

    /**
     * Game configurations
     */
    this.resources = resources;
    this.inputManager = new InputManager();
    this.inputManager.initialize();
    this.world = new World();
    this.uiController = new UIController();

    /**
     * Event handlers
     */
    this.time.on('animate', () => {
      this.update();
    });
    this.sizes.on('resize', () => {
      this.resize();
    });
    this.sizes.on('throttledResize', () => {
      this.throttledResize();
    });
  }

  static getInstance() {
    if (!Game.instance) {
      throw new Error(
        `Game.getInstance() called before Game was constructed.
        Call new Game(canvas, resources, isDebugMode) first.`
      );
    }
    return Game.instance;
  }

  resize() {
    this.camera.resize();
    this.renderer.resize();
  }

  throttledResize() {
    if (this.isDebugMode) {
      console.log('Throttled resize triggered');
    }
  }

  update() {
    this.camera.update();
    this.world.update();
    this.renderer.update();
    this.uiController.update();
  }

  destroy() {
    this.sizes.off('resize');
    this.time.off('animate');

    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();

        for (const key in child.material) {
          const value = child.material[key];

          if (typeof value?.dispose === 'function') {
            value.dispose();
          }
        }
      }
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const mats = Array.isArray(child.material)
          ? child.material
          : [child.material];
        mats.forEach((m) => {
          for (const key in m) {
            const prop = m[key];
            if (prop && prop.isTexture) prop.dispose();
          }
          m.dispose();
        });
      }
    });

    this.camera.controls.dispose();
    this.renderer.rendererInstance.dispose();
    this.debug.gui.destroy();

    this.canvas = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.world = null;
    this.debug = null;
  }
}
