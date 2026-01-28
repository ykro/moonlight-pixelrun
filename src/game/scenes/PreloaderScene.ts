import Phaser from 'phaser';
import { PLAYER, OBSTACLE, GROUND, COLORS } from '../constants/GameConstants';
import { createSynthSounds } from '../systems/AudioSystem';

export class PreloaderScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloaderScene' });
  }

  preload(): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    const progressBox = this.add.rectangle(centerX, centerY, 100, 10, 0x222222);
    const progressBar = this.add.rectangle(centerX - 48, centerY, 0, 6, 0x4a90d9);
    progressBar.setOrigin(0, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.width = 96 * value;
    });

    this.load.on('complete', () => {
      progressBox.destroy();
      progressBar.destroy();
    });

    // Load player sprites (back view frame 1 + frame 2 + front)
    this.load.image('player_gabriel', 'assets/sprites/player_gabriel.png');
    this.load.image('player_gabriel_run2', 'assets/sprites/player_gabriel_run2.png');
    this.load.image('player_gabriel_front', 'assets/sprites/player_gabriel_front.png');
    this.load.image('player_otto', 'assets/sprites/player_otto.png');
    this.load.image('player_otto_run2', 'assets/sprites/player_otto_run2.png');
    this.load.image('player_otto_front', 'assets/sprites/player_otto_front.png');
    this.load.image('player_mauro', 'assets/sprites/player_mauro.png');
    this.load.image('player_mauro_run2', 'assets/sprites/player_mauro_run2.png');
    this.load.image('player_mauro_front', 'assets/sprites/player_mauro_front.png');

    // Load obstacle sprites
    this.load.image('obstacle_runner', 'assets/sprites/obstacle_runner.png');
    this.load.image('obstacle_cyclist', 'assets/sprites/obstacle_cyclist.png');
    this.load.image('obstacle_pedestrian', 'assets/sprites/obstacle_pedestrian.png');
    this.load.image('obstacle_parked_car', 'assets/sprites/obstacle_parked_car.png');
    this.load.image('obstacle_pothole', 'assets/sprites/obstacle_pothole.png');
    this.load.image('obstacle_traffic', 'assets/sprites/obstacle_traffic.png');

    // Load collectible sprites
    this.load.image('collectible_water', 'assets/sprites/collectible_water.png');
    this.load.image('collectible_gel', 'assets/sprites/collectible_gel.png');
    this.load.image('collectible_banana', 'assets/sprites/collectible_banana.png');
    this.load.image('powerup_shield', 'assets/sprites/powerup_shield.png');

    // Load music tracks
    this.load.audio('music_menu', 'assets/audio/music_menu.mp3');
    this.load.audio('music_las_americas', 'assets/audio/music_las_americas.mp3');
    this.load.audio('music_hill_reps', 'assets/audio/music_hill_reps.mp3');
    this.load.audio('music_fondo_vh', 'assets/audio/music_fondo_vh.mp3');

    // Load background sprites
    this.load.image('bg_menu', 'assets/sprites/bg_menu.png');
    this.load.image('bg_character_select', 'assets/sprites/bg_character_select.png');
    this.load.image('bg_las_americas', 'assets/sprites/bg_las_americas.png');
    this.load.image('bg_hill_reps', 'assets/sprites/bg_hill_reps.png');
    this.load.image('bg_fondo_vh', 'assets/sprites/bg_fondo_vh.png');
    this.load.image('bg_level_select', 'assets/sprites/bg_level_select.png');
    this.load.image('bg_game_over', 'assets/sprites/bg_game_over.png');
  }

  private createPlaceholderAssets(): void {
    // Player placeholders (back view)
    this.createPlayerPlaceholder('player_gabriel', 0x4a90d9);
    this.createPlayerPlaceholder('player_otto', 0x8b4557);
    this.createPlayerPlaceholder('player_mauro', 0xd52b1e);

    // Player front placeholders
    this.createPlayerFrontPlaceholder('player_gabriel_front', 0x4a90d9);
    this.createPlayerFrontPlaceholder('player_otto_front', 0x8b4557);
    this.createPlayerFrontPlaceholder('player_mauro_front', 0xd52b1e);

    // Obstacle placeholders
    this.createObstaclePlaceholder('obstacle_runner', 0x4a90d9, 16, 24);
    this.createObstaclePlaceholder('obstacle_cyclist', 0xf39c12, 24, 24);
    this.createObstaclePlaceholder('obstacle_pedestrian', 0x9b59b6, 16, 24);
    this.createObstaclePlaceholder('obstacle_parked_car', 0x7f8c8d, 28, 20);
    this.createObstaclePlaceholder('obstacle_pothole', 0x2c3e50, 20, 12);
    this.createObstaclePlaceholder('obstacle_traffic', 0xe74c3c, 20, 24);

    // Collectible placeholder
    this.createCollectiblePlaceholder();

    // Ground texture
    // Ground texture uses full screen width
    const gw = this.scale.width;
    const groundGraphics = this.make.graphics({ x: 0, y: 0 });
    groundGraphics.fillStyle(COLORS.GROUND);
    groundGraphics.fillRect(0, 0, gw, GROUND.HEIGHT);
    for (let i = 0; i < Math.ceil(gw / 32) + 1; i++) {
      groundGraphics.fillStyle(COLORS.LANE_LINE);
      groundGraphics.fillRect(i * 32 + 10, 0, 12, 4);
    }
    groundGraphics.generateTexture('ground', gw, GROUND.HEIGHT);
    groundGraphics.destroy();
  }

  private createPlayerPlaceholder(key: string, color: number): void {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(color);
    g.fillRect(0, 0, PLAYER.WIDTH, PLAYER.HEIGHT);
    g.fillStyle(0x000000);
    g.fillRect(4, 2, 8, 4); // Hair
    g.generateTexture(key, PLAYER.WIDTH, PLAYER.HEIGHT);
    g.destroy();
  }

  private createPlayerFrontPlaceholder(key: string, color: number): void {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(color);
    g.fillRect(0, 16, 64, 48); // Body
    g.fillStyle(0xf5d0a9);
    g.fillRect(16, 0, 32, 20); // Head
    g.fillStyle(0x000000);
    g.fillRect(24, 8, 4, 4); // Left eye
    g.fillRect(36, 8, 4, 4); // Right eye
    g.generateTexture(key, 64, 80);
    g.destroy();
  }

  private createObstaclePlaceholder(key: string, color: number, w: number, h: number): void {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(color);
    g.fillRect(0, 0, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private createCollectiblePlaceholder(): void {
    if (!this.textures.exists('collectible_water')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x3498db);
      g.fillRect(4, 0, 8, 16);
      g.fillStyle(0xffffff);
      g.fillRect(4, 0, 8, 3);
      g.generateTexture('collectible_water', 16, 16);
      g.destroy();
    }
    if (!this.textures.exists('collectible_banana')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xf1c40f);
      g.fillRect(2, 2, 12, 12);
      g.generateTexture('collectible_banana', 16, 16);
      g.destroy();
    }
  }

  create(): void {
    // Create placeholder assets only for missing textures (after load completes)
    this.createPlaceholderAssets();

    // Create synthesized sound effects
    createSynthSounds(this);

    this.scene.start('MenuScene');
  }
}
