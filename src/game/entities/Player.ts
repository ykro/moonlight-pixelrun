import Phaser from 'phaser';
import { LANES, PLAYER, GAME_WIDTH } from '../constants/GameConstants';

export type PlayerState = 'running' | 'jumping' | 'sliding' | 'hit';

export class Player extends Phaser.GameObjects.Sprite {
  private currentLane: number = LANES.CENTER;
  private playerState: PlayerState = 'running';
  private isTransitioning: boolean = false;
  private baseY: number;
  private hitbox: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    const centerX = GAME_WIDTH / 2;
    super(scene, centerX, PLAYER.Y_POSITION, 'player');

    this.baseY = PLAYER.Y_POSITION;

    scene.add.existing(this as Phaser.GameObjects.Sprite);
    scene.physics.add.existing(this as Phaser.GameObjects.Sprite);

    this.hitbox = scene.add.rectangle(
      this.x,
      this.y,
      PLAYER.WIDTH - 4,
      PLAYER.HEIGHT - 4,
      0x00ff00,
      0
    );
    scene.physics.add.existing(this.hitbox);
  }

  getHitbox(): Phaser.GameObjects.Rectangle {
    return this.hitbox;
  }

  getState(): PlayerState {
    return this.playerState;
  }

  getCurrentLane(): number {
    return this.currentLane;
  }

  moveLeft(): void {
    if (this.playerState === 'hit' || this.isTransitioning) return;
    if (this.currentLane > LANES.LEFT) {
      this.currentLane--;
      this.transitionToLane();
    }
  }

  moveRight(): void {
    if (this.playerState === 'hit' || this.isTransitioning) return;
    if (this.currentLane < LANES.RIGHT) {
      this.currentLane++;
      this.transitionToLane();
    }
  }

  jump(): void {
    if (this.playerState !== 'running' || this.isTransitioning) return;

    this.playerState = 'jumping';

    this.scene.tweens.add({
      targets: [this, this.hitbox],
      y: this.baseY - PLAYER.JUMP_HEIGHT,
      duration: PLAYER.JUMP_DURATION / 2,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: [this, this.hitbox],
          y: this.baseY,
          duration: PLAYER.JUMP_DURATION / 2,
          ease: 'Sine.easeIn',
          onComplete: () => {
            if (this.playerState === 'jumping') {
              this.playerState = 'running';
            }
          },
        });
      },
    });
  }

  slide(): void {
    if (this.playerState !== 'running' || this.isTransitioning) return;

    this.playerState = 'sliding';

    this.scaleY = 0.5;
    this.y = this.baseY + PLAYER.HEIGHT / 4;
    this.hitbox.scaleY = 0.5;
    this.hitbox.y = this.y;

    this.scene.time.delayedCall(PLAYER.SLIDE_DURATION, () => {
      if (this.playerState === 'sliding') {
        this.scaleY = 1;
        this.y = this.baseY;
        this.hitbox.scaleY = 1;
        this.hitbox.y = this.y;
        this.playerState = 'running';
      }
    });
  }

  hit(): void {
    if (this.playerState === 'hit') return;

    this.playerState = 'hit';
    this.setTint(0xff0000);

    this.scene.tweens.add({
      targets: this,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 3,
    });
  }

  private transitionToLane(): void {
    this.isTransitioning = true;

    const targetX = GAME_WIDTH / 2 + LANES.POSITIONS[this.currentLane];

    this.scene.tweens.add({
      targets: [this, this.hitbox],
      x: targetX,
      duration: LANES.SWITCH_DURATION,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.isTransitioning = false;
      },
    });
  }

  update(): void {
    this.hitbox.x = this.x;
    if (this.playerState !== 'sliding') {
      this.hitbox.y = this.y;
    }
  }

  reset(): void {
    this.currentLane = LANES.CENTER;
    this.playerState = 'running';
    this.isTransitioning = false;
    this.x = GAME_WIDTH / 2;
    this.y = this.baseY;
    this.hitbox.x = this.x;
    this.hitbox.y = this.y;
    this.scaleY = 1;
    this.hitbox.scaleY = 1;
    this.alpha = 1;
    this.clearTint();
  }
}
