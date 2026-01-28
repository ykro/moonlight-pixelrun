import Phaser from 'phaser';
import { LANES, GROUND } from '../constants/GameConstants';
import { LevelTheme, THEMES } from '../constants/LevelConfig';

export class LaneSystem {
  private scene: Phaser.Scene;
  private laneLines: Phaser.GameObjects.Line[] = [];
  private groundTiles!: Phaser.GameObjects.TileSprite;
  private skyBackground!: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
  private scrollSpeed: number = 0;
  private theme: LevelTheme;
  private levelId: string;

  constructor(scene: Phaser.Scene, theme: LevelTheme = THEMES.night, levelId: string = 'las_americas') {
    this.scene = scene;
    this.theme = theme;
    this.levelId = levelId;
    this.createBackground();
    this.createGround();
    this.createLaneLines();
  }

  private createBackground(): void {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const bgKey = `bg_${this.levelId}`;

    if (this.scene.textures.exists(bgKey)) {
      this.skyBackground = this.scene.add.image(w / 2, h / 2, bgKey);
      (this.skyBackground as Phaser.GameObjects.Image).setDisplaySize(w, h);
      this.skyBackground.setDepth(-10);
    } else {
      this.skyBackground = this.scene.add.rectangle(
        w / 2, h / 2, w, h,
        this.theme.skyColor
      ).setDepth(-10);
    }
  }

  private createGround(): void {
    const w = this.scene.scale.width;
    const groundKey = `ground_${this.theme.groundColor.toString(16)}`;

    if (!this.scene.textures.exists(groundKey)) {
      const graphics = this.scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(this.theme.groundColor);
      graphics.fillRect(0, 0, w, GROUND.HEIGHT);

      for (let i = 0; i < Math.ceil(w / 32) + 1; i++) {
        graphics.fillStyle(this.theme.groundLineColor);
        graphics.fillRect(i * 32 + 10, 0, 12, 4);
      }

      graphics.generateTexture(groundKey, w, GROUND.HEIGHT);
      graphics.destroy();
    }

    this.groundTiles = this.scene.add.tileSprite(
      w / 2,
      GROUND.Y + GROUND.HEIGHT / 2,
      w,
      GROUND.HEIGHT,
      groundKey
    );
    this.groundTiles.setDepth(-1);
  }

  private createLaneLines(): void {
    const cx = this.scene.scale.width / 2;
    const h = this.scene.scale.height;
    const linePositions = [
      cx + (LANES.POSITIONS[0] + LANES.POSITIONS[1]) / 2,
      cx + (LANES.POSITIONS[1] + LANES.POSITIONS[2]) / 2,
    ];

    linePositions.forEach((x) => {
      const line = this.scene.add.line(
        0, 0, x, 0, x, h,
        this.theme.laneLineColor, 0.3
      );
      line.setOrigin(0, 0);
      line.setDepth(-5);
      this.laneLines.push(line);
    });
  }

  setScrollSpeed(speed: number): void {
    this.scrollSpeed = speed;
  }

  update(delta: number): void {
    const scrollAmount = (this.scrollSpeed * delta) / 1000;
    this.groundTiles.tilePositionY -= scrollAmount;
  }

  destroy(): void {
    this.laneLines.forEach(line => line.destroy());
    this.groundTiles?.destroy();
    this.skyBackground?.destroy();
  }
}
