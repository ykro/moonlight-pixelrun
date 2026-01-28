import Phaser from 'phaser';
// Using this.scale.width/height for dynamic sizing

export interface CharacterStats {
  endurance: number;
  speed: number;
  agility: number;
  recovery: number;
}

export interface CharacterData {
  id: string;
  name: string;
  color: number;
  specialty: string;
  description: string;
  stats: CharacterStats;
}

const CHARACTERS: CharacterData[] = [
  {
    id: 'gabriel',
    name: 'Gabriel',
    color: 0x4a90d9,
    specialty: 'PODIO ULTRA',
    description: 'Consistencia para hacer podio en ultras de montaña',
    stats: { endurance: 85, speed: 90, agility: 88, recovery: 80 },
  },
  {
    id: 'otto',
    name: 'Otto',
    color: 0x8b4557,
    specialty: 'ULTRA DISTANCIA',
    description: 'Especialista en carreras de más de 700km',
    stats: { endurance: 99, speed: 70, agility: 75, recovery: 95 },
  },
  {
    id: 'mauro',
    name: 'Mauro',
    color: 0xd52b1e,
    specialty: 'VELOCIDAD MONTAÑA',
    description: 'Velocidad explosiva en ultras de montaña',
    stats: { endurance: 80, speed: 95, agility: 92, recovery: 78 },
  },
];

export class CharacterSelectScene extends Phaser.Scene {
  private selectedIndex: number = 0;
  private characterSprite!: Phaser.GameObjects.Container;
  private nameText!: Phaser.GameObjects.Text;
  private specialtyText!: Phaser.GameObjects.Text;
  private descText!: Phaser.GameObjects.Text;
  private statBars: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private thumbs: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create(): void {
    const centerX = this.scale.width / 2;

    // Background
    if (this.textures.exists('bg_character_select')) {
      const bg = this.add.image(centerX, this.scale.height / 2, 'bg_character_select');
      bg.setDisplaySize(this.scale.width, this.scale.height);
      bg.setDepth(-10);
    } else {
      this.add.rectangle(centerX, this.scale.height / 2, this.scale.width, this.scale.height, 0x0a0a15).setDepth(-10);
    }

    // Title
    this.add.text(centerX, 20, 'SELECT RUNNER', {
      fontSize: '14px',
      color: '#4a90d9',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Large character sprite container (front view)
    this.characterSprite = this.add.container(centerX, 95);
    this.createCharacterSprite(CHARACTERS[0]);

    // Character name
    this.nameText = this.add.text(centerX, 155, CHARACTERS[0].name.toUpperCase(), {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Specialty badge
    this.specialtyText = this.add.text(centerX, 175, CHARACTERS[0].specialty, {
      fontSize: '10px',
      color: '#f1c40f',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
      backgroundColor: '#333333',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5);

    // Description
    this.descText = this.add.text(centerX, 195, CHARACTERS[0].description, {
      fontSize: '9px',
      color: '#cccccc',
      fontFamily: 'Arial, Helvetica, sans-serif',
      wordWrap: { width: 160 },
      align: 'center',
    }).setOrigin(0.5);

    // Stats panel
    this.createStatsPanel(centerX, 220);

    // Thumbnail selectors
    this.createThumbnails(centerX, 280);

    // Confirm button
    const confirmBtn = this.add.rectangle(centerX, 310, 90, 24, 0x4a90d9);
    this.add.text(centerX, 310, 'START', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    confirmBtn.setInteractive({ useHandCursor: true });
    confirmBtn.on('pointerdown', () => this.confirmSelection());
    confirmBtn.on('pointerover', () => confirmBtn.setFillStyle(0x5ba0e9));
    confirmBtn.on('pointerout', () => confirmBtn.setFillStyle(0x4a90d9));

    // Keyboard controls
    this.input.keyboard?.on('keydown-LEFT', () => this.navigate(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.navigate(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.confirmSelection());
    this.input.keyboard?.on('keydown-SPACE', () => this.confirmSelection());

    // Swipe support
    let startX_touch = 0;
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      startX_touch = pointer.x;
    });
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const diff = pointer.x - startX_touch;
      if (Math.abs(diff) > 30) {
        this.navigate(diff > 0 ? 1 : -1);
      }
    });

    this.updateSelection();
  }

  private createCharacterSprite(char: CharacterData): void {
    this.characterSprite.removeAll(true);

    const textureKey = `player_${char.id}_front`;
    const sprite = this.add.image(0, 0, textureKey);
    sprite.setDisplaySize(48, 60);
    this.characterSprite.add(sprite);
  }

  private createStatsPanel(centerX: number, startY: number): void {
    const stats = ['endurance', 'speed', 'agility', 'recovery'];
    const labels = ['END', 'SPD', 'AGI', 'REC'];
    const barWidth = 70;
    const barHeight = 8;

    stats.forEach((stat, index) => {
      const y = startY + index * 14;

      // Label
      this.add.text(centerX - 60, y, labels[index], {
        fontSize: '9px',
        color: '#aaaaaa',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      // Background bar
      this.add.rectangle(centerX + 10, y, barWidth, barHeight, 0x333333).setOrigin(0, 0.5);

      // Value bar
      const valueBar = this.add.rectangle(centerX + 10, y, 0, barHeight - 2, 0x4a90d9).setOrigin(0, 0.5);
      this.statBars.set(stat, valueBar);

      // Value text
      const valueText = this.add.text(centerX + 85, y, '0', {
        fontSize: '9px',
        color: '#ffffff',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      this.statBars.set(`${stat}_text`, valueText as unknown as Phaser.GameObjects.Rectangle);
    });
  }

  private createThumbnails(centerX: number, y: number): void {
    const spacing = 45;
    const startX = centerX - spacing;

    CHARACTERS.forEach((char, index) => {
      const x = startX + index * spacing;
      const container = this.add.container(x, y);

      const bg = this.add.rectangle(0, 0, 28, 28, 0x222222);
      bg.setStrokeStyle(2, 0x333333);

      const textureKey = `player_${char.id}_front`;
      const thumb = this.add.image(0, 0, textureKey);
      thumb.setDisplaySize(20, 25);

      container.add([bg, thumb]);
      container.setInteractive(new Phaser.Geom.Rectangle(-14, -14, 28, 28), Phaser.Geom.Rectangle.Contains);
      container.on('pointerdown', () => this.selectCharacter(index));

      this.thumbs.push(container);
    });
  }

  private navigate(direction: number): void {
    this.selectedIndex = Phaser.Math.Wrap(
      this.selectedIndex + direction,
      0,
      CHARACTERS.length
    );
    this.updateSelection();
  }

  private selectCharacter(index: number): void {
    this.selectedIndex = index;
    this.updateSelection();
  }

  private updateSelection(): void {
    const char = CHARACTERS[this.selectedIndex];

    // Update character sprite
    this.createCharacterSprite(char);

    // Animate sprite entrance
    this.characterSprite.setScale(0.8);
    this.characterSprite.setAlpha(0.5);
    this.tweens.add({
      targets: this.characterSprite,
      scale: 1,
      alpha: 1,
      duration: 150,
      ease: 'Back.easeOut',
    });

    // Update text
    this.nameText.setText(char.name.toUpperCase());
    this.specialtyText.setText(char.specialty);
    this.descText.setText(char.description);

    // Update stats with animation
    const stats = ['endurance', 'speed', 'agility', 'recovery'] as const;
    stats.forEach((stat) => {
      const bar = this.statBars.get(stat);
      const textObj = this.statBars.get(`${stat}_text`);
      const value = char.stats[stat];

      if (bar) {
        this.tweens.add({
          targets: bar,
          width: (value / 100) * 70,
          duration: 300,
          ease: 'Power2',
        });

        const color = value >= 90 ? 0x2ecc71 : value >= 80 ? 0x4a90d9 : value >= 70 ? 0xf1c40f : 0xe74c3c;
        bar.setFillStyle(color);
      }

      if (textObj) {
        (textObj as unknown as Phaser.GameObjects.Text).setText(value.toString());
      }
    });

    // Highlight selected thumbnail
    this.thumbs.forEach((thumb, index) => {
      const bg = thumb.getAt(0) as Phaser.GameObjects.Rectangle;
      if (index === this.selectedIndex) {
        bg.setStrokeStyle(2, 0xffff00);
        thumb.setScale(1.1);
      } else {
        bg.setStrokeStyle(2, 0x333333);
        thumb.setScale(1);
        thumb.setAlpha(0.6);
      }
      thumb.setAlpha(index === this.selectedIndex ? 1 : 0.6);
    });
  }

  private confirmSelection(): void {
    const selected = CHARACTERS[this.selectedIndex];

    // Store selection in registry for other scenes
    this.registry.set('selectedCharacter', selected);

    // Flash effect
    this.cameras.main.flash(200, 255, 255, 255);

    this.time.delayedCall(200, () => {
      this.scene.start('LevelSelectScene');
    });
  }
}

export { CHARACTERS };
