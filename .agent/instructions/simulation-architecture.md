# Case Study: Maslov Hive Simulation Architecture

> **Last updated:** February 21, 2026

This document summarizes the simulation architecture for AI agents maintaining this codebase.

# a. Reference files
- **PROJECT_STATUS.md** - Project status and progress
- **README.md** - Project overview and setup instructions
- **docs/refactor-simulation-plan.md** - Active refactor plan (Phases 1-2 complete)

## 🏗️ Core Architecture (The "Agentic Trinity")

The simulation in `scripts/bridge/` follows a decoupled engine pattern to ensure scalability and prevent the "zombie interval" bug.

### 1. Metabolism Engine (`agents/metabolism.ts`)
- **Role**: Life support.
- **Logic**: Handles needs decay (water, food, sleep) and recovery (breathing, thriving).
- **Modifiers**: Uses environmental factors (Temperature/AQI) to accelerate or slow decay.
- **Safety**: Pure state updates based on delta-time (`dt`).

### 2. Cognitive Brain (`agents/brain.ts` & `behavior-handlers.ts`)
- **Role**: Decision making & Finite State Machine (FSM).
- **Logic**: Evaluates needs in a priority hierarchy (Heroics > Survival > Social > Environment).
- **Pattern**: **Ticked Operations**. Instead of `setInterval`, complex activities like `drinking` or `building` use `bot.operationProgress` to track completion over multiple simulation ticks.
- **Modularity**: Individual behaviors are defined in `BehaviorHandlers`, making it easy to add new bot activities.

### 3. Physics Solver (`physics/solver.ts`, `navigation.ts`, `geometries.ts`)
- **Role**: Spatial resolution & Movement.
- **Logic**: Handles translation toward targets, path following (A*), and proximity avoidance.
- **Performance**: Implements **Spatial Partitioning** (simple grid hashing) for collision detection, ensuring $O(N)$ complexity instead of $O(N^2)$.
- **Resolution**: Resolves overlaps between bots and world structures (Sundial, Shelters).

## 🔄 The Main Loop (`movement.ts`)

The simulation entry point is extremely thin, acting as an orchestrator:

```typescript
export function simulateMovement() {
  const dt = Date.now() - lastTimestamp;
  
  // 1. Environmental factors
  updateWorldState(dt);

  // 2. Internal Bot Logic
  for (const bot of bots.values()) {
    tickMetabolism(bot, dt);
    tickBrain(bot, dt);
  }

  // 3. External World Interactions
  resolvePhysics(bots, worldConfig, dt);
}
```

## ⚠️ Maintenance Guidelines

1. **Never use `setInterval` inside a bot state**. Always use the `bot.operationProgress` pattern within a behavior handler.
2. **Centralize Constants**. Use `bridge/state.ts` for all shared constants to avoid magic numbers.
3. **DT is King**. All physics and metabolism calculations MUST be scaled by `dt` to ensure consistency across different simulation speeds (1x, 2x, 4x).
4. **Clean Transitions**. Use `transitionState(bot, newState)` in `brain.ts` to fire entry/exit hooks correctly.
5. **Broadcast Responsibility**. The main loop in `movement.ts` is responsible for calling `broadcastBotPositions()` after all engines have ticked.

## 📦 Type System Architecture (Refactored Feb 21, 2026)

Types are split by concern to avoid coupling (e.g. Three.js types forcing resolution on server code):

| File | Scope | Key Types |
|------|-------|-----------|
| `src/types/simulation.ts` | UI-facing simulation types + re-exports | `BotData`, `BotNeeds`, `ShelterData`, `ActivityMessage`, `PostDetail`, `SelectedBotInfo`, `UiTheme` |
| `src/types/weather.ts` | Weather & air quality | `WeatherData`, `AirQualityData` |
| `src/types/scene.ts` | Three.js-coupled renderer types | `BotEntity` |
| `src/types/bridge.ts` | Server/bridge-only (scripts/) | `BotState`, `WorldConfig`, `NavNode` |
| `src/types/post.ts` | Shared across dashboard, bot profile, simulation | `Post`, `PostComment`, `Agent` |

**Backward compatibility**: `simulation.ts` re-exports all moved types, so existing imports continue to work. New code should import from the specific module.

## 📐 Constants Architecture (Refactored Feb 21, 2026)

Constants are centralized to eliminate magic numbers and duplicated values:

| File | Scope | Key Constants |
|------|-------|---------------|
| `src/config/simulation.ts` | Simulation engine | `DEFAULT_LOCATION`, `WORLD_CONFIG`, `SCENE_CONFIG`, `BOT_PHYSICS`, `WS_DEFAULT_URL`, `WS_RECONNECT_MS`, `SPEECH_BUBBLE_MS`, `FEED_MAX_ITEMS` |
| `src/config/scene-colors.ts` | Three.js material colors | `GROUND_COLOR`, `WATER_COLOR`, `FOLIAGE_GREEN`, `SUNDIAL_BRONZE`, `SKY_BLUE`, `ACCENT_BLUE_3D`, etc. |
| `src/config/bot-visuals.ts` | Bot appearance & personality | `PERSONALITY_META`, `getPersonalityMeta()` (accepts short keys + full bot names) |
| `src/utils/weather.ts` | Weather utilities | `getAQIColor()` (Material Design), `getAqiLabel()`, `getWeatherEmoji()`, `WEATHER_CONDITIONS`, `isRainCode/isSnowCode/isFogCode/isStormCode` |
| `src/app/globals.css` | CSS design tokens | `--accent-blue`, `--bg-dark`, `--status-green`, `--status-red`, `--panel-bg`, etc. |

**Weather note**: `scripts/weather.ts` maintains its own copy of `getAQIColor` (same Material Design palette) because it runs as a standalone Node.js script outside the Next.js module system.
