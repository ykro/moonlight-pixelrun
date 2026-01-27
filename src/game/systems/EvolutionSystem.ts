export interface EvolutionLevel {
  name: string;
  threshold: number;
  abilities: string[];
}

export class EvolutionSystem {
  private currentLevel: number = 0;
  private currentPoints: number = 0;

  private readonly levels: EvolutionLevel[] = [
    { name: 'Runner', threshold: 0, abilities: ['run', 'jump', 'slide'] },
    { name: 'Athlete', threshold: 5, abilities: ['run', 'jump', 'slide', 'vault'] },
    { name: 'Champion', threshold: 15, abilities: ['run', 'jump', 'slide', 'vault', 'dash'] },
  ];

  private onLevelUp: (level: EvolutionLevel) => void;

  constructor(_scene: Phaser.Scene, onLevelUp: (level: EvolutionLevel) => void) {
    this.onLevelUp = onLevelUp;
  }

  addPoints(amount: number = 1): void {
    this.currentPoints += amount;

    const nextLevel = this.levels[this.currentLevel + 1];
    if (nextLevel && this.currentPoints >= nextLevel.threshold) {
      this.currentLevel++;
      this.onLevelUp(nextLevel);
    }
  }

  getCurrentLevel(): EvolutionLevel {
    return this.levels[this.currentLevel];
  }

  getCurrentPoints(): number {
    return this.currentPoints;
  }

  getProgress(): number {
    const currentThreshold = this.levels[this.currentLevel].threshold;
    const nextLevel = this.levels[this.currentLevel + 1];

    if (!nextLevel) return 1;

    const range = nextLevel.threshold - currentThreshold;
    const progress = this.currentPoints - currentThreshold;

    return Math.min(progress / range, 1);
  }

  hasAbility(ability: string): boolean {
    return this.getCurrentLevel().abilities.includes(ability);
  }

  reset(): void {
    this.currentLevel = 0;
    this.currentPoints = 0;
  }
}
