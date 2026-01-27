import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants/GameConstants';

export interface CharacterData {
  id: string;
  name: string;
  color: number;
  description: string;
}

const CHARACTERS: CharacterData[] = [
  {
    id: 'gabriel',
    name: 'Gabriel',
    color: 0xffffff,
    description: 'Speed runner',
  },
  {
    id: 'otto',
    name: 'Otto',
    color: 0x8b4557,
    description: 'Endurance master',
  },
  {
    id: 'mauro',
    name: 'Mauro',
    color: 0xd52b1e,
    description: 'Trail blazer',
  },
];

export class CharacterSelectScene extends Phaser.Scene {
  private selectedIndex: number = 0;
  private characterPreviews: Phaser.GameObjects.Rectangle[] = [];
  private nameText!: Phaser.GameObjects.Text;
  private descText!: Phaser.GameObjects.Text;
  private selector!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create(): void {
    const centerX = GAME_WIDTH / 2;

    // Title
    this.add.text(centerX, 30, 'SELECT RUNNER', {
      fontSize: '12px',
      color: '#4a90d9',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Character previews
    const startX = centerX - 50;
    const previewY = 120;

    CHARACTERS.forEach((char, index) => {
      const x = startX + index * 50;

      // Character box
      const preview = this.add.rectangle(x, previewY, 32, 40, char.color);
      this.characterPreviews.push(preview);

      // Eyes on character
      this.add.rectangle(x - 4, previewY - 8, 4, 4, 0x000000);
      this.add.rectangle(x + 4, previewY - 8, 4, 4, 0x000000);

      // Make clickable
      preview.setInteractive({ useHandCursor: true });
      preview.on('pointerdown', () => this.selectCharacter(index));
    });

    // Selector highlight
    this.selector = this.add.rectangle(
      startX,
      previewY,
      38,
      46,
      0xffff00,
      0
    );
    this.selector.setStrokeStyle(2, 0xffff00);

    // Character name
    this.nameText = this.add.text(centerX, 170, CHARACTERS[0].name.toUpperCase(), {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Character description
    this.descText = this.add.text(centerX, 190, CHARACTERS[0].description, {
      fontSize: '8px',
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Navigation hint
    this.add.text(centerX, 250, '< SWIPE TO SELECT >', {
      fontSize: '8px',
      color: '#666666',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Confirm button
    const confirmBtn = this.add.rectangle(centerX, 290, 80, 24, 0x4a90d9);
    const confirmText = this.add.text(centerX, 290, 'CONFIRM', {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'monospace',
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
    const startX = GAME_WIDTH / 2 - 50;

    // Move selector
    this.tweens.add({
      targets: this.selector,
      x: startX + this.selectedIndex * 50,
      duration: 100,
      ease: 'Power2',
    });

    // Update text
    this.nameText.setText(char.name.toUpperCase());
    this.descText.setText(char.description);

    // Highlight selected preview
    this.characterPreviews.forEach((preview, index) => {
      preview.setAlpha(index === this.selectedIndex ? 1 : 0.5);
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
