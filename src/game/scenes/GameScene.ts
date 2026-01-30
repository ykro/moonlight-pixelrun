import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { LaneSystem } from '../systems/LaneSystem';
import { InputSystem } from '../systems/InputSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { EvolutionSystem, EvolutionLevel } from '../systems/EvolutionSystem';
import { AudioSystem } from '../systems/AudioSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
// GAME_WIDTH no longer needed - using this.scale.width for dynamic sizing
import { getLevelConfig, LevelConfiguration, LEVEL_CONFIGS } from '../constants/LevelConfig';
import { CharacterData } from './CharacterSelectScene';
import { LevelData, LevelSelectScene } from './LevelSelectScene';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private laneSystem!: LaneSystem;
  private inputSystem!: InputSystem;
  private spawnSystem!: SpawnSystem;
  private collisionSystem!: CollisionSystem;
  private evolutionSystem!: EvolutionSystem;
  private audioSystem!: AudioSystem;
  private particleSystem!: ParticleSystem;

  private distance: number = 0;
  private isGameOver: boolean = false;
  private isPaused: boolean = false;
  private pauseOverlay: Phaser.GameObjects.Container | null = null;
  private speedIncreaseTimer!: Phaser.Time.TimerEvent;

  private selectedCharacter!: CharacterData;
  private selectedLevel!: LevelData;
  private levelConfig!: LevelConfiguration;

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

    // Get level configuration
    this.levelConfig = getLevelConfig(this.selectedLevel.id);

    // Create systems with level config
    this.laneSystem = new LaneSystem(this, this.levelConfig.themeColors, this.selectedLevel.id);
    this.laneSystem.setScrollSpeed(this.levelConfig.initialSpeed);

    this.player = new Player(this, this.selectedCharacter.id);

    this.spawnSystem = new SpawnSystem(this, this.levelConfig);
    this.spawnSystem.start();

    this.inputSystem = new InputSystem(this, this.player);

    this.collisionSystem = new CollisionSystem(
      this,
      this.player,
      this.handleObstacleHit.bind(this),
      this.handleCollectibleGet.bind(this),
      this.handleAutoVault.bind(this)
    );

    this.evolutionSystem = new EvolutionSystem(this, this.handleLevelUp.bind(this));

    this.audioSystem = new AudioSystem(this, `music_${this.selectedLevel.id}`);
    this.particleSystem = new ParticleSystem(this);

    // Connect player actions to audio
    this.setupPlayerAudio();

    this.speedIncreaseTimer = this.time.addEvent({
      delay: 5000,
      callback: this.increaseSpeed,
      callbackScope: this,
      loop: true,
    });

    // Show level name at start
    this.showLevelName();

    this.scene.launch('UIScene', {
      getDistance: () => this.distance,
      getEvolutionProgress: () => this.evolutionSystem.getProgress(),
      getEvolutionLevel: () => this.evolutionSystem.getCurrentLevel().name,
    });

    this.events.emit('game-started');

    // Pause with P or UI button
    this.input.keyboard?.on('keydown-P', () => this.togglePause());
    this.events.on('toggle-pause', () => this.togglePause());

    // Exit with ESC or UI button
    this.input.keyboard?.on('keydown-ESC', () => this.exitLevel());
    this.events.on('exit-level', () => this.exitLevel());
  }

  private showLevelName(): void {
    const levelText = this.add.text(
      this.scale.width / 2, 80,
      this.levelConfig.name.toUpperCase(),
      {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'monospace',
        stroke: '#000000',
        strokeThickness: 2,
      }
    ).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: levelText,
      alpha: 1,
      duration: 500,
      hold: 1500,
      yoyo: true,
      onComplete: () => levelText.destroy(),
    });
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver || this.isPaused) return;

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

  private setupPlayerAudio(): void {
    this.events.on('player-jump', () => this.audioSystem.playJump());
    this.events.on('player-slide', () => this.audioSystem.playSlide());
    this.events.on('player-dash', () => {
      this.audioSystem.playDash();
    });
  }

  private handleObstacleHit(): void {
    this.audioSystem.playHit();
    this.gameOver();
  }

  private handleCollectibleGet(): void {
    this.evolutionSystem.addPoints(1);
    this.audioSystem.playCollect();
    this.particleSystem.emitCollect(this.player.x, this.player.y - 20);
    this.events.emit('collectible-collected');
  }

  private handleAutoVault(): void {
    this.audioSystem.playVault();
    this.events.emit('auto-vault');
    this.cameras.main.flash(50, 255, 255, 0, true);
  }

  private handleLevelUp(level: EvolutionLevel): void {
    this.events.emit('level-up', level);

    if (level.abilities.includes('vault')) {
      this.collisionSystem.setCanVault(true);
    }

    if (level.abilities.includes('dash')) {
      this.inputSystem.setCanDash(true);
    }

    // Audio and visual feedback
    this.audioSystem.playLevelUp();
    this.particleSystem.emitLevelUp(this.player.x, this.player.y);
    this.particleSystem.emitScreenFlash(0xffff00);

    const levelUpText = this.add.text(
      this.scale.width / 2, 160,
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

    // Check for level unlocks
    this.checkLevelUnlocks();

    // Save best distance for this level
    this.saveBestDistance();

    this.time.delayedCall(1000, () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', {
        distance: Math.floor(this.distance),
        evolutionLevel: this.evolutionSystem.getCurrentLevel().name,
        levelId: this.levelConfig.id,
        levelName: this.levelConfig.name,
      });
    });
  }

  private checkLevelUnlocks(): void {
    const currentIndex = LEVEL_CONFIGS.findIndex(l => l.id === this.levelConfig.id);
    const nextLevel = LEVEL_CONFIGS[currentIndex + 1];

    if (nextLevel && this.distance >= nextLevel.unlockRequirement) {
      LevelSelectScene.unlockLevel(nextLevel.id);
    }
  }

  private saveBestDistance(): void {
    try {
      const key = `moonlight_best_${this.levelConfig.id}`;
      const current = parseInt(localStorage.getItem(key) || '0', 10);
      if (this.distance > current) {
        localStorage.setItem(key, Math.floor(this.distance).toString());
      }
    } catch {
      // Ignore storage errors
    }
  }

  private togglePause(): void {
    if (this.isGameOver) return;

    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.scene.pause();
      this.audioSystem?.stopMusic();

      const w = this.scale.width;
      const h = this.scale.height;

      // Create overlay in a separate non-paused way
      this.scene.resume();  // briefly resume to add overlay
      this.isPaused = true; // keep flag

      this.pauseOverlay = this.add.container(w / 2, h / 2);
      const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.7);
      const text = this.add.text(0, -15, 'PAUSED', {
        fontSize: '18px', color: '#ffffff',
        fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: 'bold',
      }).setOrigin(0.5);
      const hint = this.add.text(0, 15, 'P to resume  |  ESC to exit', {
        fontSize: '10px', color: '#888888',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }).setOrigin(0.5);

      this.pauseOverlay.add([bg, text, hint]);
      this.pauseOverlay.setDepth(300);
    } else {
      this.pauseOverlay?.destroy();
      this.pauseOverlay = null;
      this.audioSystem?.playTrack(`music_${this.selectedLevel.id}`);
    }
  }

  private exitLevel(): void {
    this.isGameOver = true; // prevent further updates
    this.isPaused = false;
    this.pauseOverlay?.destroy();
    this.pauseOverlay = null;
    this.scene.stop('UIScene');
    this.audioSystem?.stopMusic();
    this.scene.start('LevelSelectScene');
  }

  shutdown(): void {
    this.audioSystem?.stopMusic();
    this.inputSystem?.destroy();
    this.laneSystem?.destroy();
    this.spawnSystem?.reset();
    this.evolutionSystem?.reset();
    this.particleSystem?.destroy();
  }
}
