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

## Phase 3 — Shared UI Components ✅

_Completed 2026-02-21_

### Created
1. **`src/hooks/usePostComments.ts`** — shared hook for fetching and caching post comments. Handles `data.data?.comments || data.comments || []` normalization. Returns `{ comments, loading, fetchComments, refetchComments, clearComments }`.
2. **`src/components/CommentThread.tsx`** — shared comment list component with two render paths: Tailwind (dashboard) and themed inline styles (PostDetailPanel). Supports optional avatars, dates, verified badges, and content linkification.
3. **`src/components/PostCard.tsx`** — shared post card for feed-style views: avatar, agent name link, verified badge, timestamp, `renderContentWithLinks`, score, and collapsible comment section via children.

### Updated consumers
- **`dashboard/page.tsx`** (351→277 lines, −21%): Replaced local `Agent`, `Comment`, `Post` interfaces with canonical `Post` import. Post card JSX replaced with `PostCard` + `CommentThread`.
- **`bot/[name]/page.tsx`** (414→392 lines, −5%): Replaced local `PostComment` and `Post` interfaces with canonical import. Comment fetch logic replaced with `usePostComments` hook.
- **`PostDetailPanel.tsx`** (231→197 lines, −15%): Comment loop + empty state replaced with `CommentThread` using theme prop.
- **`simulation/page.tsx`**: Eliminated duplicate comment fetch in canvas click handler — now calls `selectPost()` instead of duplicating 15 lines of fetch logic.

### Canonical type update
- **`src/types/post.ts`**: `PostComment.agent` broadened from `{ name: string }` to full `Agent` type (with color, verifiedAt, blueskyHandle, blueskyDid). Added optional `score`, `upvotes`, `downvotes` fields.

---

## Phase 4 — Extract Hooks from simulation/page.tsx ✅

_Completed 2026-02-21_

The ~711-line `useEffect`, 15 `useState` hooks, and 31 `useRef` hooks were restructured into 3 custom hooks.

### Approach

The original plan proposed a 3-tier pattern (`useSimulationScene` / `useSimulationData` / `useSceneSync`), but during implementation the WebSocket handler's tight coupling with Three.js scene objects (10+ direct `scene.add()`, mesh creation, bot entity updates inside message handlers) made a clean data/renderer split impractical without introducing an event-emitter or message-queue architecture — too risky for a single refactor pass. Instead, a pragmatic single-hook approach was used.

### Created

1. **`src/hooks/useSimulationClock.ts`** (47 lines) — clock `setInterval` + `navigator.geolocation`; returns `{ currentTime, location }`
2. **`src/hooks/useSimulationTheme.ts`** (72 lines) — the `uiTheme` `useMemo` computation; takes `(currentTime, location)`, returns the full `UiTheme` palette
3. **`src/hooks/useSimulation.ts`** (~680 lines) — consolidated hook containing all 28 refs, 8 state variables, 9 callbacks, and 6 useEffects. Includes Three.js scene/camera/renderer/controls creation, animation loop (bot lerp, rain/snow/corn), resize handler, click handler (raycasting), WebSocket with world:init/world:update/sim:reset:complete/bot:speak handling, and full cleanup with GPU resource disposal

### Updated

- **`simulation/page.tsx`** (1,566 → 320 lines, −80%): Now contains only imports, DOM refs, 5 panel toggle states, hook calls, and JSX layout with all panels + style block

### Gotchas preserved

- **`world:init` → `world:update` fallthrough** preserved with explicit `// eslint-disable-next-line no-fallthrough`
- **`eslint-disable-next-line react-hooks/exhaustive-deps`** retained on the main setup useEffect (refs created inside the effect are not external dependencies)
- Panel toggle states (`showFeed`, `showAirQuality`, etc.) kept in page component since they control JSX visibility, not simulation logic

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