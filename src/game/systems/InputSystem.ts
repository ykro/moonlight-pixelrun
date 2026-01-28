import Phaser from 'phaser';
import { Swipe } from 'phaser3-rex-plugins/plugins/gestures';
import { Player } from '../entities/Player';

interface SwipeEvent {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  dragVelocity: { x: number; y: number };
}

export class InputSystem {
  private scene: Phaser.Scene;
  private player: Player;
  private swipe: Swipe | null = null;
  private enabled: boolean = true;
  private canDash: boolean = true; // TODO: revert to false after testing

  private readonly SWIPE_THRESHOLD = 20;
  private readonly DASH_VELOCITY_THRESHOLD = 800;

  private lastSwipeDirection: 'left' | 'right' | null = null;
  private lastSwipeTime: number = 0;
  private readonly DOUBLE_SWIPE_WINDOW = 300;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.setupInput();
  }

  setCanDash(enabled: boolean): void {
    this.canDash = enabled;
  }

  private setupInput(): void {
    this.swipe = new Swipe(this.scene, {
      enable: true,
      threshold: this.SWIPE_THRESHOLD,
      velocityThreshold: 300,
      dir: '8dir',
    });

    this.swipe.on('swipe', this.handleSwipe, this);

    // Regular movement
    this.scene.input.keyboard?.on('keydown-LEFT', () => this.handleKeyLeft(false));
    this.scene.input.keyboard?.on('keydown-RIGHT', () => this.handleKeyRight(false));
    this.scene.input.keyboard?.on('keydown-UP', () => this.player.jump());
    this.scene.input.keyboard?.on('keydown-DOWN', () => this.player.slide());
    this.scene.input.keyboard?.on('keydown-A', () => this.handleKeyLeft(false));
    this.scene.input.keyboard?.on('keydown-D', () => this.handleKeyRight(false));
    this.scene.input.keyboard?.on('keydown-W', () => this.player.jump());
    this.scene.input.keyboard?.on('keydown-S', () => this.player.slide());

    // Dash with Shift modifier
    this.scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (!this.enabled || !this.canDash) return;
      if (event.shiftKey) {
        if (event.key === 'ArrowLeft' || event.key === 'a') {
          this.player.dashLeft();
        } else if (event.key === 'ArrowRight' || event.key === 'd') {
          this.player.dashRight();
        }
      }
    });
  }

  private handleKeyLeft(withShift: boolean): void {
    if (!this.enabled) return;
    if (withShift && this.canDash) {
      this.player.dashLeft();
    } else {
      this.player.moveLeft();
    }
  }

  private handleKeyRight(withShift: boolean): void {
    if (!this.enabled) return;
    if (withShift && this.canDash) {
      this.player.dashRight();
    } else {
      this.player.moveRight();
    }
  }

  private handleSwipe(swipe: SwipeEvent): void {
    if (!this.enabled) return;

    const direction = swipe.left ? 'left'
      : swipe.right ? 'right'
      : swipe.up ? 'up'
      : swipe.down ? 'down'
      : null;

    const now = this.scene.time.now;
    const velocity = swipe.dragVelocity ? Math.abs(swipe.dragVelocity.x) : 0;

    // Check for dash conditions (double-swipe or fast swipe)
    if (this.canDash && (direction === 'left' || direction === 'right')) {
      const isDoubleSwipe =
        direction === this.lastSwipeDirection &&
        now - this.lastSwipeTime < this.DOUBLE_SWIPE_WINDOW;

      const isFastSwipe = velocity > this.DASH_VELOCITY_THRESHOLD;

      if (isDoubleSwipe || isFastSwipe) {
        if (direction === 'left') {
          if (this.player.dashLeft()) {
            this.lastSwipeDirection = null;
            this.lastSwipeTime = 0;
            return;
          }
        } else {
          if (this.player.dashRight()) {
            this.lastSwipeDirection = null;
            this.lastSwipeTime = 0;
            return;
          }
        }
      }

      this.lastSwipeDirection = direction;
      this.lastSwipeTime = now;
    }

    switch (direction) {
      case 'left':
        this.player.moveLeft();
        break;
      case 'right':
        this.player.moveRight();
        break;
      case 'up':
        this.player.jump();
        break;
      case 'down':
        this.player.slide();
        break;
    }
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  destroy(): void {
    this.swipe?.destroy();
    this.swipe = null;
  }
}
