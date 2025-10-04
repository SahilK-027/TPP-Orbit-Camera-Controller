import * as THREE from 'three';
import Game from '../Game.class';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Camera Management System
 *
 * Provides two camera modes for gameplay:
 * - TPP (Third Person Perspective): Fixed camera behind player character
 * - Orbit: Free-look camera that can orbit around the player
 */
export default class Camera {
  constructor(fov = 65, near = 0.1, far = 1000) {
    /**
     * Game references
     */
    this.game = Game.getInstance();
    this.canvas = this.game.canvas;
    this.sizes = this.game.sizes;
    this.scene = this.game.scene;
    this.isDebugMode = this.game.isDebugMode;

    /**
     * Camera configurations
     */
    this.mode = 'orbit'; // Default to Orbit mode
    this.targetMode = this.mode;
    this.isTransitioning = false;
    this.transitionProgress = 0;
    this.transitionSpeed = 0.7;

    this.transitionStartPosition = new THREE.Vector3();
    this.transitionStartLookAt = new THREE.Vector3();
    this.transitionTargetPosition = new THREE.Vector3();
    this.transitionTargetLookAt = new THREE.Vector3();
    this.tppCameraPosition = new THREE.Vector3();
    this.tppLookAtOffset = new THREE.Vector3(0, 1.2, 0);
    this.tppOffset = new THREE.Vector3(0, 1.6, -3.0);

    this.followLerpSpeed = 3.5;
    this.lookAtLerpSpeed = 8.0;

    this.setPerspectiveCameraInstance(fov, near, far);
    this.setOrbitControls();

    if (this.isDebugMode) {
      this.initGUI();
    }
  }

  setMode(mode) {
    const newMode = mode === 'tpp' ? 'tpp' : 'orbit';

    if (newMode === this.mode && !this.isTransitioning) {
      return;
    }

    this.targetMode = newMode;
    this.isTransitioning = true;
    this.transitionProgress = 0;

    this.transitionStartPosition.copy(this.cameraInstance.position);
    const dir = new THREE.Vector3();
    this.cameraInstance.getWorldDirection(dir);
    this.transitionStartLookAt
      .copy(this.cameraInstance.position)
      .add(dir.multiplyScalar(10));

    this.calculateTransitionTarget();
  }

  calculateTransitionTarget() {
    const world = this.game.world;
    const player =
      world && world.player && world.player.player ? world.player.player : null;

    if (!player) {
      this.mode = this.targetMode;
      this.isTransitioning = false;
      if (this.controls) this.controls.enabled = this.mode === 'orbit';
      return;
    }

    // Transitioning to TPP: Position camera behind player
    if (this.targetMode === 'tpp') {
      this.transitionTargetPosition.copy(
        this.calculateIdealTppCameraPosition(player)
      );
      this.transitionTargetLookAt.copy(this.calculateIdealCameraLookAt(player));
    }
    // Transitioning to Orbit: Position camera around player
    else {
      const targetPosition = this.calculateIdealCameraLookAt(player);
      this.controls.target.copy(targetPosition);
      this.transitionTargetLookAt.copy(targetPosition);

      const dx = this.cameraInstance.position.x - player.position.x;
      const dz = this.cameraInstance.position.z - player.position.z;
      const angle = Math.atan2(dz, dx);
      const distance = 3.0;
      this.transitionTargetPosition.set(
        player.position.x + Math.cos(angle) * distance,
        player.position.y + 1.6,
        player.position.z + Math.sin(angle) * distance
      );
    }
  }

  updateTransition(deltaTime) {
    if (!this.isTransitioning) return;

    this.transitionProgress += this.transitionSpeed * deltaTime;

    if (this.transitionProgress >= 1.0) {
      this.transitionProgress = 1.0;
      this.mode = this.targetMode;
      this.isTransitioning = false;

      if (this.controls) {
        this.controls.enabled = this.mode === 'orbit';
        if (this.mode === 'orbit') {
          this.cameraInstance.position.copy(this.transitionTargetPosition);
        }
      }
    }

    const t = this.easeInOutCubic(this.transitionProgress);

    this.cameraInstance.position.lerpVectors(
      this.transitionStartPosition,
      this.transitionTargetPosition,
      t
    );

    const currentLookAt = this.transitionStartLookAt
      .clone()
      .lerp(this.transitionTargetLookAt, t);
    this.cameraInstance.lookAt(currentLookAt);
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  setPerspectiveCameraInstance(fov, near, far) {
    const aspectRatio = this.sizes.width / this.sizes.height;
    this.cameraInstance = new THREE.PerspectiveCamera(
      fov,
      aspectRatio,
      near,
      far
    );
    this.cameraInstance.position.set(0.15, 1.25, 3.5);
    this.scene.add(this.cameraInstance);
  }

  setOrbitControls() {
    this.controls = new OrbitControls(this.cameraInstance, this.canvas);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.maxPolarAngle = Math.PI / 1.6;
    this.controls.enabled = this.mode === 'orbit';
    this.controls.minDistance = 2;
    this.controls.maxDistance = 3;
  }

  resize() {
    const aspectRatio = this.sizes.width / this.sizes.height;
    this.cameraInstance.aspect = aspectRatio;
    this.cameraInstance.updateProjectionMatrix();
  }

  calculateIdealTppCameraPosition(player) {
    const idealTppCameraPosition = this.tppOffset.clone();
    idealTppCameraPosition.applyQuaternion(player.quaternion);
    idealTppCameraPosition.add(player.position);
    return idealTppCameraPosition;
  }

  calculateIdealCameraLookAt(player) {
    const idealCameraLookAt = new THREE.Vector3(0, 1.2, 0);
    idealCameraLookAt.applyQuaternion(player.quaternion);
    idealCameraLookAt.add(player.position);
    return idealCameraLookAt;
  }

  frameIndependentLerp(current, target, speed, deltaTime) {
    const clampedDelta = Math.min(deltaTime, 0.1);

    const lerpFactor = 1 - Math.exp(-speed * clampedDelta);

    return current.lerp(target, lerpFactor);
  }

  update() {
    const world = this.game.world;
    const player =
      world && world.player && world.player.player ? world.player.player : null;

    if (this.isTransitioning) {
      this.updateTransition(this.game.time.delta);
      return;
    }

    /**
     * Orbit mode update
     */
    if (this.mode === 'orbit') {
      if (this.controls) {
        if (player) {
          const targetPosition = this.calculateIdealCameraLookAt(player);
          this.frameIndependentLerp(
            this.controls.target,
            targetPosition,
            this.followLerpSpeed,
            this.game.time.delta
          );
        }
        this.controls.update();
      }
      return;
    }

    /**
     * TPP mode update
     */
    if (!player) return;

    const idealTppCameraPosition = this.calculateIdealTppCameraPosition(player);
    const idealCameraLookAt = this.calculateIdealCameraLookAt(player);

    if (this.tppCameraPosition.length() === 0) {
      this.tppCameraPosition.copy(idealTppCameraPosition);
      this.tppLookAtOffset.copy(idealCameraLookAt);
    }

    this.frameIndependentLerp(
      this.tppCameraPosition,
      idealTppCameraPosition,
      this.followLerpSpeed,
      this.game.time.delta
    );

    this.frameIndependentLerp(
      this.tppLookAtOffset,
      idealCameraLookAt,
      this.lookAtLerpSpeed,
      this.game.time.delta
    );

    this.cameraInstance.position.copy(this.tppCameraPosition);
    this.cameraInstance.lookAt(this.tppLookAtOffset);
  }

  initGUI() {
    const cameraModeOptions = { 'Orbit mode': 'orbit', 'TPP mode': 'tpp' };

    const cameraFolder = this.game.debug.addFolder('Camera');

    cameraFolder
      .add(this, 'targetMode', cameraModeOptions)
      .name('Camera Mode')
      .onChange((value) => this.setMode(value));

    const transitionFolder = cameraFolder.addFolder('Transitions');
    transitionFolder
      .add(this, 'transitionSpeed', 0.1, 10, 0.1)
      .name('Transition Speed');

    const cameraInstanceFolder = cameraFolder.addFolder('Camera Instance');

    cameraInstanceFolder
      .add(this.cameraInstance, 'fov', 10, 120, 1)
      .name('Field of View')
      .onChange(() => this.cameraInstance.updateProjectionMatrix());

    cameraInstanceFolder
      .add(this.cameraInstance, 'near', 0.01, 10, 0.01)
      .name('Near Plane')
      .onChange(() => this.cameraInstance.updateProjectionMatrix());

    cameraInstanceFolder
      .add(this.cameraInstance, 'far', 100, 10000, 100)
      .name('Far Plane')
      .onChange(() => this.cameraInstance.updateProjectionMatrix());

    const tppFolder = cameraFolder.addFolder('TPP Settings');

    tppFolder.add(this.tppOffset, 'x', -10, 10, 0.1).name('Offset X');
    tppFolder.add(this.tppOffset, 'y', -5, 10, 0.1).name('Offset Y');
    tppFolder.add(this.tppOffset, 'z', -10, 5, 0.1).name('Offset Z');

    tppFolder.add(this, 'followLerpSpeed', 0.1, 20, 0.1).name('Follow Speed');
    tppFolder.add(this, 'lookAtLerpSpeed', 0.1, 20, 0.1).name('Look-At Speed');

    const tppLookAtFolder = tppFolder.addFolder('Look-At Offset');
    tppLookAtFolder
      .add(this.tppLookAtOffset, 'x', -5, 5, 0.1)
      .name('Look-At X');
    tppLookAtFolder
      .add(this.tppLookAtOffset, 'y', -5, 5, 0.1)
      .name('Look-At Y');
    tppLookAtFolder
      .add(this.tppLookAtOffset, 'z', -5, 5, 0.1)
      .name('Look-At Z');

    const orbitFolder = cameraFolder.addFolder('Orbit Controls');

    orbitFolder.add(this.controls, 'enableDamping').name('Enable Damping');
    orbitFolder
      .add(this.controls, 'dampingFactor', 0.01, 0.1, 0.001)
      .name('Damping Factor');

    orbitFolder
      .add(this.controls, 'minDistance', 0.5, 10, 0.1)
      .name('Min Distance');
    orbitFolder
      .add(this.controls, 'maxDistance', 1, 20, 0.1)
      .name('Max Distance');

    orbitFolder
      .add(this.controls, 'maxPolarAngle', 0, Math.PI, 0.01)
      .name('Max Polar Angle');
    orbitFolder
      .add(this.controls, 'minPolarAngle', 0, Math.PI, 0.01)
      .name('Min Polar Angle');

    orbitFolder
      .add(this.controls, 'maxAzimuthAngle', -Math.PI, Math.PI, 0.01)
      .name('Max Azimuth Angle');
    orbitFolder
      .add(this.controls, 'minAzimuthAngle', -Math.PI, Math.PI, 0.01)
      .name('Min Azimuth Angle');

    orbitFolder.add(this.controls, 'enableZoom').name('Enable Zoom');
    orbitFolder.add(this.controls, 'enableRotate').name('Enable Rotate');
    orbitFolder.add(this.controls, 'enablePan').name('Enable Pan');

    orbitFolder.add(this.controls, 'zoomSpeed', 0.1, 3, 0.1).name('Zoom Speed');
    orbitFolder
      .add(this.controls, 'rotateSpeed', 0.1, 3, 0.1)
      .name('Rotate Speed');
    orbitFolder.add(this.controls, 'panSpeed', 0.1, 3, 0.1).name('Pan Speed');

    orbitFolder.add(this.controls, 'autoRotate').name('Auto Rotate');
    orbitFolder
      .add(this.controls, 'autoRotateSpeed', 0.1, 10, 0.1)
      .name('Auto Rotate Speed');

    tppLookAtFolder.close();
    tppFolder.close();
    orbitFolder.close();
    cameraInstanceFolder.close();
    cameraFolder.close();
  }
}
