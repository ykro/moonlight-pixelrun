import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { LaneSystem } from '../systems/LaneSystem';
import { InputSystem } from '../systems/InputSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { EvolutionSystem, EvolutionLevel } from '../systems/EvolutionSystem';
import { SPEED } from '../constants/GameConstants';
import { CharacterData } from './CharacterSelectScene';
import { LevelData } from './LevelSelectScene';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private laneSystem!: LaneSystem;
  private inputSystem!: InputSystem;
  private spawnSystem!: SpawnSystem;
  private collisionSystem!: CollisionSystem;
  private evolutionSystem!: EvolutionSystem;

  private distance: number = 0;
  private isGameOver: boolean = false;
  private speedIncreaseTimer!: Phaser.Time.TimerEvent;

  private selectedCharacter!: CharacterData;
  private selectedLevel!: LevelData;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.distance = 0;
    this.isGameOver = false;

    // Get selections from registry
    this.selectedCharacter = this.registry.get('selectedCharacter') || {
      id: 'gabriel',
      name: 'Gabriel',
      color: 0x4a90d9,
      description: 'Speed runner',
    };
    this.selectedLevel = this.registry.get('selectedLevel') || {
      id: 'las_americas',
      name: 'Las Américas',
      theme: 'night',
    };

    this.laneSystem = new LaneSystem(this);
    this.laneSystem.setScrollSpeed(SPEED.INITIAL);

    this.player = new Player(this, this.selectedCharacter.color);

    this.spawnSystem = new SpawnSystem(this);
    this.spawnSystem.start();

    this.inputSystem = new InputSystem(this, this.player);

    this.collisionSystem = new CollisionSystem(
      this,
      this.player,
      this.handleObstacleHit.bind(this),
      this.handleCollectibleGet.bind(this)
    );

    this.evolutionSystem = new EvolutionSystem(this, this.handleLevelUp.bind(this));

    this.speedIncreaseTimer = this.time.addEvent({
      delay: 5000,
      callback: this.increaseSpeed,
      callbackScope: this,
      loop: true,
    });

    this.scene.launch('UIScene', {
      getDistance: () => this.distance,
      getEvolutionProgress: () => this.evolutionSystem.getProgress(),
      getEvolutionLevel: () => this.evolutionSystem.getCurrentLevel().name,
    });

    this.events.emit('game-started');
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver) return;

    this.distance += (this.spawnSystem.getSpeed() * delta) / 1000;

    this.player.update();
    this.laneSystem.update(delta);
    this.spawnSystem.update(delta);

    this.collisionSystem.checkObstacleCollisions(
      this.spawnSystem.getActiveObstacles()
    );
    this.collisionSystem.checkCollectibleCollisions(
      this.spawnSystem.getActiveCollectibles()
    );
  }

  private handleObstacleHit(): void {
    this.gameOver();
  }

  private handleCollectibleGet(): void {
    this.evolutionSystem.addPoints(1);
    this.events.emit('collectible-collected');
  }

  private handleLevelUp(level: EvolutionLevel): void {
    this.events.emit('level-up', level);

    const levelUpText = this.add.text(
      90, 160,
      `${level.name.toUpperCase()}!`,
      {
        fontSize: '14px',
        color: '#ffff00',
        fontFamily: 'monospace',
        stroke: '#000000',
        strokeThickness: 2,
      }
    ).setOrigin(0.5);

    this.tweens.add({
      targets: levelUpText,
      y: 140,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => levelUpText.destroy(),
    });
  }

  private increaseSpeed(): void {
    this.spawnSystem.increaseSpeed();
    this.laneSystem.setScrollSpeed(this.spawnSystem.getSpeed());
  }

  private gameOver(): void {
    this.isGameOver = true;
    this.inputSystem.disable();
    this.spawnSystem.stop();
    this.speedIncreaseTimer.destroy();

    this.time.delayedCall(1000, () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', {
        distance: Math.floor(this.distance),
        evolutionLevel: this.evolutionSystem.getCurrentLevel().name,
      });
    });
  }

  shutdown(): void {
    this.inputSystem?.destroy();
    this.laneSystem?.destroy();
    this.spawnSystem?.reset();
    this.evolutionSystem?.reset();
  }
}
