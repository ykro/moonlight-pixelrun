import Phaser from 'phaser';
// Using this.scale.width/height for dynamic sizing

interface GameOverData {
  distance: number;
  evolutionLevel: string;
  levelId?: string;
  levelName?: string;
}

export class GameOverScene extends Phaser.Scene {
  private distance: number = 0;
  private evolutionLevel: string = 'Runner';
  private levelId: string = 'las_americas';
  private levelName: string = 'Las Américas';

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: GameOverData): void {
    this.distance = data.distance || 0;
    this.evolutionLevel = data.evolutionLevel || 'Runner';
    this.levelId = data.levelId || 'las_americas';
    this.levelName = data.levelName || 'Las Américas';
  }

  create(): void {
    // Background
    if (this.textures.exists('bg_game_over')) {
      const bg = this.add.image(this.scale.width / 2, this.scale.height / 2, 'bg_game_over');
      bg.setDisplaySize(this.scale.width, this.scale.height);
      bg.setDepth(-10);
    }
    // Dark overlay
    this.add.rectangle(
      this.scale.width / 2, this.scale.height / 2,
      this.scale.width, this.scale.height,
      0x000000, 0.85
    );

    this.add.text(this.scale.width / 2, 60, 'GAME OVER', {
      fontSize: '14px',
      color: '#e74c3c',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(this.scale.width / 2, 90, this.levelName.toUpperCase(), {
      fontSize: '8px',
      color: '#666666',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(this.scale.width / 2, 130, `${this.distance}m`, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(this.scale.width / 2, 155, this.evolutionLevel, {
      fontSize: '10px',
      color: '#4a90d9',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const highScore = this.loadHighScore();
    if (this.distance > highScore) {
      this.saveHighScore(this.distance);

      const newRecordText = this.add.text(this.scale.width / 2, 185, '★ NEW RECORD! ★', {
        fontSize: '10px',
        color: '#f1c40f',
        fontFamily: 'monospace',
      }).setOrigin(0.5);

      this.tweens.add({
        targets: newRecordText,
        scale: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    } else {
      this.add.text(this.scale.width / 2, 185, `Best: ${highScore}m`, {
        fontSize: '9px',
        color: '#888888',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    }

    // Retry button
    const retryButton = this.createButton(this.scale.width / 2, 230, 'RETRY', () => {
      this.scene.start('GameScene');
    });

    // Menu button
    this.createButton(this.scale.width / 2, 265, 'MENU', () => {
      this.scene.start('MenuScene');
    });

    // Keyboard shortcuts
    this.input.keyboard?.on('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.scene.start('GameScene');
    });
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });

    // Pulse animation on retry button
    this.tweens.add({
      targets: retryButton,
      alpha: 0.7,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  private createButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, text, {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#333333',
      padding: { x: 16, y: 6 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setBackgroundColor('#555555'));
    button.on('pointerout', () => button.setBackgroundColor('#333333'));
    button.on('pointerdown', callback);

    return button;
  }

  private loadHighScore(): number {
    try {
      const key = `moonlight_best_${this.levelId}`;
      const saved = localStorage.getItem(key);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  }

  private saveHighScore(score: number): void {
    try {
      const key = `moonlight_best_${this.levelId}`;
      localStorage.setItem(key, score.toString());
    } catch {
      // localStorage unavailable
    }
  }
}
