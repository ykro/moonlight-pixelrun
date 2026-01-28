import Phaser from 'phaser';

export class AudioSystem {
  private scene: Phaser.Scene;
  private musicEnabled: boolean = true;
  private sfxEnabled: boolean = true;

  private bgMusic: Phaser.Sound.BaseSound | null = null;

  constructor(scene: Phaser.Scene, trackKey?: string) {
    this.scene = scene;
    this.loadSettings();
    if (trackKey) {
      this.playTrack(trackKey);
    }
  }

  private resumeAudioContext(): void {
    const webAudio = this.scene.sound as Phaser.Sound.WebAudioSoundManager;
    if (webAudio.context && webAudio.context.state === 'suspended') {
      webAudio.context.resume();
    }
  }

  playTrack(key: string): void {
    if (!this.musicEnabled) return;
    if (!this.scene.cache.audio.exists(key)) return;

    this.stopMusic();
    this.resumeAudioContext();

    this.bgMusic = this.scene.sound.add(key, {
      volume: 0.25,
      loop: true,
    });
    this.bgMusic.play();
  }

  stopMusic(): void {
    this.bgMusic?.stop();
    this.bgMusic?.destroy();
    this.bgMusic = null;
  }

  private loadSettings(): void {
    try {
      this.musicEnabled = localStorage.getItem('moonlight_music') !== 'false';
      this.sfxEnabled = localStorage.getItem('moonlight_sfx') !== 'false';
    } catch {
      // Ignore storage errors
    }
  }

  playCollect(): void {
    if (!this.sfxEnabled) return;
    this.playSound('collect', { volume: 0.3 });
  }

  playJump(): void {
    if (!this.sfxEnabled) return;
    this.playSound('jump', { volume: 0.2 });
  }

  playSlide(): void {
    if (!this.sfxEnabled) return;
    this.playSound('slide', { volume: 0.2 });
  }

  playDash(): void {
    if (!this.sfxEnabled) return;
    this.playSound('dash', { volume: 0.4 });
  }

  playHit(): void {
    if (!this.sfxEnabled) return;
    this.playSound('hit', { volume: 0.5 });
  }

  playLevelUp(): void {
    if (!this.sfxEnabled) return;
    this.playSound('levelup', { volume: 0.5 });
  }

  playVault(): void {
    if (!this.sfxEnabled) return;
    this.playSound('vault', { volume: 0.3 });
  }

  private playSound(key: string, config?: Phaser.Types.Sound.SoundConfig): void {
    try {
      this.resumeAudioContext();
      if (this.scene.cache.audio.exists(key)) {
        this.scene.sound.play(key, config);
      }
    } catch {
      // Ignore audio errors
    }
  }

  toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    try {
      localStorage.setItem('moonlight_music', this.musicEnabled.toString());
    } catch {
      // Ignore storage errors
    }
    if (this.musicEnabled && this.bgMusic) {
      this.bgMusic.play();
    } else {
      this.bgMusic?.stop();
    }
    return this.musicEnabled;
  }

  toggleSfx(): boolean {
    this.sfxEnabled = !this.sfxEnabled;
    try {
      localStorage.setItem('moonlight_sfx', this.sfxEnabled.toString());
    } catch {
      // Ignore storage errors
    }
    return this.sfxEnabled;
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  isSfxEnabled(): boolean {
    return this.sfxEnabled;
  }
}

export function createSynthSounds(scene: Phaser.Scene): void {
  const soundManager = scene.sound as Phaser.Sound.WebAudioSoundManager;
  if (!soundManager.context) return;

  const ctx = soundManager.context;

  createSfx(scene, ctx, 'collect', 0.15, (t, dur) => {
    const freq = 800 + (t / dur) * 400;
    return Math.sin(2 * Math.PI * freq * t) * (1 - t / dur) * 0.3;
  });

  createSfx(scene, ctx, 'jump', 0.12, (t, dur) => {
    const freq = 200 + (t / dur) * 300;
    return Math.sin(2 * Math.PI * freq * t) * (1 - t / dur) * 0.2;
  });

  createSfx(scene, ctx, 'slide', 0.2, (t, dur) => {
    return (Math.random() * 2 - 1) * (1 - t / dur) * 0.15;
  });

  createSfx(scene, ctx, 'dash', 0.1, (t, dur) => {
    const noise = (Math.random() * 2 - 1) * 0.3;
    return (Math.sin(2 * Math.PI * 150 * t) + noise) * (1 - t / dur) * 0.3;
  });

  createSfx(scene, ctx, 'hit', 0.3, (t, dur) => {
    const freq = 100 - (t / dur) * 50;
    const noise = (Math.random() * 2 - 1) * 0.5;
    return (Math.sin(2 * Math.PI * freq * t) + noise) * (1 - t / dur) * 0.4;
  });

  createSfx(scene, ctx, 'levelup', 0.4, (t, dur) => {
    const notes = [523, 659, 784, 1047];
    const noteIndex = Math.floor((t / dur) * notes.length);
    const freq = notes[Math.min(noteIndex, notes.length - 1)];
    return Math.sin(2 * Math.PI * freq * t) * (1 - t / dur) * 0.25;
  });

  createSfx(scene, ctx, 'vault', 0.15, (t, dur) => {
    const freq = 400 + (t / dur) * 200;
    return Math.sin(2 * Math.PI * freq * t) * (1 - t / dur) * 0.2;
  });
}

function createSfx(
  scene: Phaser.Scene,
  ctx: AudioContext,
  key: string,
  duration: number,
  render: (t: number, duration: number) => number
): void {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(duration * sampleRate);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    data[i] = render(i / sampleRate, duration);
  }

  scene.cache.audio.add(key, { buffer, duration });
}
