/**
 * useSimulationTheme — computes the day/night UI theme palette
 * based on the user's clock and GPS location.
 * Extracted from simulation/page.tsx to reduce component size.
 * Refactored: 2026-02-21 — Phase 4 hook extraction
 */

'use client';

import { useMemo } from 'react';
import type { UiTheme } from '@/types/simulation';
import { calculateSunPosition } from '@/utils/solar';
import { rgbToHex } from '@/utils/color';
import { DEFAULT_LOCATION } from '@/config/simulation';

/**
 * Computes a WCAG-AA compliant UI theme that transitions smoothly
 * between day (light panels) and night (dark panels) based on actual
 * sun altitude at the user's location.
 *
 * Returns a stable dark theme when `currentTime` is `null` (SSR).
 */
export function useSimulationTheme(
  currentTime: Date | null,
  location: { lat: number; lng: number } | null,
): UiTheme {
  return useMemo(() => {
    // Stable dark theme for SSR (currentTime is null on server)
    if (!currentTime) {
      return {
        panelBg: 'rgba(10, 10, 26, 0.95)',
        panelBgHex: '#0a0a1a',
        borderColor: 'rgba(74, 158, 255, 0.15)',
        textPrimary: '#ffffff',
        textSecondary: '#c9d1d9',
        textMuted: '#8b949e',
        cardBg: 'rgba(255,255,255,0.05)',
        cardBgHover: 'rgba(74,158,255,0.12)',
        dayFactor: 0,
      };
    }

    const lat = location?.lat ?? DEFAULT_LOCATION.lat;
    const lng = location?.lng ?? DEFAULT_LOCATION.lng;
    const { altitude } = calculateSunPosition(currentTime, lat, lng);

    // Normalize: 0 = midnight, 1 = noon
    const dayFactor = Math.max(0, Math.min(1, (altitude + 0.15) / (Math.PI / 2 + 0.15)));

    // Panel colors transition from dark (night) to light (day)
    // Kept alpha high (0.95) to ensure 4.5:1 contrast regardless of 3D scene background
    const panelBg = `rgba(${Math.round(10 + dayFactor * 230)}, ${Math.round(10 + dayFactor * 230)}, ${Math.round(26 + dayFactor * 220)}, 0.95)`;
    const panelBgHex = rgbToHex(
      Math.round(10 + dayFactor * 230),
      Math.round(10 + dayFactor * 230),
      Math.round(26 + dayFactor * 220)
    );
    const borderColor = `rgba(${Math.round(74 + dayFactor * 100)}, ${Math.round(158 + dayFactor * 50)}, ${Math.round(255 - dayFactor * 50)}, ${0.15 + dayFactor * 0.2})`;

    // WCAG AA compliant text colors for both day and night modes
    const textPrimary = dayFactor > 0.5 ? '#111111' : '#ffffff';
    const textSecondary = dayFactor > 0.5 ? '#333333' : '#c9d1d9';
    const textMuted = dayFactor > 0.5 ? '#555555' : '#9ca3af';

    const cardBg = dayFactor > 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';
    const cardBgHover = dayFactor > 0.5 ? 'rgba(74,158,255,0.15)' : 'rgba(74,158,255,0.12)';

    return { panelBg, panelBgHex, borderColor, textPrimary, textSecondary, textMuted, cardBg, cardBgHover, dayFactor };
  }, [currentTime, location]);
}
