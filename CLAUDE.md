# CLAUDE.md - Project Guidelines for AI Assistants

## Project Overview
Moonlight: Pixel Run - A mobile-first endless runner built with Phaser 3 + TypeScript + Vite.

## Commands
```bash
npm run dev          # Start dev server (add --host for mobile testing)
npm run build        # Production build
npx tsc --noEmit     # Type check
```

## Architecture

### Scene Flow
`BootScene → PreloaderScene → MenuScene → GameScene (+ UIScene overlay) → GameOverScene`

### Key Systems
- **LaneSystem**: 3 lanes at x-offsets [-40, 0, 40] from center
- **SpawnSystem**: Object-pooled obstacles/collectibles, speed increases every 5s
- **InputSystem**: Rex Gestures plugin for swipe, keyboard fallback
- **CollisionSystem**: AABB with 2px padding, state-aware (jump dodges ground, slide dodges air)
- **EvolutionSystem**: Points from collectibles, unlocks abilities at thresholds

### Player State Machine
States: `running | jumping | sliding | hit`
- Only `running` state accepts new input
- `isTransitioning` flag prevents lane-skip exploits

## Code Style
- Constants in `src/game/constants/GameConstants.ts`
- Entities extend `Phaser.GameObjects.Sprite`
- Systems are plain classes instantiated by GameScene
- Use object pools for frequently spawned objects

## Native Resolution
180x320 pixels, scaled with `Phaser.Scale.FIT`. All coordinates are in native units.

## Current Phase
Phase 1 (MVP) complete. Next: Phase 2 (evolution abilities: vault, dash).
