import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Obstacle } from '../entities/Obstacle';
import { Collectible } from '../entities/Collectible';

export class CollisionSystem {
  private player: Player;

  private onObstacleHit: () => void;
  private onCollectibleGet: () => void;

  constructor(
    _scene: Phaser.Scene,
    player: Player,
    onObstacleHit: () => void,
    onCollectibleGet: () => void
  ) {
    this.player = player;
    this.onObstacleHit = onObstacleHit;
    this.onCollectibleGet = onCollectibleGet;
  }

  checkObstacleCollisions(obstacles: Obstacle[]): void {
    if (this.player.getState() === 'hit') return;

    const playerHitbox = this.player.getHitbox();
    const playerBounds = playerHitbox.getBounds();

    for (const obstacle of obstacles) {
      if (!obstacle.active) continue;

      const obstacleBounds = obstacle.getBounds();

      if (this.boundsOverlap(playerBounds, obstacleBounds)) {
        const playerState = this.player.getState();
        const obstacleType = obstacle.getObstacleType();

        if (obstacleType === 'air' && playerState === 'sliding') {
          continue;
        }

        if (obstacleType === 'ground' && playerState === 'jumping') {
          continue;
        }

        this.player.hit();
        this.onObstacleHit();
        return;
      }
    }
  }

  checkCollectibleCollisions(collectibles: Collectible[]): void {
    if (this.player.getState() === 'hit') return;

    const playerHitbox = this.player.getHitbox();
    const playerBounds = playerHitbox.getBounds();

    for (const collectible of collectibles) {
      if (!collectible.active) continue;

      const collectibleBounds = collectible.getBounds();

      if (this.boundsOverlap(playerBounds, collectibleBounds)) {
        collectible.deactivate();
        this.onCollectibleGet();
      }
    }
  }

  private boundsOverlap(
    a: Phaser.Geom.Rectangle,
    b: Phaser.Geom.Rectangle
  ): boolean {
    const padding = 2;

    return (
      a.x + padding < b.x + b.width - padding &&
      a.x + a.width - padding > b.x + padding &&
      a.y + padding < b.y + b.height - padding &&
      a.y + a.height - padding > b.y + padding
    );
  }
}
