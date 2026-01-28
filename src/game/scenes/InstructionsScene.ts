import Phaser from 'phaser';

export class InstructionsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InstructionsScene' });
  }

  create(): void {
    const centerX = this.scale.width / 2;
    const w = this.scale.width;
    const h = this.scale.height;

    // Dark background
    this.add.rectangle(centerX, h / 2, w, h, 0x0a0a15);

    const bold = { fontStyle: 'bold' as const };
    const font = 'Arial, Helvetica, sans-serif';

    // Title
    this.add.text(centerX, 18, 'HOW TO PLAY', {
      fontSize: '18px', color: '#4a90d9', fontFamily: font, ...bold,
    }).setOrigin(0.5);

    // Controls
    this.add.text(centerX, 48, 'CONTROLS', {
      fontSize: '13px', color: '#ffffff', fontFamily: font, ...bold,
    }).setOrigin(0.5);

    const controls = [
      '← →  Change lane',
      '↑  Jump over obstacles',
      '↓  Slide under obstacles',
    ];
    controls.forEach((text, i) => {
      this.add.text(centerX, 68 + i * 16, text, {
        fontSize: '11px', color: '#cccccc', fontFamily: font,
      }).setOrigin(0.5);
    });

    // Collectibles per level
    this.add.text(centerX, 125, 'COLLECT', {
      fontSize: '13px', color: '#ffffff', fontFamily: font, ...bold,
    }).setOrigin(0.5);

    const collectibles = [
      { key: 'collectible_water', label: 'Water', color: '#3498db', levels: '1, 2, 3' },
      { key: 'collectible_gel', label: 'Gel', color: '#e67e22', levels: '2, 3' },
      { key: 'collectible_banana', label: 'Banana', color: '#f1c40f', levels: '3' },
    ];

    const colStartX = centerX - 55;
    collectibles.forEach((c, i) => {
      const x = colStartX + i * 55;
      if (this.textures.exists(c.key)) {
        this.add.image(x, 150, c.key).setDisplaySize(20, 20);
      } else {
        this.add.rectangle(x, 150, 16, 16, parseInt(c.color.replace('#', '0x')));
      }
      this.add.text(x, 166, c.label, {
        fontSize: '10px', color: c.color, fontFamily: font, ...bold,
      }).setOrigin(0.5);
      this.add.text(x, 178, `Lvl ${c.levels}`, {
        fontSize: '9px', color: '#888888', fontFamily: font,
      }).setOrigin(0.5);
    });

    // Evolution
    this.add.text(centerX, 200, 'EVOLUTION', {
      fontSize: '13px', color: '#ffffff', fontFamily: font, ...bold,
    }).setOrigin(0.5);

    const evolutions = [
      { name: 'Runner', desc: 'Run, Jump, Slide', color: '#888888', pts: 'Start' },
      { name: 'Athlete', desc: '+ Auto Vault', color: '#4a90d9', pts: '5 items' },
      { name: 'Champion', desc: '+ Dash (2 lanes)', color: '#f1c40f', pts: '15 items' },
    ];
    evolutions.forEach((evo, i) => {
      const y = 222 + i * 20;
      this.add.text(10, y, evo.pts, {
        fontSize: '10px', color: '#666666', fontFamily: font,
      }).setOrigin(0, 0.5);
      this.add.text(centerX - 10, y, evo.name, {
        fontSize: '11px', color: evo.color, fontFamily: font, ...bold,
      }).setOrigin(0, 0.5);
      this.add.text(w - 10, y, evo.desc, {
        fontSize: '10px', color: '#aaaaaa', fontFamily: font,
      }).setOrigin(1, 0.5);
    });

    // Continue
    const continueText = this.add.text(centerX, h - 20, 'TAP TO CONTINUE', {
      fontSize: '12px', color: '#888888', fontFamily: font,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: continueText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    const goNext = () => this.scene.start('CharacterSelectScene');
    this.input.once('pointerdown', goNext);
    this.input.keyboard?.once('keydown-SPACE', goNext);
    this.input.keyboard?.once('keydown-ENTER', goNext);
  }
}
