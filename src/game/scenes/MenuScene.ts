import Phaser from 'phaser';
import { AudioSystem } from '../systems/AudioSystem';

export class MenuScene extends Phaser.Scene {
  private audioSystem: AudioSystem | null = null;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Background sprite
    if (this.textures.exists('bg_menu')) {
      const bg = this.add.image(centerX, centerY, 'bg_menu');
      bg.setDisplaySize(this.scale.width, this.scale.height);
      bg.setDepth(-10);
    } else {
      this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x0a0a15).setDepth(-10);
    }

    // Start menu music (will resume AudioContext on mobile via user's prior tap)
    this.audioSystem = new AudioSystem(this, 'music_menu');

    this.add.text(centerX, 80, 'MOONLIGHT', {
      fontSize: '16px',
      color: '#4a90d9',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(centerX, 100, 'PIXEL RUN', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const startText = this.add.text(centerX, 280, 'TAP TO START', {
      fontSize: '10px',
      color: '#888888',
      fontFamily: 'Arial, Helvetica, sans-serif',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    const goNext = () => {
      this.audioSystem?.stopMusic();
      this.scene.start('InstructionsScene');
    };

    this.input.once('pointerdown', goNext);
    this.input.keyboard?.once('keydown-SPACE', goNext);
    this.input.keyboard?.once('keydown-ENTER', goNext);
  }
}
