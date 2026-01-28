import Phaser from 'phaser';
import { OBSTACLE, LANES } from '../constants/GameConstants';
import { ObstacleVariant, LevelObstacleConfig } from '../constants/LevelConfig';

export type ObstacleType = 'ground' | 'air';

export class Obstacle extends Phaser.GameObjects.Sprite {
  private obstacleType: ObstacleType = 'ground';
  private lane: number = LANES.CENTER;
  private variant: ObstacleVariant = 'runner';
  private configWidth: number = OBSTACLE.WIDTH;
  private configHeight: number = OBSTACLE.HEIGHT;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, -100, 'obstacle_runner');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.active = false;
    this.visible = false;
  }

  spawn(lane: number, config: LevelObstacleConfig): void {
    this.lane = lane;
    this.obstacleType = config.type;
    this.variant = config.variant;
    this.configWidth = config.width;
    this.configHeight = config.height;
    this.active = true;
    this.visible = true;

    // Set texture based on variant
    const textureKey = `obstacle_${config.variant}`;
    if (this.scene.textures.exists(textureKey)) {
      this.setTexture(textureKey);
    }

    // Set display size based on config
    this.setDisplaySize(config.width, config.height);

    // Set position
    this.x = this.scene.scale.width / 2 + LANES.POSITIONS[lane];
    this.y = config.type === 'air' ? OBSTACLE.SPAWN_Y - 30 : OBSTACLE.SPAWN_Y;

    // Update physics body
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = true;
      body.setSize(config.width, config.height);
    }
  }

  // Legacy spawn for backwards compatibility
  spawnLegacy(lane: number, type: ObstacleType = 'ground'): void {
    this.spawn(lane, {
      variant: 'runner',
      weight: 1,
      type,
      width: OBSTACLE.WIDTH,
      height: OBSTACLE.HEIGHT,
      color: type === 'air' ? 0xf39c12 : OBSTACLE.COLOR,
    });
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

  getVariant(): ObstacleVariant {
    return this.variant;
  }

  isOffScreen(): boolean {
    return this.y > 350;
  }
}
