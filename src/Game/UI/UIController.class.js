import Game from '../Game.class';

export default class UIController {
  constructor() {
    this.game = Game.getInstance();
    this.inputManager = this.game.inputManager;
    
    this.initializeCameraToggle();
    this.initializeMobileControls();
    this.initializeVirtualJoystick();
    this.initializeKeyboardVisualFeedback();
    this.updateCameraModeButtons();
  }

  initializeCameraToggle() {
    this.tppModeBtn = document.getElementById('tpp-mode-btn');
    this.orbitModeBtn = document.getElementById('orbit-mode-btn');
    
    // Add click listeners for both buttons
    if (this.tppModeBtn) {
      this.tppModeBtn.addEventListener('click', () => {
        this.setCameraMode('tpp');
      });
    }
    
    if (this.orbitModeBtn) {
      this.orbitModeBtn.addEventListener('click', () => {
        this.setCameraMode('orbit');
      });
    }
    
    // Add keyboard shortcut (C key)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyC' && !e.repeat) {
        this.toggleCameraMode();
      }
    });
  }

  initializeMobileControls() {
    this.mobileControls = document.getElementById('mobile-controls');
    this.controlButtons = document.querySelectorAll('.control-btn');
    
    // Track active touches for each button
    this.activeTouches = new Map();
    
    this.controlButtons.forEach(button => {
      const key = button.dataset.key;
      
      // Mouse events
      button.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.handleButtonPress(key, button, true);
      });
      
      button.addEventListener('mouseup', (e) => {
        e.preventDefault();
        this.handleButtonPress(key, button, false);
      });
      
      button.addEventListener('mouseleave', (e) => {
        e.preventDefault();
        this.handleButtonPress(key, button, false);
      });
      
      // Touch events for mobile
      button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        this.activeTouches.set(touch.identifier, { button, key });
        this.handleButtonPress(key, button, true);
      });
      
      button.addEventListener('touchend', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        if (this.activeTouches.has(touch.identifier)) {
          this.activeTouches.delete(touch.identifier);
          this.handleButtonPress(key, button, false);
        }
      });
      
      button.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        if (this.activeTouches.has(touch.identifier)) {
          this.activeTouches.delete(touch.identifier);
          this.handleButtonPress(key, button, false);
        }
      });
    });
    
    // Prevent context menu on long press
    this.mobileControls.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  handleButtonPress(key, button, isPressed) {
    // Update button visual state
    if (isPressed) {
      button.classList.add('pressed');
    } else {
      button.classList.remove('pressed');
    }
    
    // Simulate keyboard event for the input manager
    const keyEvent = {
      keyCode: this.getKeyCode(key),
      preventDefault: () => {}
    };
    
    if (isPressed) {
      this.inputManager.onKeyDown(keyEvent);
    } else {
      this.inputManager.onKeyUp(keyEvent);
    }
  }

  getKeyCode(key) {
    const keyCodeMap = {
      'KeyW': 87,
      'KeyA': 65,
      'KeyS': 83,
      'KeyD': 68,
      'Space': 32,
      'ShiftLeft': 16,
      'ShiftRight': 16
    };
    return keyCodeMap[key] || 0;
  }

  setCameraMode(mode) {
    if (this.game.camera.mode === mode && !this.game.camera.isTransitioning) {
      return; // Already in this mode
    }
    
    // Add transitioning animation to the target button
    const targetBtn = mode === 'tpp' ? this.tppModeBtn : this.orbitModeBtn;
    if (targetBtn) {
      targetBtn.classList.add('transitioning');
      setTimeout(() => {
        targetBtn.classList.remove('transitioning');
      }, 600);
    }
    
    this.game.camera.setMode(mode);
    this.updateCameraModeButtons();
  }

  toggleCameraMode() {
    const currentMode = this.game.camera.mode;
    const newMode = currentMode === 'tpp' ? 'orbit' : 'tpp';
    this.setCameraMode(newMode);
  }

  updateCameraModeButtons() {
    const currentMode = this.game.camera.mode;
    const isTransitioning = this.game.camera.isTransitioning;
    const targetMode = this.game.camera.targetMode;
    
    // Update button states
    if (this.tppModeBtn && this.orbitModeBtn) {
      // Remove active class from both
      this.tppModeBtn.classList.remove('active');
      this.orbitModeBtn.classList.remove('active');
      
      // Add active class to current mode (or target mode if transitioning)
      const activeMode = isTransitioning ? targetMode : currentMode;
      if (activeMode === 'tpp') {
        this.tppModeBtn.classList.add('active');
      } else {
        this.orbitModeBtn.classList.add('active');
      }
    }
  }

  update() {
    // Update camera mode buttons if transitioning
    if (this.game.camera.isTransitioning) {
      this.updateCameraModeButtons();
    }
  }

  // Show/hide mobile controls based on device
  setMobileControlsVisibility(visible) {
    if (this.mobileControls) {
      this.mobileControls.style.display = visible ? 'flex' : 'none';
    }
  }

  initializeKeyboardVisualFeedback() {
    // Map keyboard keys to button elements
    this.keyToButtonMap = new Map();
    
    // Find buttons and map them to their corresponding keys
    const btnW = document.getElementById('btn-w');
    const btnA = document.getElementById('btn-a');
    const btnS = document.getElementById('btn-s');
    const btnD = document.getElementById('btn-d');
    const btnSpace = document.getElementById('btn-space');
    const btnSprint = document.getElementById('btn-sprint');
    
    if (btnW) {
      this.keyToButtonMap.set('KeyW', btnW);
      this.keyToButtonMap.set('ArrowUp', btnW);
    }
    if (btnA) {
      this.keyToButtonMap.set('KeyA', btnA);
      this.keyToButtonMap.set('ArrowLeft', btnA);
    }
    if (btnS) {
      this.keyToButtonMap.set('KeyS', btnS);
      this.keyToButtonMap.set('ArrowDown', btnS);
    }
    if (btnD) {
      this.keyToButtonMap.set('KeyD', btnD);
      this.keyToButtonMap.set('ArrowRight', btnD);
    }
    if (btnSpace) this.keyToButtonMap.set('Space', btnSpace);
    if (btnSprint) {
      this.keyToButtonMap.set('ShiftLeft', btnSprint);
      this.keyToButtonMap.set('ShiftRight', btnSprint);
    }
    
    // Also map by keyCode for compatibility
    this.keyCodeToButtonMap = new Map();
    if (btnW) {
      this.keyCodeToButtonMap.set(87, btnW); // W
      this.keyCodeToButtonMap.set(38, btnW); // Arrow Up
    }
    if (btnA) {
      this.keyCodeToButtonMap.set(65, btnA); // A
      this.keyCodeToButtonMap.set(37, btnA); // Arrow Left
    }
    if (btnS) {
      this.keyCodeToButtonMap.set(83, btnS); // S
      this.keyCodeToButtonMap.set(40, btnS); // Arrow Down
    }
    if (btnD) {
      this.keyCodeToButtonMap.set(68, btnD); // D
      this.keyCodeToButtonMap.set(39, btnD); // Arrow Right
    }
    if (btnSpace) this.keyCodeToButtonMap.set(32, btnSpace); // Space
    if (btnSprint) this.keyCodeToButtonMap.set(16, btnSprint); // Shift
    
    // Listen for keyboard events
    window.addEventListener('keydown', (e) => {
      this.handleKeyboardVisualFeedback(e, true);
    });
    
    window.addEventListener('keyup', (e) => {
      this.handleKeyboardVisualFeedback(e, false);
    });
  }

  handleKeyboardVisualFeedback(event, isPressed) {
    // Try to find button by code first, then by keyCode
    let button = this.keyToButtonMap.get(event.code);
    if (!button) {
      button = this.keyCodeToButtonMap.get(event.keyCode);
    }
    
    if (button) {
      if (isPressed) {
        button.classList.add('pressed');
      } else {
        button.classList.remove('pressed');
      }
    }
  }

  initializeVirtualJoystick() {
    this.joystickContainer = document.getElementById('virtual-joystick');
    this.joystickKnob = document.getElementById('joystick-knob');
    
    if (!this.joystickContainer || !this.joystickKnob) return;
    
    this.joystickData = {
      active: false,
      centerX: 0,
      centerY: 0,
      currentX: 0,
      currentY: 0,
      maxDistance: 35, // Maximum distance from center
      deadZone: 0.1 // Minimum input threshold
    };
    
    // Calculate center position
    this.updateJoystickCenter();
    
    // Touch events
    this.joystickKnob.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.startJoystick(e.touches[0]);
    });
    
    this.joystickContainer.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this.joystickData.active) {
        this.moveJoystick(e.touches[0]);
      }
    });
    
    this.joystickContainer.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.endJoystick();
    });
    
    // Mouse events for desktop testing
    this.joystickKnob.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.startJoystick(e);
    });
    
    document.addEventListener('mousemove', (e) => {
      if (this.joystickData.active) {
        this.moveJoystick(e);
      }
    });
    
    document.addEventListener('mouseup', () => {
      this.endJoystick();
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.updateJoystickCenter();
    });
  }
  
  updateJoystickCenter() {
    if (!this.joystickContainer) return;
    
    const rect = this.joystickContainer.getBoundingClientRect();
    this.joystickData.centerX = rect.left + rect.width / 2;
    this.joystickData.centerY = rect.top + rect.height / 2;
  }
  
  startJoystick(pointer) {
    this.joystickData.active = true;
    this.joystickKnob.classList.add('active');
    this.updateJoystickCenter();
  }
  
  moveJoystick(pointer) {
    if (!this.joystickData.active) return;
    
    const deltaX = pointer.clientX - this.joystickData.centerX;
    const deltaY = pointer.clientY - this.joystickData.centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Limit knob movement to max distance
    let limitedX = deltaX;
    let limitedY = deltaY;
    
    if (distance > this.joystickData.maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      limitedX = Math.cos(angle) * this.joystickData.maxDistance;
      limitedY = Math.sin(angle) * this.joystickData.maxDistance;
    }
    
    // Update knob position
    this.joystickKnob.style.transform = `translate(calc(-50% + ${limitedX}px), calc(-50% + ${limitedY}px))`;
    
    // Calculate normalized input values (-1 to 1)
    const normalizedX = limitedX / this.joystickData.maxDistance;
    const normalizedY = -limitedY / this.joystickData.maxDistance; // Invert Y for game coordinates
    
    // Apply dead zone
    const inputMagnitude = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
    
    if (inputMagnitude > this.joystickData.deadZone) {
      this.joystickData.currentX = normalizedX;
      this.joystickData.currentY = normalizedY;
      this.updateInputFromJoystick(normalizedX, normalizedY);
    } else {
      this.joystickData.currentX = 0;
      this.joystickData.currentY = 0;
      this.updateInputFromJoystick(0, 0);
    }
  }
  
  endJoystick() {
    if (!this.joystickData.active) return;
    
    this.joystickData.active = false;
    this.joystickKnob.classList.remove('active');
    
    // Reset knob position
    this.joystickKnob.style.transform = 'translate(-50%, -50%)';
    
    // Clear input
    this.joystickData.currentX = 0;
    this.joystickData.currentY = 0;
    this.updateInputFromJoystick(0, 0);
  }
  
  updateInputFromJoystick(x, y) {
    // Convert joystick input to WASD-like input
    const threshold = 0.3;
    
    // Forward/Backward (W/S)
    if (y > threshold) {
      this.simulateKeyInput('KeyW', true);
      this.simulateKeyInput('KeyS', false);
    } else if (y < -threshold) {
      this.simulateKeyInput('KeyW', false);
      this.simulateKeyInput('KeyS', true);
    } else {
      this.simulateKeyInput('KeyW', false);
      this.simulateKeyInput('KeyS', false);
    }
    
    // Left/Right (A/D)
    if (x < -threshold) {
      this.simulateKeyInput('KeyA', true);
      this.simulateKeyInput('KeyD', false);
    } else if (x > threshold) {
      this.simulateKeyInput('KeyA', false);
      this.simulateKeyInput('KeyD', true);
    } else {
      this.simulateKeyInput('KeyA', false);
      this.simulateKeyInput('KeyD', false);
    }
  }
  
  simulateKeyInput(key, isPressed) {
    const keyEvent = {
      keyCode: this.getKeyCode(key),
      preventDefault: () => {}
    };
    
    if (isPressed) {
      this.inputManager.onKeyDown(keyEvent);
    } else {
      this.inputManager.onKeyUp(keyEvent);
    }
  }

  // Detect if device is mobile/touch
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
}