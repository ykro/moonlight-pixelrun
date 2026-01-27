import Phaser from 'phaser';
import { GAME_WIDTH, LANES } from '../constants/GameConstants';

export class Collectible extends Phaser.GameObjects.Sprite {
  private lane: number = LANES.CENTER;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'collectible');

    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  spawn(lane: number): void {
    this.lane = lane;
    this.active = true;
    this.visible = true;

    this.x = GAME_WIDTH / 2 + LANES.POSITIONS[lane];
    this.y = -20;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = true;
    }
  }

  deactivate(): void {
    this.active = false;
    this.visible = false;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = false;
    }
  }

  getLane(): number {
    return this.lane;
  }

  isOffScreen(): boolean {
    return this.y > 350;
  }
}
