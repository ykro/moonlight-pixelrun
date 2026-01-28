import Phaser from 'phaser';
import { Obstacle } from '../entities/Obstacle';
import { Collectible } from '../entities/Collectible';
import { ObjectPool } from '../utils/ObjectPool';
import { LANES, SPEED, SPAWN } from '../constants/GameConstants';
import { LevelConfiguration, selectObstacle, LEVEL_CONFIGS } from '../constants/LevelConfig';

export class SpawnSystem {
  private scene: Phaser.Scene;
  private obstaclePool: ObjectPool<Obstacle>;
  private collectiblePool: ObjectPool<Collectible>;

  private spawnTimer: Phaser.Time.TimerEvent | null = null;
  private collectibleTimer: Phaser.Time.TimerEvent | null = null;

  private levelConfig: LevelConfiguration;
  private currentInterval: number;
  private speed: number;
  private lastSpawnedLane: number = -1;

  constructor(scene: Phaser.Scene, levelConfig?: LevelConfiguration) {
    this.scene = scene;
    this.levelConfig = levelConfig || LEVEL_CONFIGS[0];
    this.currentInterval = this.levelConfig.spawnInterval;
    this.speed = this.levelConfig.initialSpeed;

    this.obstaclePool = new ObjectPool<Obstacle>(
      () => {
        const obstacle = new Obstacle(scene);
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

    // Spawn first collectible quickly, then every 1.5s
    this.scene.time.delayedCall(500, () => this.spawnCollectible());
    this.collectibleTimer = this.scene.time.addEvent({
      delay: 1500,
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

    // Select lane, avoiding same lane twice in a row (mostly)
    let lane: number;
    do {
      lane = Phaser.Math.Between(LANES.LEFT, LANES.RIGHT);
    } while (lane === this.lastSpawnedLane && Math.random() > 0.3);

    this.lastSpawnedLane = lane;

    // Select obstacle type based on level config weights
    const obstacleConfig = selectObstacle(this.levelConfig);
    obstacle.spawn(lane, obstacleConfig);
  }

  private spawnCollectible(): void {
    if (Math.random() > this.levelConfig.collectibleChance) return;

    const collectible = this.collectiblePool.get();
    const lane = Phaser.Math.Between(LANES.LEFT, LANES.RIGHT);
    const types = this.levelConfig.collectibleTypes;
    const type = types[Math.floor(Math.random() * types.length)];
    collectible.spawn(lane, type);
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
    const speedIncrement = (this.levelConfig.maxSpeed - this.levelConfig.initialSpeed) / 20;
    this.speed = Math.min(this.speed + speedIncrement, this.levelConfig.maxSpeed);

    const intervalDecrement = (this.levelConfig.spawnInterval - this.levelConfig.minSpawnInterval) / 20;
    this.currentInterval = Math.max(
      this.currentInterval - intervalDecrement,
      this.levelConfig.minSpawnInterval
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
    this.speed = this.levelConfig.initialSpeed;
    this.currentInterval = this.levelConfig.spawnInterval;
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
