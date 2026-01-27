import Phaser from 'phaser';
import { GAME_WIDTH } from '../constants/GameConstants';

interface UISceneData {
  getDistance: () => number;
  getEvolutionProgress: () => number;
  getEvolutionLevel: () => string;
}

export class UIScene extends Phaser.Scene {
  private distanceText!: Phaser.GameObjects.Text;
  private evolutionBar!: Phaser.GameObjects.Rectangle;
  private _evolutionBarBg!: Phaser.GameObjects.Rectangle;
  private levelText!: Phaser.GameObjects.Text;

  private getDistance!: () => number;
  private getEvolutionProgress!: () => number;
  private getEvolutionLevel!: () => string;

  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: UISceneData): void {
    this.getDistance = data.getDistance;
    this.getEvolutionProgress = data.getEvolutionProgress;
    this.getEvolutionLevel = data.getEvolutionLevel;
  }

  create(): void {
    this.distanceText = this.add.text(GAME_WIDTH / 2, 15, '0m', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0);

    const barWidth = 60;
    const barHeight = 6;
    const barX = GAME_WIDTH / 2;
    const barY = 35;

    this._evolutionBarBg = this.add.rectangle(
      barX, barY,
      barWidth, barHeight,
      0x333333
    );

    this.evolutionBar = this.add.rectangle(
      barX - barWidth / 2, barY,
      0, barHeight,
      0x4a90d9
    ).setOrigin(0, 0.5);

    this.levelText = this.add.text(barX, barY + 10, 'Runner', {
      fontSize: '6px',
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0);

    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('collectible-collected', this.flashCollectible, this);
    gameScene.events.on('level-up', this.flashLevelUp, this);
  }

  update(): void {
    const distance = Math.floor(this.getDistance());
    this.distanceText.setText(`${distance}m`);

    const progress = this.getEvolutionProgress();
    this.evolutionBar.width = progress * 60;

    this.levelText.setText(this.getEvolutionLevel());
  }

  private flashCollectible(): void {
    this.tweens.add({
      targets: this.evolutionBar,
      scaleY: 1.5,
      duration: 100,
      yoyo: true,
    });
  }

  private flashLevelUp(): void {
    this.tweens.add({
      targets: this.levelText,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 200,
      yoyo: true,
    });

    this.evolutionBar.setFillStyle(0xffff00);
    this.time.delayedCall(500, () => {
      this.evolutionBar.setFillStyle(0x4a90d9);
    });
  }

  shutdown(): void {
    const gameScene = this.scene.get('GameScene');
    gameScene.events.off('collectible-collected', this.flashCollectible, this);
    gameScene.events.off('level-up', this.flashLevelUp, this);
  }
}
