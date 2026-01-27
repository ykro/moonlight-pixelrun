import Phaser from 'phaser';
import { OBSTACLE, GAME_WIDTH, LANES } from '../constants/GameConstants';

export type ObstacleType = 'ground' | 'air';

export class Obstacle extends Phaser.GameObjects.Sprite {
  private obstacleType: ObstacleType = 'ground';
  private lane: number = LANES.CENTER;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'obstacle');

    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  spawn(lane: number, type: ObstacleType = 'ground'): void {
    this.lane = lane;
    this.obstacleType = type;
    this.active = true;
    this.visible = true;

    this.x = GAME_WIDTH / 2 + LANES.POSITIONS[lane];
    this.y = OBSTACLE.SPAWN_Y;

    if (type === 'air') {
      this.y = OBSTACLE.SPAWN_Y - 30;
      this.setTint(0xf39c12);
    } else {
      this.clearTint();
    }

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

  getObstacleType(): ObstacleType {
    return this.obstacleType;
  }

  isOffScreen(): boolean {
    return this.y > 350;
  }
}
