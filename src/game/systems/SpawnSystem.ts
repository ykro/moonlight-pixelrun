import Phaser from 'phaser';
import { Obstacle } from '../entities/Obstacle';
import { Collectible } from '../entities/Collectible';
import { ObjectPool } from '../utils/ObjectPool';
import { LANES, SPAWN, SPEED } from '../constants/GameConstants';

export class SpawnSystem {
  private scene: Phaser.Scene;
  private obstaclePool: ObjectPool<Obstacle>;
  private collectiblePool: ObjectPool<Collectible>;

  private spawnTimer: Phaser.Time.TimerEvent | null = null;
  private collectibleTimer: Phaser.Time.TimerEvent | null = null;

  private currentInterval: number = SPAWN.INITIAL_INTERVAL;
  private speed: number = SPEED.INITIAL;
  private lastSpawnedLane: number = -1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.obstaclePool = new ObjectPool<Obstacle>(
      () => {
        const obstacle = new Obstacle(scene, 0, -100);
        obstacle.active = false;
        obstacle.visible = false;
        return obstacle;
      },
      15
    );

    this.collectiblePool = new ObjectPool<Collectible>(
      () => {
        const collectible = new Collectible(scene, 0, -100);
        collectible.active = false;
        collectible.visible = false;
        return collectible;
      },
      10
    );
  }

  start(): void {
    this.spawnTimer = this.scene.time.addEvent({
      delay: this.currentInterval,
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true,
    });

    this.collectibleTimer = this.scene.time.addEvent({
      delay: 3000,
      callback: this.spawnCollectible,
      callbackScope: this,
      loop: true,
    });
  }

  stop(): void {
    this.spawnTimer?.destroy();
    this.collectibleTimer?.destroy();
    this.spawnTimer = null;
    this.collectibleTimer = null;
  }

  private spawnObstacle(): void {
    const obstacle = this.obstaclePool.get();

    let lane: number;
    do {
      lane = Phaser.Math.Between(LANES.LEFT, LANES.RIGHT);
    } while (lane === this.lastSpawnedLane && Math.random() > 0.3);

    this.lastSpawnedLane = lane;

    const type = Math.random() > 0.85 ? 'air' : 'ground';
    obstacle.spawn(lane, type);
  }

  private spawnCollectible(): void {
    if (Math.random() > 0.6) return;

    const collectible = this.collectiblePool.get();
    const lane = Phaser.Math.Between(LANES.LEFT, LANES.RIGHT);
    collectible.spawn(lane);
  }

  update(delta: number): void {
    const moveAmount = (this.speed * delta) / 1000;

    this.obstaclePool.forEachActive((obstacle) => {
      obstacle.y += moveAmount;

      if (obstacle.isOffScreen()) {
        obstacle.deactivate();
      }
    });

    this.collectiblePool.forEachActive((collectible) => {
      collectible.y += moveAmount;

      if (collectible.isOffScreen()) {
        collectible.deactivate();
      }
    });
  }

  increaseSpeed(): void {
    this.speed = Math.min(this.speed + SPEED.INCREMENT, SPEED.MAX);

    this.currentInterval = Math.max(
      this.currentInterval - SPAWN.INTERVAL_DECREASE,
      SPAWN.MIN_INTERVAL
    );

    if (this.spawnTimer) {
      this.spawnTimer.destroy();
      this.spawnTimer = this.scene.time.addEvent({
        delay: this.currentInterval,
        callback: this.spawnObstacle,
        callbackScope: this,
        loop: true,
      });
    }
  }

  getSpeed(): number {
    return this.speed;
  }

  getActiveObstacles(): Obstacle[] {
    return this.obstaclePool.getActive();
  }

  getActiveCollectibles(): Collectible[] {
    return this.collectiblePool.getActive();
  }

  reset(): void {
    this.speed = SPEED.INITIAL;
    this.currentInterval = SPAWN.INITIAL_INTERVAL;
    this.lastSpawnedLane = -1;

    this.obstaclePool.forEachActive((obstacle) => {
      obstacle.deactivate();
    });

    this.collectiblePool.forEachActive((collectible) => {
      collectible.deactivate();
    });

    this.stop();
  }
}
