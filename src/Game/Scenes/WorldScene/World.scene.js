import Game from '../../Game.class';
import DebugFloor from './components/DebugFloor/DebugFloor.class';
import Lighting from './components/Lighting/Lighting.class';
import Player from '../../Entities/Player.class';
import * as THREE from 'three';

export default class World {
  constructor() {
    /**
     * Game references
     */
    this.game = Game.getInstance();
    this.scene = this.game.scene;
    this.scene.fog = new THREE.FogExp2('#96a9ae', 0.05);

    /**
     * World configurations
     */
    this.debugFloor = new DebugFloor();
    this.player = new Player();
    this.lighting = new Lighting({ helperEnabled: false });
  }

  update() {
    this.player.update();
    this.lighting.update();
  }
}
