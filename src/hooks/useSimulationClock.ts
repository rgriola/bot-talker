/**
 * useSimulationClock — provides client-side clock and GPS location.
 * Extracted from simulation/page.tsx to reduce component size.
 * Refactored: 2026-02-21 — Phase 4 hook extraction
 */

'use client';

import { useEffect, useState } from 'react';

interface SimulationClock {
  /** Current time (null during SSR to avoid hydration mismatch) */
  currentTime: Date | null;
  /** User's GPS location (null if denied or unavailable) */
  location: { lat: number; lng: number } | null;
}

/**
 * Initializes a 1-second clock and requests the user's GPS location.
 * Returns `null` for both values during SSR to prevent hydration errors.
 */
export function useSimulationClock(): SimulationClock {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize time on client mount to avoid hydration mismatch
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Request GPS location
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation(null),
        { enableHighAccuracy: false, timeout: 10000 }
      );
    }
  }, []);

  return { currentTime, location };
}
