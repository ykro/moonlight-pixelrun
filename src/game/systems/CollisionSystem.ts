import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Obstacle } from '../entities/Obstacle';
import { Collectible } from '../entities/Collectible';
import { PLAYER } from '../constants/GameConstants';

export class CollisionSystem {
  private player: Player;
  private canVault: boolean = false;

  private onObstacleHit: () => void;
  private onCollectibleGet: () => void;
  private onAutoVault: () => void;

  // Distance ahead to detect obstacles for auto-vault
  private readonly VAULT_DETECTION_DISTANCE = 60;

  constructor(
    _scene: Phaser.Scene,
    player: Player,
    onObstacleHit: () => void,
    onCollectibleGet: () => void,
    onAutoVault?: () => void
  ) {
    this.player = player;
    this.onObstacleHit = onObstacleHit;
    this.onCollectibleGet = onCollectibleGet;
    this.onAutoVault = onAutoVault || (() => {});
  }

  setCanVault(enabled: boolean): void {
    this.canVault = enabled;
  }

  checkObstacleCollisions(obstacles: Obstacle[]): void {
    const playerState = this.player.getState();
    if (playerState === 'hit') return;

    // Dashing provides invincibility frames
    if (playerState === 'dashing') return;

    const playerHitbox = this.player.getHitbox();
    const playerBounds = playerHitbox.getBounds();
    const playerLane = this.player.getCurrentLane();

    for (const obstacle of obstacles) {
      if (!obstacle.active) continue;

      const obstacleBounds = obstacle.getBounds();
      const obstacleType = obstacle.getObstacleType();
      const obstacleLane = obstacle.getLane();

      // Check for auto-vault opportunity (only ground obstacles in same lane)
      if (
        this.canVault &&
        playerState === 'running' &&
        obstacleType === 'ground' &&
        obstacleLane === playerLane
      ) {
        const distanceToObstacle = playerBounds.y - obstacleBounds.bottom;

        if (
          distanceToObstacle > 0 &&
          distanceToObstacle < this.VAULT_DETECTION_DISTANCE
        ) {
          this.player.vault();
          this.onAutoVault();
          return;
        }
      }

      // Check actual collision
      if (this.boundsOverlap(playerBounds, obstacleBounds)) {
        // Vaulting or jumping avoids ground obstacles
        if (
          obstacleType === 'ground' &&
          (playerState === 'jumping' || playerState === 'vaulting')
        ) {
          continue;
        }

        // Sliding avoids air obstacles
        if (obstacleType === 'air' && playerState === 'sliding') {
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
