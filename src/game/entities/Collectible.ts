import Phaser from 'phaser';
import { LANES } from '../constants/GameConstants';

export type CollectibleType = 'water' | 'gel' | 'banana';

export class Collectible extends Phaser.GameObjects.Sprite {
  private lane: number = LANES.CENTER;
  private collectibleType: CollectibleType = 'water';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'collectible_water');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set display size
    this.setDisplaySize(12, 12);
  }

  spawn(lane: number, type: CollectibleType = 'water'): void {
    this.lane = lane;
    this.collectibleType = type;
    const key = `collectible_${this.collectibleType}`;
    if (this.scene.textures.exists(key)) {
      this.setTexture(key);
    }
    this.active = true;
    this.visible = true;

    this.x = this.scene.scale.width / 2 + LANES.POSITIONS[lane];
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

  getCollectibleType(): CollectibleType {
    return this.collectibleType;
  }

  isOffScreen(): boolean {
    return this.y > 350;
  }
}
