export const GAME_WIDTH = 180;
export const GAME_HEIGHT = 320;

export const LANES = {
  LEFT: 0,
  CENTER: 1,
  RIGHT: 2,
  COUNT: 3,
  POSITIONS: [-40, 0, 40],
  SWITCH_DURATION: 120,
} as const;

export const PLAYER = {
  WIDTH: 16,
  HEIGHT: 24,
  Y_POSITION: 260,
  JUMP_HEIGHT: 50,
  JUMP_DURATION: 400,
  SLIDE_DURATION: 500,
  COLOR: 0x4a90d9,
} as const;

export const OBSTACLE = {
  WIDTH: 20,
  HEIGHT: 24,
  SPAWN_Y: -30,
  COLOR: 0xe74c3c,
} as const;

export const GROUND = {
  Y: 290,
  HEIGHT: 30,
  COLOR: 0x2d2d2d,
  LINE_COLOR: 0x444444,
} as const;

export const SPEED = {
  INITIAL: 120,
  INCREMENT: 5,
  MAX: 300,
} as const;

export const SPAWN = {
  INITIAL_INTERVAL: 1500,
  MIN_INTERVAL: 600,
  INTERVAL_DECREASE: 50,
} as const;

export const COLORS = {
  SKY_NIGHT: 0x0a0a1a,
  GROUND: 0x1a1a2e,
  LANE_LINE: 0x333355,
} as const;
