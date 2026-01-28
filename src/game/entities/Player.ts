import Phaser from 'phaser';
import { LANES, PLAYER } from '../constants/GameConstants';

export type PlayerState = 'running' | 'jumping' | 'sliding' | 'vaulting' | 'dashing' | 'hit';

export class Player extends Phaser.GameObjects.Sprite {
  private currentLane: number = LANES.CENTER;
  private playerState: PlayerState = 'running';
  private isTransitioning: boolean = false;
  private baseY: number;
  private hitbox: Phaser.GameObjects.Rectangle;
  private runFrame1: string;
  private runFrame2: string;
  private runTimer: Phaser.Time.TimerEvent | null = null;
  private currentFrame: number = 0;

  constructor(scene: Phaser.Scene, characterId: string = 'gabriel') {
    const centerX = scene.scale.width / 2;
    const textureKey = `player_${characterId}`;
    super(scene, centerX, PLAYER.Y_POSITION, textureKey);

    this.runFrame1 = textureKey;
    this.runFrame2 = `player_${characterId}_run2`;

    this.baseY = PLAYER.Y_POSITION;

    // Scale sprite to game size
    this.setDisplaySize(PLAYER.WIDTH, PLAYER.HEIGHT);

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

    // Start running animation (alternate frames)
    this.startRunAnimation();
  }

  private startRunAnimation(): void {
    this.runTimer = this.scene.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        if (this.playerState === 'running' || this.playerState === 'jumping') {
          this.currentFrame = this.currentFrame === 0 ? 1 : 0;
          const key = this.currentFrame === 0 ? this.runFrame1 : this.runFrame2;
          if (this.scene.textures.exists(key)) {
            this.setTexture(key);
          }
        }
      },
    });
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
    this.scene.events.emit('player-jump');

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

  vault(): void {
    if (this.playerState !== 'running') return;

    this.playerState = 'vaulting';

    // Quick vault animation - faster than regular jump
    this.scene.tweens.add({
      targets: [this, this.hitbox],
      y: this.baseY - PLAYER.JUMP_HEIGHT * 0.7,
      duration: 150,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: [this, this.hitbox],
          y: this.baseY,
          duration: 150,
          ease: 'Sine.easeIn',
          onComplete: () => {
            if (this.playerState === 'vaulting') {
              this.playerState = 'running';
            }
          },
        });
      },
    });
  }

  dashLeft(): boolean {
    if (this.playerState !== 'running' && this.playerState !== 'dashing') return false;
    if (this.currentLane <= LANES.LEFT) return false;

    this.playerState = 'dashing';
    this.scene.events.emit('player-dash', 'left');

    // Dash moves 1-2 lanes instantly with invincibility frames
    const targetLane = Math.max(LANES.LEFT, this.currentLane - 2);
    this.currentLane = targetLane;
    const targetX = this.scene.scale.width / 2 + LANES.POSITIONS[this.currentLane];

    // Quick dash with afterimage effect
    this.setAlpha(0.5);

    this.scene.tweens.add({
      targets: [this, this.hitbox],
      x: targetX,
      duration: 80,
      ease: 'Power2',
      onComplete: () => {
        this.setAlpha(1);
        this.playerState = 'running';
      },
    });

    return true;
  }

  dashRight(): boolean {
    if (this.playerState !== 'running' && this.playerState !== 'dashing') return false;
    if (this.currentLane >= LANES.RIGHT) return false;

    this.playerState = 'dashing';
    this.scene.events.emit('player-dash', 'right');

    const targetLane = Math.min(LANES.RIGHT, this.currentLane + 2);
    this.currentLane = targetLane;
    const targetX = this.scene.scale.width / 2 + LANES.POSITIONS[this.currentLane];

    this.setAlpha(0.5);

    this.scene.tweens.add({
      targets: [this, this.hitbox],
      x: targetX,
      duration: 80,
      ease: 'Power2',
      onComplete: () => {
        this.setAlpha(1);
        this.playerState = 'running';
      },
    });

    return true;
  }

  slide(): void {
    if (this.playerState !== 'running' || this.isTransitioning) return;

    this.playerState = 'sliding';
    this.scene.events.emit('player-slide');

    // Use displayHeight instead of scaleY to avoid stretching issues
    this.setDisplaySize(PLAYER.WIDTH, PLAYER.HEIGHT / 2);
    this.y = this.baseY + PLAYER.HEIGHT / 4;
    this.hitbox.setDisplaySize(PLAYER.WIDTH - 4, (PLAYER.HEIGHT - 4) / 2);
    this.hitbox.y = this.y;

    this.scene.time.delayedCall(PLAYER.SLIDE_DURATION, () => {
      if (this.playerState === 'sliding') {
        this.setDisplaySize(PLAYER.WIDTH, PLAYER.HEIGHT);
        this.y = this.baseY;
        this.hitbox.setDisplaySize(PLAYER.WIDTH - 4, PLAYER.HEIGHT - 4);
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

    const targetX = this.scene.scale.width / 2 + LANES.POSITIONS[this.currentLane];

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
    this.x = this.scene.scale.width / 2;
    this.y = this.baseY;
    this.hitbox.x = this.x;
    this.hitbox.y = this.y;
    // Use setDisplaySize instead of scaleY to maintain proper sprite proportions
    this.setDisplaySize(PLAYER.WIDTH, PLAYER.HEIGHT);
    this.hitbox.setDisplaySize(PLAYER.WIDTH - 4, PLAYER.HEIGHT - 4);
    this.alpha = 1;
    this.clearTint();
    this.setTexture(this.runFrame1);
    this.currentFrame = 0;
  }

  destroy(fromScene?: boolean): void {
    this.runTimer?.destroy();
    super.destroy(fromScene);
  }
}
