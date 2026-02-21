# Plan: Simulation & Shared UI Refactor

The goal is to break the 1,584-line god component (15 `useState` + 31 `useRef` hooks, a ~711-line `useEffect`), eliminate duplicate UI patterns across `/dashboard`, `/simulation`, and `/bot/[name]`, unify orphaned constants, and split the bloated types file — without changing any runtime behavior.

> **AQI colors resolved**: Material Design palette chosen as the standard. All sources (`src/utils/weather.ts`, `scripts/weather.ts`, `WeatherStatsPanel.tsx`) now use the same set.

---

## Phase 1 — Shared Types (Foundation) ✅

All subsequent work depends on canonical types existing first.

1. ✅ Created `src/types/post.ts` — unified `Post` and `PostComment` interfaces
2. ✅ Created `src/types/weather.ts` — `WeatherData`, `AirQualityData` extracted
3. ✅ Created `src/types/scene.ts` — `BotEntity` (Three.js-coupled type) isolated
4. ✅ Created `src/types/bridge.ts` — `NavNode`, `BotState`, `WorldConfig` for server/bridge
5. ✅ Deleted inline `interface ShelterData` redeclaration from `simulation/page.tsx`
6. ✅ `src/types/simulation.ts` now re-exports from split files for backward compatibility

---

## Phase 2 — Constants Consolidation ✅

1. ✅ Added to `src/config/simulation.ts`: `DEFAULT_LOCATION`, `WS_DEFAULT_URL`, `WS_RECONNECT_MS`, `SPEECH_BUBBLE_MS`, `FEED_MAX_ITEMS`, `SCENE_CONFIG`
2. ✅ Created `src/config/scene-colors.ts` — named hex color constants (`WATER_COLOR`, `FOLIAGE_COLOR`, `SUNDIAL_BRONZE`, etc.) imported by `scene-objects.ts` and `simulation/page.tsx`
3. ✅ Added CSS custom properties (`--accent-blue`, `--bg-dark`, `--status-green`, etc.) to `globals.css` as design tokens
4. ✅ Unified `BOT_EMOJIS` into `PERSONALITY_META` in `bot-visuals.ts` — `getPersonalityMeta()` now accepts both short keys ("tech") and full names ("TechBot")
5. ✅ Created and exported `getAqiLabel` from `src/utils/weather.ts`. Labels use short style ("Sensitive"). Deleted copies from `useWeather.ts` and `WeatherStatsPanel.tsx`
6. ✅ Consolidated `getAQIColor` to Material Design palette across `src/utils/weather.ts` and `scripts/weather.ts`
7. ✅ Consolidated weather code constants — `useWeather.ts` now imports `isRainCode`, `isSnowCode`, `isFogCode`, `isStormCode`, and `WEATHER_CONDITIONS` from `src/utils/weather.ts`
8. ✅ `WeatherStatsPanel.tsx` now imports `getWeatherEmoji`, `getAQIColor`, `getAqiLabel` from `src/utils/weather.ts` — all local helper functions deleted
4. Unify `BOT_EMOJIS` in `bot/[name]/page.tsx` (L45) into the existing `PERSONALITY_META` in `bot-visuals.ts`
5. Create and export `getAqiLabel` from `src/utils/weather.ts` (it does not exist yet). Decide on label style: short ("Sensitive") vs long ("Unhealthy for Sensitive Groups"). Then delete the local copies in `useWeather.ts` and `WeatherStatsPanel.tsx`
6. Consolidate `getAQIColor` — also duplicated in `scripts/weather.ts` (L176). Import from `src/utils/weather.ts` instead of re-declaring
7. Consolidate weather code constants (`RAIN_CODES`, `SNOW_CODES`, `FOG_CODES`, `STORM_CODES`) — independently maintained in both `useWeather.ts` and `src/utils/weather.ts`. Move to a single canonical location

---

## Phase 3 — Shared UI Components

1. Create `src/components/PostCard.tsx` — single shared post card: avatar circle, agent name link, timestamp, `renderContentWithLinks`, collapsible comment list. Replaces duplicate markup in:
   - `dashboard/page.tsx` L281–349
   - `bot/[name]/page.tsx` L315–400
   - `PostDetailPanel.tsx` L78–231
2. Create `src/components/CommentThread.tsx` — renders `PostComment[]` with agent name links; used by `PostCard` and `PostDetailPanel`
3. Create `src/hooks/usePostFetch.ts` — single hook wrapping the `fetch('/api/v1/comments?postId=...')` call with the `data.data?.comments || data.comments || []` normalization copy-pasted in:
   - `dashboard/page.tsx` L57
   - `bot/[name]/page.tsx` L85
   - `simulation/page.tsx` L336
4. ~~Fix `WeatherStatsPanel.tsx`~~ — **Done in Phase 2 step 8**
5. Note: `renderContentWithLinks` is already properly centralized in `src/utils/content.tsx` — no extraction needed, the new `PostCard` simply imports it

---

## Phase 4 — Extract Hooks from simulation/page.tsx

The ~711-line `useEffect` (L627–L1338), 15 `useState` hooks, and 31 `useRef` hooks get restructured.

### 4a. State consolidation

1. Bundle the 31 `useRef` hooks into a single typed `SceneRefs` interface and one `useRef<SceneRefs>()` — reduces the declaration block from ~50 lines to ~5
2. Consolidate UI toggle states (`showFeed`, `showAirQuality`, `showWeather`, `showAllBots`, `showPhysicalNeeds`) into a `useReducer` with a `PanelState` type and a `toggle(panel)` action — reduces 5 `useState` pairs to 1

### 4b. Hook extraction (3-tier pattern)

The WebSocket handler **directly manipulates Three.js scene objects** in 10+ places (`scene.add()`, `scene.remove()`, mesh creation, bot entity updates). A naive `useSimulationWebSocket` + `useSimulationRenderer` split won't work because the two are tightly coupled. Instead, use a 3-tier pattern:

| Hook | Responsibility | Imports THREE? |
|---|---|---|
| `useSimulationScene` | Creates Scene/Camera/Renderer/Controls, animation loop, resize handler | Yes |
| `useSimulationData` | WebSocket connection, reconnect timer, message parsing. Returns reactive data (`bots`, `worldConfig`, `activityFeed`) | **No** |
| `useSceneSync` | Takes scene refs + data, reconciles 3D objects from data changes (creates/updates/removes meshes) | Yes |

This makes the coupling explicit — `useSceneSync` is where data meets the renderer, and that's its declared job.

3. `src/hooks/useSimulationClock.ts` — clock `setInterval` + `navigator.geolocation`; returns `{ currentTime, location }`
4. `src/hooks/useSimulationTheme.ts` — the `uiTheme` `useMemo` (L269–L323); takes `(currentTime, location)`, returns the full `UiTheme` palette
5. `src/hooks/useSimulationScene.ts` — Three.js scene/camera/renderer/controls setup, animation loop. Exposes the `SceneRefs` container
6. `src/hooks/useSimulationData.ts` — WebSocket connection and reconnect logic (~278 lines). Parses messages into pure data objects. No Three.js imports
7. `src/hooks/useSceneSync.ts` — reconciliation layer: takes `SceneRefs` + data from `useSimulationData`, creates/updates/removes 3D objects accordingly

### 4c. Gotchas

- **`world:init` falls through to `world:update`**: The `case 'world:init':` at ~L1029 has no `break`, intentionally falling through. Hook extraction must preserve this exact behavior
- **Main `useEffect` has `eslint-disable-next-line react-hooks/exhaustive-deps`** at L1339. Extracting hooks will force confronting the real dependency list, which may surface latent bugs. Test carefully
- The dependency array lists `[handleReset, onSimResetComplete, createBot, resizeGroundForBots, showSpeechBubble]` but the effect body references `scene`, `camera`, `renderer`, `controls` — all created inside the effect

After extraction, `simulation/page.tsx` should drop from ~1,584 lines to roughly 200–300 lines of layout + panel wiring.

---

## Phase 5 — scene-objects.ts & world-physics.ts Cleanup

### scene-objects.ts
1. Create `src/lib/three-utils.ts` — move `disposeObject3D` out of `scene-objects.ts`
2. Create `src/lib/shelter-mesh.ts` — extract `buildShelterMesh` and its `document.createElement('canvas')` / `CanvasTexture` nameplate logic; isolates DOM-in-3D concern
3. Fix the mutation pattern in `buildShelterMesh` — it currently mutates a passed-in `THREE.Group` (inconsistent with all other factory functions that return new objects); change to return a new group
4. Replace inline hex magic numbers in `scene-objects.ts` with named constants from the new `src/config/scene-objects.ts`

### world-physics.ts
`src/lib/world-physics.ts` is a grab-bag mixing three unrelated concerns:
5. `isWalkable()` — belongs in a physics/collision module (fine to keep here, but rename file to `collision.ts` or similar)
6. `random256Color()`, `randomBotShape()`, `randomBotWidth()`, `randomBotHeight()` — bot factory utilities, move to `src/lib/bot-factory.ts`
7. `detectPersonality()` — belongs in `src/config/bot-visuals.ts` alongside `getPersonalityMeta`

---

## Phase 6 — Comment Accuracy Pass

Walk each of the remaining files after the above changes and:
- Remove comments describing behavior that was moved (e.g. "handles WebSocket" on the page component after the hook is extracted)
- Ensure each file's top-level JSDoc matches its actual single responsibility
- Specifically audit `scripts/bridge/agents.ts` and `bridge/bot-init.ts` which are the "Agentic Trinity" entry points but contain a mix of scheduling + initialization

---

## Verification

- `npm run build` — no type errors after each phase
- Manual smoke test: `/simulation`, `/dashboard`, `/bot/[name]` all render and WebSocket connects
- Check post cards look visually consistent across all three pages post-Phase 3
- **Visual regression check**: AQI colors will change if consolidating `getAqiColor` (Material Design) → `getAQIColor` (EPA standard). Verify the chosen palette looks correct on the weather panel
- Verify `world:init` → `world:update` fallthrough behavior is preserved after hook extraction

## Decisions

- Phases 1 & 2 are prerequisites — types and constants must stabilize before component work begins
- Phase 3 (shared `PostCard`) is the highest-visibility UX inconsistency fix and can be done independently of Phase 4
- Phases 4 & 5 can be worked in parallel once Phase 1 is complete