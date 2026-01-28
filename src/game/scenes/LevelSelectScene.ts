import Phaser from 'phaser';
// Using this.scale.width for dynamic sizing

export interface LevelData {
  id: string;
  name: string;
  subtitle: string;
  theme: 'night' | 'day';
  color: number;
  unlocked: boolean;
}

const LEVELS: LevelData[] = [
  {
    id: 'las_americas',
    name: 'Las Américas',
    subtitle: 'Night Run',
    theme: 'night',
    color: 0x1a1a2e,
    unlocked: true,
  },
  {
    id: 'hill_reps',
    name: 'Hill Reps',
    subtitle: 'Uphill Challenge',
    theme: 'night',
    color: 0x2d4a3e,
    unlocked: true,
  },
  {
    id: 'fondo_vh',
    name: 'Fondo VH',
    subtitle: 'Daylight Dash',
    theme: 'day',
    color: 0x87ceeb,
    unlocked: true,
  },
];

export class LevelSelectScene extends Phaser.Scene {
  private selectedIndex: number = 0;
  private levelCards: Phaser.GameObjects.Container[] = [];
  private unlockedLevels: Set<string> = new Set(['las_americas']);

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create(): void {
    this.loadUnlockedLevels();

    const centerX = this.scale.width / 2;

    // Background
    if (this.textures.exists('bg_level_select')) {
      const bg = this.add.image(centerX, this.scale.height / 2, 'bg_level_select');
      bg.setDisplaySize(this.scale.width, this.scale.height);
      bg.setDepth(-10);
    } else {
      this.add.rectangle(centerX, this.scale.height / 2, this.scale.width, this.scale.height, 0x0a0a15).setDepth(-10);
    }

    // Title
    this.add.text(centerX, 25, 'SELECT LEVEL', {
      fontSize: '16px',
      color: '#4a90d9',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Show selected character
    const selectedChar = this.registry.get('selectedCharacter');
    if (selectedChar) {
      this.add.text(centerX, 48, `Runner: ${selectedChar.name}`, {
        fontSize: '11px',
        color: '#888888',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }).setOrigin(0.5);
    }

    // Level cards
    const cardStartY = 90;
    const cardSpacing = 70;

    LEVELS.forEach((level, index) => {
      const isUnlocked = this.unlockedLevels.has(level.id);
      const card = this.createLevelCard(level, index, centerX, cardStartY + index * cardSpacing, isUnlocked);
      this.levelCards.push(card);
    });

    // Navigation hint
    this.add.text(centerX, 300, 'TAP TO SELECT', {
      fontSize: '11px',
      color: '#888888',
      fontFamily: 'Arial, Helvetica, sans-serif',
    }).setOrigin(0.5);

    // Keyboard controls
    this.input.keyboard?.on('keydown-UP', () => this.navigate(-1));
    this.input.keyboard?.on('keydown-DOWN', () => this.navigate(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.confirmSelection());
    this.input.keyboard?.on('keydown-SPACE', () => this.confirmSelection());

    this.updateSelection();
  }

  private createLevelCard(
    level: LevelData,
    index: number,
    x: number,
    y: number,
    isUnlocked: boolean
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Card background
    const bg = this.add.rectangle(0, 0, 140, 55, level.color);
    bg.setStrokeStyle(2, isUnlocked ? 0x4a90d9 : 0x444444);

    // Level name
    const nameText = this.add.text(0, -12, level.name, {
      fontSize: '14px',
      color: isUnlocked ? '#ffffff' : '#666666',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Subtitle
    const subText = this.add.text(0, 8, level.subtitle, {
      fontSize: '10px',
      color: isUnlocked ? '#aaaaaa' : '#444444',
      fontFamily: 'Arial, Helvetica, sans-serif',
    }).setOrigin(0.5);

    container.add([bg, nameText, subText]);

    // Lock icon for locked levels
    if (!isUnlocked) {
      const lockBg = this.add.rectangle(0, 0, 140, 55, 0x000000, 0.6);
      const lockIcon = this.add.text(0, -5, '🔒', {
        fontSize: '16px',
      }).setOrigin(0.5);
      const lockText = this.add.text(0, 15, 'LOCKED', {
        fontSize: '10px',
        color: '#888888',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      container.add([lockBg, lockIcon, lockText]);
    } else {
      // Make unlocked cards interactive
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => {
        this.selectedIndex = index;
        this.updateSelection();
        this.confirmSelection();
      });
      bg.on('pointerover', () => {
        this.selectedIndex = index;
        this.updateSelection();
      });
    }

    return container;
  }

  private navigate(direction: number): void {
    let newIndex = this.selectedIndex + direction;

    // Find next unlocked level
    while (newIndex >= 0 && newIndex < LEVELS.length) {
      if (this.unlockedLevels.has(LEVELS[newIndex].id)) {
        this.selectedIndex = newIndex;
        this.updateSelection();
        return;
      }
      newIndex += direction;
    }
  }

  private updateSelection(): void {
    this.levelCards.forEach((card, index) => {
      const isSelected = index === this.selectedIndex;
      const isUnlocked = this.unlockedLevels.has(LEVELS[index].id);

      if (isUnlocked) {
        card.setScale(isSelected ? 1.05 : 1);
        card.setAlpha(isSelected ? 1 : 0.7);
      }
    });
  }

  private confirmSelection(): void {
    const level = LEVELS[this.selectedIndex];

    if (!this.unlockedLevels.has(level.id)) {
      // Shake locked card
      this.tweens.add({
        targets: this.levelCards[this.selectedIndex],
        x: this.levelCards[this.selectedIndex].x + 5,
        duration: 50,
        yoyo: true,
        repeat: 3,
      });
      return;
    }

    // Store selection
    this.registry.set('selectedLevel', level);

    // Flash and start game
    this.cameras.main.flash(200, 255, 255, 255);

    this.time.delayedCall(200, () => {
      this.scene.start('GameScene');
    });
  }

  private loadUnlockedLevels(): void {
    try {
      const saved = localStorage.getItem('moonlight_unlocked_levels');
      if (saved) {
        const levels = JSON.parse(saved) as string[];
        this.unlockedLevels = new Set(levels);
      }
    } catch {
      // Default: only first level unlocked
    }

    // Always ensure first level is unlocked
    this.unlockedLevels.add('las_americas');
  }

  static unlockLevel(levelId: string): void {
    try {
      const saved = localStorage.getItem('moonlight_unlocked_levels');
      const levels = saved ? JSON.parse(saved) as string[] : ['las_americas'];
      if (!levels.includes(levelId)) {
        levels.push(levelId);
        localStorage.setItem('moonlight_unlocked_levels', JSON.stringify(levels));
      }
    } catch {
      // Ignore storage errors
    }
  }
}

export { LEVELS };
