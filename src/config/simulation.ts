/**
 * Shared configuration constants for the Maslov Hive.
 * Used by both the frontend (React) and backend (Node.js scripts).
 */

// ─── Default Location ────────────────────────────────────────────
/** New York City — used as fallback when geolocation is unavailable */
export const DEFAULT_LOCATION = { lat: 40.7128, lng: -74.006 } as const;

// ─── Grid & World ────────────────────────────────────────────────
export const WORLD_CONFIG = {
  // Navigation grid cell size in meters (40cm)
  NAV_GRID_CELL_SIZE: 0.4,

  // How much space each bot needs (affects world size)
  SQ_METERS_PER_BOT: 75,

  // Minimum side length of the world in meters
  MIN_GROUND_SIZE: 10,

  // Distance to stop before reaching a target
  APPROACH_DISTANCE: 2,
};

// ─── 3D Scene ────────────────────────────────────────────────────
export const SCENE_CONFIG = {
  /** Radius of the sun orbit around origin (meters) */
  SUN_RADIUS: 25,
  /** Initial ground plane size before auto-resize kicks in */
  INITIAL_GROUND_SIZE: 20,
};

// ─── Bot Physics ─────────────────────────────────────────────────
export const BOT_PHYSICS = {
  MIN_WIDTH: 0.5,
  MAX_WIDTH: 0.8,
  MIN_HEIGHT: 0.66,
  MAX_HEIGHT: 1.3,

  // Movement speed (meters per tick?) - currently logic handled in bridge
  // but limits could be here

  // Chance to pause movement (10%)
  IDLE_CHANCE: 0.1,
};

// ─── Resources & Building ────────────────────────────────────────
export const RESOURCE_CONFIG = {
  // Tree count is usually dynamic, but we can set densities here if needed
  TREE_DENSITY: 0.05, // Trees per sq meter (example)
};

// ─── WebSocket ───────────────────────────────────────────────────
/** Default WebSocket URL when NEXT_PUBLIC_WS_URL env var is not set */
export const WS_DEFAULT_URL = 'ws://localhost:8080';
/** Delay before attempting WebSocket reconnection (ms) */
export const WS_RECONNECT_MS = 3000;

// ─── UI Timings & Limits ─────────────────────────────────────────
/** How long speech bubbles stay visible (ms) */
export const SPEECH_BUBBLE_MS = 6000;
/** Maximum activity feed items kept in state */
export const FEED_MAX_ITEMS = 50;
