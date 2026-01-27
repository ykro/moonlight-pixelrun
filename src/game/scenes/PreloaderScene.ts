import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER, OBSTACLE, GROUND, COLORS } from '../constants/GameConstants';

export class PreloaderScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloaderScene' });
  }

  preload(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    const progressBox = this.add.rectangle(centerX, centerY, 100, 10, 0x222222);
    const progressBar = this.add.rectangle(centerX - 48, centerY, 0, 6, 0x4a90d9);
    progressBar.setOrigin(0, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.width = 96 * value;
    });

    this.load.on('complete', () => {
      progressBox.destroy();
      progressBar.destroy();
    });

    this.createPlaceholderAssets();
  }

  private createPlaceholderAssets(): void {
    const playerGraphics = this.make.graphics({ x: 0, y: 0 });
    playerGraphics.fillStyle(PLAYER.COLOR);
    playerGraphics.fillRect(0, 0, PLAYER.WIDTH, PLAYER.HEIGHT);
    playerGraphics.fillStyle(0xffffff);
    playerGraphics.fillRect(4, 4, 3, 3);
    playerGraphics.fillRect(9, 4, 3, 3);
    playerGraphics.generateTexture('player', PLAYER.WIDTH, PLAYER.HEIGHT);
    playerGraphics.destroy();

    const obstacleGraphics = this.make.graphics({ x: 0, y: 0 });
    obstacleGraphics.fillStyle(OBSTACLE.COLOR);
    obstacleGraphics.fillRect(0, 0, OBSTACLE.WIDTH, OBSTACLE.HEIGHT);
    obstacleGraphics.fillStyle(0xaa3333);
    obstacleGraphics.fillRect(2, 2, OBSTACLE.WIDTH - 4, 4);
    obstacleGraphics.generateTexture('obstacle', OBSTACLE.WIDTH, OBSTACLE.HEIGHT);
    obstacleGraphics.destroy();

    const groundGraphics = this.make.graphics({ x: 0, y: 0 });
    groundGraphics.fillStyle(COLORS.GROUND);
    groundGraphics.fillRect(0, 0, GAME_WIDTH, GROUND.HEIGHT);
    for (let i = 0; i < 6; i++) {
      groundGraphics.fillStyle(COLORS.LANE_LINE);
      groundGraphics.fillRect(i * 32 + 10, 0, 12, 4);
    }
    groundGraphics.generateTexture('ground', GAME_WIDTH, GROUND.HEIGHT);
    groundGraphics.destroy();

    const collectibleGraphics = this.make.graphics({ x: 0, y: 0 });
    collectibleGraphics.fillStyle(0x3498db);
    collectibleGraphics.fillRect(4, 0, 8, 16);
    collectibleGraphics.fillStyle(0x2980b9);
    collectibleGraphics.fillRect(6, 2, 4, 12);
    collectibleGraphics.generateTexture('collectible', 16, 16);
    collectibleGraphics.destroy();
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
