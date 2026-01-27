# Moonlight: Pixel Run

A mobile-first endless runner game built with Phaser 3, featuring 3-lane gameplay, swipe controls, and an evolution system.

## Play

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser. For mobile testing, use `npm run dev -- --host` and access via your local network IP.

## Controls

| Input | Action |
|-------|--------|
| Swipe Left/Right | Change lane |
| Swipe Up | Jump (avoid ground obstacles) |
| Swipe Down | Slide (avoid air obstacles) |
| Arrow Keys / WASD | Keyboard alternative |

## Game Mechanics

- **3-Lane System**: Navigate between left, center, and right lanes
- **Obstacles**: Red blocks spawn randomly - jump over ground obstacles, slide under air obstacles
- **Collectibles**: Blue water bottles fill your evolution bar
- **Evolution**: Collect enough to level up from Runner → Athlete → Champion
- **Speed Scaling**: Game progressively gets faster
- **High Score**: Best distance saved locally

## Tech Stack

- **Engine**: Phaser 3.90
- **Build**: Vite
- **Language**: TypeScript
- **Input**: phaser3-rex-plugins (gestures)

## Project Structure

```
src/
├── main.ts                 # Entry point
└── game/
    ├── GameConfig.ts       # Phaser configuration
    ├── constants/          # Game constants
    ├── scenes/             # Boot, Menu, Game, UI, GameOver
    ├── entities/           # Player, Obstacle, Collectible
    ├── systems/            # Lane, Spawn, Input, Collision, Evolution
    └── utils/              # ObjectPool
```

## Roadmap

- [x] **Phase 1**: MVP playable loop
- [ ] **Phase 2**: Evolution abilities (vault, dash)
- [ ] **Phase 3**: Three themed levels
- [ ] **Phase 4**: Pixel art sprites, audio, effects
