import * as THREE from 'three';
import Game from '../Game.class';

export default class Player {
  constructor() {
    /**
     * Game references
     */
    this.game = Game.getInstance();
    this.scene = this.game.scene;
    this.inputManager = this.game.inputManager;
    this.resources = this.game.resources;
    this.time = this.game.time;
    this.modelResource = this.resources.items.playerModel;

    /**
     * Player configurations
     */
    this.speed = 1.5;
    this.sprintMultiplier = 2;
    this.rotationSpeed = 1.5;
    this.velocity = new THREE.Vector3();
    this.currentState = 'idle';
    this.isJumping = false;

    this.up = new THREE.Vector3(0, 1, 0);
    this.forward = new THREE.Vector3(0, 0, -1);
    this.right = new THREE.Vector3(1, 0, 0);

    this.setModelInstance();
    this.setAnimation();

    this.debug = this.game.debug;
    this.isDebugMode = this.game.isDebugMode;
    if (this.isDebugMode) {
      this.initGUI();
    }
  }

  setModelInstance() {
    this.player = this.modelResource.scene;
    this.player.position.set(0, 0.0, 0);

    const gradientSteps = 3;
    const colors = new Uint8Array(gradientSteps);

    for (let i = 0; i < gradientSteps; i++) {
      colors[i] = Math.floor((i / (gradientSteps - 1)) * 255);
    }

    this.gradientTexture = new THREE.DataTexture(
      colors,
      gradientSteps,
      1,
      THREE.RedFormat
    );

    this.gradientTexture.magFilter = THREE.NearestFilter;
    this.gradientTexture.minFilter = THREE.NearestFilter;
    this.gradientTexture.needsUpdate = true;

    this.player.traverse((child) => {
      if (child.isMesh) {
        const texture = child.material.map;

        child.material = new THREE.MeshToonMaterial({
          map: texture,
          gradientMap: this.gradientTexture,
        });

        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.scene.add(this.player);
  }

  setAnimation() {
    this.animation = {};
    this.animation.mixer = new THREE.AnimationMixer(this.player);
    this.animation.actions = {};

    const animationMap = {
      idle: 0,
      jump_in_place: 1,
      jumping_while_move_backward: 2,
      jumping_while_move_forward: 3,
      run_backward: 4,
      run_forward: 5,
      walk_backward: 6,
      walk_forward: 7,
    };

    Object.keys(animationMap).forEach((key) => {
      const index = animationMap[key];
      if (this.modelResource.animations[index]) {
        this.animation.actions[key] = this.animation.mixer.clipAction(
          this.modelResource.animations[index]
        );

        if (key.includes('jump')) {
          this.animation.actions[key].setLoop(THREE.LoopOnce);
          this.animation.actions[key].clampWhenFinished = true;
        } else {
          this.animation.actions[key].setLoop(THREE.LoopRepeat);
        }
      }
    });

    this.animation.mixer.addEventListener('finished', (e) => {
      if (e.action.getClip().name.includes('jump')) {
        this.isJumping = false;
        this.inputManager.consumeJump();
      }
    });

    if (this.animation.actions.idle) {
      this.animation.actions.idle.play();
    }
  }

  changeAnimation(newState) {
    if (this.currentState === newState) return;

    const oldAction = this.animation.actions[this.currentState];
    const newAction = this.animation.actions[newState];

    if (!newAction) return;

    if (oldAction) {
      oldAction.fadeOut(0.2);
    }

    newAction.reset().fadeIn(0.2).play();
    this.currentState = newState;
  }

  determineAnimationState(actions) {
    if (this.isJumping) {
      if (actions.forward) {
        return 'jumping_while_move_forward';
      } else if (actions.backward) {
        return 'jumping_while_move_backward';
      } else {
        return 'jump_in_place';
      }
    }

    if (actions.forward) {
      return actions.sprint ? 'run_forward' : 'walk_forward';
    }

    if (actions.backward) {
      return actions.sprint ? 'run_backward' : 'walk_backward';
    }

    if (actions.left || actions.right) {
      if (
        this.currentState.includes('walk') ||
        this.currentState.includes('run')
      ) {
        return this.currentState;
      }
      return 'idle';
    }

    return 'idle';
  }

  playJumpAnimation(actions) {
    if (!this.isJumping) {
      this.isJumping = true;

      const currentAction = this.animation.actions[this.currentState];
      if (currentAction) {
        currentAction.fadeOut(0.1);
      }

      let jumpState = 'jump_in_place';
      if (actions.forward) {
        jumpState = 'jumping_while_move_forward';
      } else if (actions.backward) {
        jumpState = 'jumping_while_move_backward';
      }

      if (this.animation.actions[jumpState]) {
        this.animation.actions[jumpState].reset().fadeIn(0.1).play();
        this.currentState = jumpState;
      }
    }
  }

  updateCharacterMovement(actions) {
    this.velocity.set(0, 0, 0);

    const currentSpeed = actions.sprint
      ? this.speed * this.sprintMultiplier
      : this.speed;

    if (actions.forward) {
      this.velocity.z += currentSpeed * this.time.delta;
    }
    if (actions.backward) {
      this.velocity.z -= currentSpeed * this.time.delta;
    }

    let angle = 0;
    if (actions.left && (actions.forward || actions.backward)) {
      angle = this.rotationSpeed * this.time.delta;
      this.velocity.x -= currentSpeed * this.time.delta;
    }
    if (actions.right && (actions.forward || actions.backward)) {
      angle = -this.rotationSpeed * this.time.delta;
      this.velocity.x += currentSpeed * this.time.delta;
    }

    if (actions.jump && !this.isJumping) {
      this.playJumpAnimation(actions);
    }

    const newState = this.determineAnimationState(actions);
    this.changeAnimation(newState);

    this.velocity.applyQuaternion(this.player.quaternion);
    this.player.position.add(this.velocity);
    this.player.rotateY(angle);
  }

  update() {
    const actions = this.inputManager.Actions;
    this.updateCharacterMovement(actions);
    this.animation.mixer.update(this.time.delta);
  }

  initGUI() {
    this.debug.addFolder('Player (Link)').close();
    if (this.isDebugMode) {
      this.debug.add(
        this,
        'speed',
        {
          min: 0,
          max: 5,
          step: 0.1,
          label: 'Movement Speed',
        },
        'Player (Link)'
      );
      this.debug.add(
        this,
        'sprintMultiplier',
        {
          min: 1,
          max: 5,
          step: 0.1,
          label: 'Sprint Multiplier',
        },
        'Player (Link)'
      );
    }
  }
}
