import * as THREE from 'three';
import Game from '../../../../Game.class';

export default class Lighting {
  constructor({ helperEnabled = false } = {}) {
    /**
     * Game references
     */
    this.game = Game.getInstance();
    this.scene = this.game.scene;
    this.resources = this.game.resources;

    /**
     * Lighting configurations
     */
    this.helperEnabled = helperEnabled;
    this.debug = this.game.debug;
    this.isDebugMode = this.game.isDebugMode;
    this.originalKeyOffset = new THREE.Vector3(1.75, 1.5, 1.5);
    this.originalFillOffset = new THREE.Vector3(-1.75, 1.5, 1.5);

    this.setThreeDirectionalLights();
    this.setEnvironmentMapInstance();

    if (this.isDebugMode) {
      this.initGUI();
    }
  }

  setThreeDirectionalLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    this.scene.add(this.ambientLight);
    /**
     * Key sun light (Casts shadows)
     */
    this.keyLight = new THREE.DirectionalLight(0xffffff, 4, 0, 2);
    this.keyLight.name = 'keyLight';
    this.keyLight.userData.lightType = 'key';
    this.keyLight.position.copy(this.originalKeyOffset);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.bias = 0.00005;
    this.keyLight.shadow.normalBias = 0.03;
    this.scene.add(this.keyLight);
    this.keyLightTarget = new THREE.Object3D();
    this.keyLightTarget.position.copy(this.originalKeyOffset);
    this.scene.add(this.keyLightTarget);

    /**
     * Fill light (No shadows)
     */
    this.fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.fillLight.name = 'fillLight';
    this.fillLight.userData.lightType = 'fill';
    this.fillLight.position.copy(this.originalFillOffset);
    this.fillLight.castShadow = false;
    this.scene.add(this.fillLight);

    if (this.helperEnabled) {
      this.shadowHelper = new THREE.CameraHelper(this.keyLight.shadow.camera);
      this.scene.add(this.shadowHelper);
      this.scene.add(new THREE.DirectionalLightHelper(this.keyLight, 0.5));
      this.scene.add(new THREE.DirectionalLightHelper(this.fillLight, 0.5));
    }
  }

  setEnvironmentMapInstance() {
    this.environmentMap = {
      intensity: 1.0,
      texture: this.resources.items.environmentMapTexture,
      updateMaterials: () => {
        this.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // PBR Materials: MeshStandardMaterial, MeshPhysicalMaterial (These Support envMap)
            if (
              child.material instanceof THREE.MeshStandardMaterial ||
              child.material instanceof THREE.MeshPhysicalMaterial
            ) {
              child.material.envMap = this.environmentMap.texture;
              child.material.envMapIntensity = this.environmentMap.intensity;
              child.material.needsUpdate = true;
            }
            // Non-PBR Materials: MeshPhongMaterial, MeshBasicMaterial (These don't support envMap)
            else if (
              child.material instanceof THREE.MeshPhongMaterial ||
              child.material instanceof THREE.MeshBasicMaterial
            ) {
              child.material.envMap = this.environmentMap.texture;
              child.material.reflectivity = 0.9;
              child.material.needsUpdate = true;
            }
          }
        });
      },
    };

    this.environmentMap.texture.colorSpace = THREE.SRGBColorSpace;
    this.scene.environment = this.environmentMap.texture;
    this.scene.background = this.environmentMap.texture;
    this.scene.environmentIntensity = 1.0;
    this.environmentMap.updateMaterials();
  }

  update() {
    const player = this.game.world.player.player;
    if (!player) return;

    this.keyLight.position.copy(player.position).add(this.originalKeyOffset);
    this.keyLight.target.position.copy(player.position);
    this.keyLight.target.updateMatrixWorld();

    this.fillLight.position.copy(player.position).add(this.originalFillOffset);
  }

  initGUI() {
    this.debug.addFolder('Lighting').close();
    this.debug.add(
      this.keyLight,
      'intensity',
      {
        min: 0,
        max: 10,
        step: 0.01,
        label: 'Key Light Intensity',
      },
      'Lighting'
    );
    this.debug.add(
      this.fillLight,
      'intensity',
      {
        min: 0,
        max: 10,
        step: 0.01,
        label: 'Fill Light Intensity',
      },
      'Lighting'
    );
    this.debug.add(
      this.ambientLight,
      'intensity',
      {
        min: 0,
        max: 10,
        step: 0.01,
        label: 'Ambient Light Intensity',
      },
      'Lighting'
    );
    this.debug.add(
      this.keyLight,
      'position',
      {
        x: 0,
        y: 0,
        z: 0,
        step: 0.01,
      },
      'Lighting'
    );
    this.debug.add(
      this.fillLight,
      'position',
      {
        x: 0,
        y: 0,
        z: 0,
      },
      'Lighting'
    );
    this.debug.add(
      this.keyLight,
      'castShadow',
      {
        label: 'Cast Shadow',
      },
      'Lighting'
    );
    this.debug.add(
      this.keyLight.shadow,
      'bias',
      {
        label: 'Shadow Bias',
        min: -0.0001,
        max: 0.0001,
        step: 0.00001,
      },
      'Lighting'
    );
    this.debug.add(
      this.keyLight.shadow,
      'normalBias',
      {
        label: 'Shadow Normal Bias',
        min: 0,
        max: 0.1,
        step: 0.01,
      },
      'Lighting'
    );
  }
}
