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

    let y = 14;

    // Title
    this.add.text(centerX, y, 'CÓMO JUGAR', {
      fontSize: '16px', color: '#4a90d9', fontFamily: font, ...bold,
    }).setOrigin(0.5);

    y += 28;

    // Controls
    this.add.text(centerX, y, 'CONTROLES', {
      fontSize: '12px', color: '#ffffff', fontFamily: font, ...bold,
    }).setOrigin(0.5);

    y += 18;

    const controls = [
      '← →  Cambiar carril',
      '↑  Saltar obstáculos',
      '↓  Deslizar bajo obstáculos',
    ];
    controls.forEach((text) => {
      this.add.text(centerX, y, text, {
        fontSize: '10px', color: '#cccccc', fontFamily: font,
      }).setOrigin(0.5);
      y += 14;
    });

    y += 8;

    // Collectibles
    this.add.text(centerX, y, 'RECOLECTAR', {
      fontSize: '12px', color: '#ffffff', fontFamily: font, ...bold,
    }).setOrigin(0.5);

    y += 20;

    const collectibles = [
      { key: 'collectible_water', label: 'Agua', color: '#3498db', levels: '1, 2, 3' },
      { key: 'collectible_gel', label: 'Gel', color: '#e67e22', levels: '2, 3' },
      { key: 'collectible_banana', label: 'Banana', color: '#f1c40f', levels: '3' },
    ];

    const colStartX = centerX - 55;
    collectibles.forEach((c, i) => {
      const x = colStartX + i * 55;
      if (this.textures.exists(c.key)) {
        this.add.image(x, y, c.key).setDisplaySize(18, 18);
      } else {
        this.add.rectangle(x, y, 14, 14, parseInt(c.color.replace('#', '0x')));
      }
      this.add.text(x, y + 14, c.label, {
        fontSize: '9px', color: c.color, fontFamily: font, ...bold,
      }).setOrigin(0.5);
      this.add.text(x, y + 24, `Nv ${c.levels}`, {
        fontSize: '8px', color: '#888888', fontFamily: font,
      }).setOrigin(0.5);
    });

    y += 40;

    // Evolution
    this.add.text(centerX, y, 'EVOLUCIÓN', {
      fontSize: '12px', color: '#ffffff', fontFamily: font, ...bold,
    }).setOrigin(0.5);

    y += 18;

    const evolutions = [
      { name: 'Corredor', desc: 'Correr, Saltar, Deslizar', color: '#888888', pts: 'Inicio' },
      { name: 'Atleta', desc: '+ Salto automático', color: '#4a90d9', pts: '5 ítems' },
      { name: 'Campeón', desc: '+ Dash (2 carriles)', color: '#f1c40f', pts: '15 ítems' },
    ];
    evolutions.forEach((evo) => {
      this.add.text(8, y, evo.pts, {
        fontSize: '9px', color: '#666666', fontFamily: font,
      }).setOrigin(0, 0.5);
      this.add.text(centerX + 5, y, evo.name, {
        fontSize: '10px', color: evo.color, fontFamily: font, ...bold,
      }).setOrigin(0.5, 0.5);
      this.add.text(w - 8, y, evo.desc, {
        fontSize: '8px', color: '#aaaaaa', fontFamily: font,
      }).setOrigin(1, 0.5);
      y += 16;
    });

    // Continue
    const continueText = this.add.text(centerX, h - 20, 'TOCA PARA CONTINUAR', {
      fontSize: '11px', color: '#888888', fontFamily: font,
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
