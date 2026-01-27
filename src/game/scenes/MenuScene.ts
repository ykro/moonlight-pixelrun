import Phaser from 'phaser';
import { GAME_WIDTH } from '../constants/GameConstants';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const centerX = GAME_WIDTH / 2;

    this.add.text(centerX, 80, 'MOONLIGHT', {
      fontSize: '16px',
      color: '#4a90d9',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(centerX, 100, 'PIXEL RUN', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const startText = this.add.text(centerX, 200, 'TAP TO START', {
      fontSize: '10px',
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.add.text(centerX, 280, 'SWIPE TO MOVE', {
      fontSize: '8px',
      color: '#666666',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.input.once('pointerdown', () => {
      this.scene.start('CharacterSelectScene');
    });
  }
}
