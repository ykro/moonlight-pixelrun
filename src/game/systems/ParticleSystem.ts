import Phaser from 'phaser';
// Using scene.scale.width for dynamic sizing

export class ParticleSystem {
  private scene: Phaser.Scene;
  private collectEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private levelUpEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createParticleTextures();
    this.createEmitters();
  }

  private createParticleTextures(): void {
    // Small particle for collect effect
    if (!this.scene.textures.exists('particle_small')) {
      const graphics = this.scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0xffffff);
      graphics.fillRect(0, 0, 4, 4);
      graphics.generateTexture('particle_small', 4, 4);
      graphics.destroy();
    }

    // Star particle for level up
    if (!this.scene.textures.exists('particle_star')) {
      const graphics = this.scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0xffff00);
      graphics.fillRect(2, 0, 2, 6);
      graphics.fillRect(0, 2, 6, 2);
      graphics.generateTexture('particle_star', 6, 6);
      graphics.destroy();
    }

  }

  private createEmitters(): void {
    // Collect particles - burst upward
    this.collectEmitter = this.scene.add.particles(0, 0, 'particle_small', {
      speed: { min: 50, max: 100 },
      angle: { min: 250, max: 290 },
      scale: { start: 1, end: 0 },
      lifespan: 400,
      tint: [0x3498db, 0x2ecc71, 0xf1c40f],
      emitting: false,
    });
    this.collectEmitter.setDepth(100);

    // Level up particles - explosion
    this.levelUpEmitter = this.scene.add.particles(0, 0, 'particle_star', {
      speed: { min: 80, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0.2 },
      alpha: { start: 1, end: 0 },
      lifespan: 800,
      tint: [0xffff00, 0xffa500, 0xff6600],
      emitting: false,
    });
    this.levelUpEmitter.setDepth(100);
  }

  emitCollect(x: number, y: number): void {
    if (this.collectEmitter) {
      this.collectEmitter.emitParticleAt(x, y, 8);
    }
  }

  emitLevelUp(x: number, y: number): void {
    if (this.levelUpEmitter) {
      this.levelUpEmitter.emitParticleAt(x, y, 20);
    }
  }

  emitScreenFlash(color: number = 0xffff00): void {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const flash = this.scene.add.rectangle(
      w / 2,
      h / 2,
      w,
      h,
      color,
      0.3
    );
    flash.setDepth(200);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    });
  }

  destroy(): void {
    this.collectEmitter?.destroy();
    this.levelUpEmitter?.destroy();
  }
}
