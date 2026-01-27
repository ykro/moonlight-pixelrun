import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, LANES, GROUND, COLORS } from '../constants/GameConstants';

export class LaneSystem {
  private scene: Phaser.Scene;
  private laneLines: Phaser.GameObjects.Line[] = [];
  private groundTiles!: Phaser.GameObjects.TileSprite;
  private scrollSpeed: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createGround();
    this.createLaneLines();
  }

  private createGround(): void {
    this.groundTiles = this.scene.add.tileSprite(
      GAME_WIDTH / 2,
      GROUND.Y + GROUND.HEIGHT / 2,
      GAME_WIDTH,
      GROUND.HEIGHT,
      'ground'
    );
    this.groundTiles.setDepth(-1);

    this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      COLORS.SKY_NIGHT
    ).setDepth(-10);
  }

  private createLaneLines(): void {
    const linePositions = [
      GAME_WIDTH / 2 + (LANES.POSITIONS[0] + LANES.POSITIONS[1]) / 2,
      GAME_WIDTH / 2 + (LANES.POSITIONS[1] + LANES.POSITIONS[2]) / 2,
    ];

    linePositions.forEach((x) => {
      const line = this.scene.add.line(
        0, 0,
        x, 0,
        x, GAME_HEIGHT,
        COLORS.LANE_LINE,
        0.3
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
    this.groundTiles.destroy();
  }
}
