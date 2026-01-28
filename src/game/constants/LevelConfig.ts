export type ObstacleVariant =
  | 'runner'
  | 'cyclist'
  | 'pedestrian'
  | 'parked_car'
  | 'pothole'
  | 'traffic';

export type ThemeType = 'night' | 'day';

export interface LevelTheme {
  skyColor: number;
  groundColor: number;
  laneLineColor: number;
  groundLineColor: number;
}

export interface LevelObstacleConfig {
  variant: ObstacleVariant;
  weight: number; // Spawn probability weight
  type: 'ground' | 'air';
  width: number;
  height: number;
  color: number;
}

export type CollectibleVariant = 'water' | 'gel' | 'banana';

export interface LevelConfiguration {
  id: string;
  name: string;
  theme: ThemeType;
  themeColors: LevelTheme;
  initialSpeed: number;
  maxSpeed: number;
  spawnInterval: number;
  minSpawnInterval: number;
  obstacles: LevelObstacleConfig[];
  collectibleTypes: CollectibleVariant[];
  collectibleChance: number;
  unlockRequirement: number; // Distance needed in previous level to unlock
}

export const THEMES: Record<ThemeType, LevelTheme> = {
  night: {
    skyColor: 0x0a0a1a,
    groundColor: 0x1a1a2e,
    laneLineColor: 0x333355,
    groundLineColor: 0x444466,
  },
  day: {
    skyColor: 0x87ceeb,
    groundColor: 0x3d3d3d,
    laneLineColor: 0xffffff,
    groundLineColor: 0xcccccc,
  },
};

export const OBSTACLE_VARIANTS: Record<ObstacleVariant, { color: number; defaultType: 'ground' | 'air' }> = {
  runner: { color: 0x4a90d9, defaultType: 'ground' },
  cyclist: { color: 0xf39c12, defaultType: 'ground' },
  pedestrian: { color: 0x9b59b6, defaultType: 'ground' },
  parked_car: { color: 0x7f8c8d, defaultType: 'ground' },
  pothole: { color: 0x2c3e50, defaultType: 'ground' },
  traffic: { color: 0xe74c3c, defaultType: 'ground' },
};

export const LEVEL_CONFIGS: LevelConfiguration[] = [
  {
    id: 'las_americas',
    name: 'Las Américas',
    theme: 'night',
    themeColors: THEMES.night,
    initialSpeed: 150,
    maxSpeed: 280,
    spawnInterval: 1000,
    minSpawnInterval: 500,
    collectibleTypes: ['water'],
    collectibleChance: 0.6,
    unlockRequirement: 0,
    obstacles: [
      { variant: 'runner', weight: 40, type: 'ground', width: 16, height: 24, color: 0x4a90d9 },
      { variant: 'cyclist', weight: 30, type: 'ground', width: 24, height: 24, color: 0xf39c12 },
      { variant: 'pedestrian', weight: 20, type: 'ground', width: 16, height: 24, color: 0x9b59b6 },
      { variant: 'runner', weight: 10, type: 'air', width: 16, height: 20, color: 0x3498db },
    ],
  },
  {
    id: 'hill_reps',
    name: 'Hill Reps',
    theme: 'night',
    themeColors: {
      ...THEMES.night,
      skyColor: 0x1a1a2e,
      groundColor: 0x2d4a3e,
    },
    initialSpeed: 130,
    maxSpeed: 260,
    spawnInterval: 1100,
    minSpawnInterval: 600,
    collectibleTypes: ['water', 'gel'],
    collectibleChance: 0.65,
    unlockRequirement: 500, // Need 500m in Las Américas
    obstacles: [
      { variant: 'parked_car', weight: 35, type: 'ground', width: 28, height: 20, color: 0x7f8c8d },
      { variant: 'runner', weight: 25, type: 'ground', width: 16, height: 24, color: 0x4a90d9 },
      { variant: 'pedestrian', weight: 25, type: 'ground', width: 16, height: 24, color: 0x9b59b6 },
      { variant: 'cyclist', weight: 15, type: 'air', width: 24, height: 20, color: 0xf39c12 }, // Downhill cyclist
    ],
  },
  {
    id: 'fondo_vh',
    name: 'Fondo VH',
    theme: 'day',
    themeColors: THEMES.day,
    initialSpeed: 160,
    maxSpeed: 320,
    spawnInterval: 900,
    minSpawnInterval: 400,
    collectibleTypes: ['water', 'gel', 'banana'],
    collectibleChance: 0.55,
    unlockRequirement: 500, // Need 500m in Hill Reps
    obstacles: [
      { variant: 'pothole', weight: 30, type: 'ground', width: 20, height: 12, color: 0x2c3e50 },
      { variant: 'traffic', weight: 25, type: 'ground', width: 20, height: 24, color: 0xe74c3c },
      { variant: 'cyclist', weight: 20, type: 'ground', width: 24, height: 24, color: 0xf39c12 },
      { variant: 'runner', weight: 15, type: 'air', width: 16, height: 20, color: 0x3498db },
      { variant: 'traffic', weight: 10, type: 'air', width: 20, height: 16, color: 0xc0392b }, // Flying debris
    ],
  },
];

export function getLevelConfig(levelId: string): LevelConfiguration {
  return LEVEL_CONFIGS.find(l => l.id === levelId) || LEVEL_CONFIGS[0];
}

export function selectObstacle(config: LevelConfiguration): LevelObstacleConfig {
  const totalWeight = config.obstacles.reduce((sum, o) => sum + o.weight, 0);
  let random = Math.random() * totalWeight;

  for (const obstacle of config.obstacles) {
    random -= obstacle.weight;
    if (random <= 0) {
      return obstacle;
    }
  }

  return config.obstacles[0];
}
