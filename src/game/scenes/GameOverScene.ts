import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants/GameConstants';

interface GameOverData {
  distance: number;
  evolutionLevel: string;
}

export class GameOverScene extends Phaser.Scene {
  private distance: number = 0;
  private evolutionLevel: string = 'Runner';

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: GameOverData): void {
    this.distance = data.distance || 0;
    this.evolutionLevel = data.evolutionLevel || 'Runner';
  }

  create(): void {
    this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000, 0.7
    );

    this.add.text(GAME_WIDTH / 2, 80, 'GAME OVER', {
      fontSize: '14px',
      color: '#e74c3c',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 130, `Distance: ${this.distance}m`, {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 155, `Level: ${this.evolutionLevel}`, {
      fontSize: '10px',
      color: '#4a90d9',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const highScore = this.loadHighScore();
    if (this.distance > highScore) {
      this.saveHighScore(this.distance);

      this.add.text(GAME_WIDTH / 2, 185, 'NEW RECORD!', {
        fontSize: '10px',
        color: '#f1c40f',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    } else {
      this.add.text(GAME_WIDTH / 2, 185, `Best: ${highScore}m`, {
        fontSize: '8px',
        color: '#888888',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    }

    const restartText = this.add.text(GAME_WIDTH / 2, 250, 'TAP TO RETRY', {
      fontSize: '10px',
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.time.delayedCall(500, () => {
      this.input.once('pointerdown', () => {
        this.scene.start('GameScene');
      });
    });
  }

  private loadHighScore(): number {
    try {
      const saved = localStorage.getItem('moonlight_highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  }

  private saveHighScore(score: number): void {
    try {
      localStorage.setItem('moonlight_highscore', score.toString());
    } catch {
      // localStorage unavailable
    }
  }
}
