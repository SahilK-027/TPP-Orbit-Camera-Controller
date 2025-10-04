import * as THREE from 'three';
import Game from '../Game.class';
import PerformanceMonitor from '../Utils/PerformanceMonitor';

export default class Renderer {
  constructor() {
    /**
     * Game references
     */
    this.game = Game.getInstance();
    this.canvas = this.game.canvas;
    this.sizes = this.game.sizes;
    this.scene = this.game.scene;
    this.camera = this.game.camera;
    this.renderer = this.game.renderer;
    this.isDebugMode = this.game.isDebugMode;
    this.debug = this.game.debug;

    this.setRendererInstance();

    if (this.isDebugMode) {
      this.initGUI();
    }
  }

  setRendererInstance() {
    this.toneMappingOptions = {
      NoToneMapping: THREE.NoToneMapping,
      LinearToneMapping: THREE.LinearToneMapping,
      ReinhardToneMapping: THREE.ReinhardToneMapping,
      CineonToneMapping: THREE.CineonToneMapping,
      ACESFilmicToneMapping: THREE.ACESFilmicToneMapping,
      AgXToneMapping: THREE.AgXToneMapping,
      NeutralToneMapping: THREE.NeutralToneMapping,
    };

    this.rendererInstance = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });

    this.rendererInstance.toneMapping = THREE.NeutralToneMapping;
    this.rendererInstance.toneMappingExposure = 1.75;
    this.rendererInstance.shadowMap.enabled = true;
    this.rendererInstance.shadowMap.type = THREE.PCFSoftShadowMap;
    this.rendererInstance.setSize(this.sizes.width, this.sizes.height);
    this.rendererInstance.setPixelRatio(this.sizes.pixelRatio);

    if (this.isDebugMode) {
      this.setUpPerformanceMonitor();
    }
  }

  setUpPerformanceMonitor() {
    this.perf = new PerformanceMonitor(this.rendererInstance);
  }

  resize() {
    this.rendererInstance.setSize(this.sizes.width, this.sizes.height);
    this.rendererInstance.setPixelRatio(this.sizes.pixelRatio);
  }

  update() {
    if (this.isDebugMode) {
      this.perf.beginFrame();
    }

    this.rendererInstance.render(this.scene, this.camera.cameraInstance);

    if (this.isDebugMode) {
      this.perf.endFrame();
    }
  }

  initGUI() {
    this.debug.add(
      this.rendererInstance,
      'toneMapping',
      {
        options: this.toneMappingOptions,
        label: 'Tone Mapping',
        onChange: (toneMappingType) => {
          this.rendererInstance.toneMapping = toneMappingType;
        },
      },
      'Renderer'
    );
  }
}
