import Phaser from 'phaser';
import { Swipe } from 'phaser3-rex-plugins/plugins/gestures';
import { Player } from '../entities/Player';

interface SwipeEvent {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

export class InputSystem {
  private scene: Phaser.Scene;
  private player: Player;
  private swipe: Swipe | null = null;
  private enabled: boolean = true;

  private readonly SWIPE_THRESHOLD = 20;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.setupInput();
  }

  private setupInput(): void {
    this.swipe = new Swipe(this.scene, {
      enable: true,
      threshold: this.SWIPE_THRESHOLD,
      velocityThreshold: 300,
      dir: '8dir',
    });

    this.swipe.on('swipe', this.handleSwipe, this);

    this.scene.input.keyboard?.on('keydown-LEFT', () => this.player.moveLeft());
    this.scene.input.keyboard?.on('keydown-RIGHT', () => this.player.moveRight());
    this.scene.input.keyboard?.on('keydown-UP', () => this.player.jump());
    this.scene.input.keyboard?.on('keydown-DOWN', () => this.player.slide());
    this.scene.input.keyboard?.on('keydown-A', () => this.player.moveLeft());
    this.scene.input.keyboard?.on('keydown-D', () => this.player.moveRight());
    this.scene.input.keyboard?.on('keydown-W', () => this.player.jump());
    this.scene.input.keyboard?.on('keydown-S', () => this.player.slide());
  }

  private handleSwipe(swipe: SwipeEvent): void {
    if (!this.enabled) return;

    const direction = swipe.left ? 'left'
      : swipe.right ? 'right'
      : swipe.up ? 'up'
      : swipe.down ? 'down'
      : null;

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
