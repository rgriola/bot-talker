/**
 * Visual configuration for bot personality types in 3D scene.
 * Refactored: 2026-02-16 @ extraction from page.tsx
 */

import * as THREE from 'three';

export interface BotVisualConfig {
  /** Primary mesh color (Three.js hex) */
  color: number;
  /** Emissive glow color (Three.js hex) */
  emissive: number;
  /** Factory function to create bot geometry */
  geometry: () => THREE.BufferGeometry;
  /** UI emoji for this personality */
  emoji: string;
  /** Human-readable label */
  label: string;
}

/**
 * Personality type to visual configuration mapping.
 * Each bot type has unique shape, color, and icon.
 */
export const BOT_VISUALS: Record<string, BotVisualConfig> = {
  tech: {
    color: 0x4a9eff,      // Blue
    emissive: 0x1a3a66,
    geometry: () => new THREE.BoxGeometry(0.8, 0.8, 0.8),
    emoji: '🤖',
    label: 'Tech',
  },
  philo: {
    color: 0xb366ff,      // Purple
    emissive: 0x3d1a66,
    geometry: () => new THREE.SphereGeometry(0.5, 32, 32),
    emoji: '🧠',
    label: 'Philosophy',
  },
  art: {
    color: 0xff8c42,      // Orange
    emissive: 0x663a1a,
    geometry: () => new THREE.ConeGeometry(0.5, 1, 6),
    emoji: '🎨',
    label: 'Art',
  },
  science: {
    color: 0x42d68c,      // Green
    emissive: 0x1a663a,
    geometry: () => new THREE.CylinderGeometry(0.4, 0.4, 1, 16),
    emoji: '🔬',
    label: 'Science',
  },
};

/**
 * Get visual config for a personality type with fallback
 * 
 * @param personality Bot personality string (e.g., "tech", "philo")
 * @returns Visual config, defaulting to tech style if unknown
 */
export function getBotVisuals(personality: string): BotVisualConfig {
  return BOT_VISUALS[personality.toLowerCase()] || BOT_VISUALS.tech;
}

/**
 * Bot color mapping for activity feed and UI elements (hex strings)
 */
export const BOT_COLORS: Record<string, string> = {
  TechBot: '#4a9eff',
  PhilosopherBot: '#b366ff',
  ArtBot: '#ff8c42',
  ScienceBot: '#42d68c',
  PirateBot: '#cc88ff',
};

/**
 * Get bot color by name with fallback
 * 
 * @param botName Bot name (e.g., "TechBot", "ScienceBot")
 * @returns Hex color string
 */
export function getBotColor(botName: string): string {
  return BOT_COLORS[botName] || '#4a9eff';
}
