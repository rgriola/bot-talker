/**
 * Solar position calculator for dynamic day/night lighting.
 * Refactored: 2026-02-16 @ extraction from page.tsx
 */

export interface SunPosition {
  /** Solar altitude (elevation above horizon) in radians */
  altitude: number;
  /** Solar azimuth (compass direction) in radians */
  azimuth: number;
}

/**
 * Calculate sun position for a given date and location.
 * Uses simplified solar position algorithm suitable for visual effects.
 * 
 * @param date Current date/time
 * @param lat Latitude in degrees (-90 to 90)
 * @param lng Longitude in degrees (-180 to 180)
 * @returns Sun position with altitude and azimuth in radians
 */
export function calculateSunPosition(date: Date, lat: number, lng: number): SunPosition {
  // Day of year (1-366)
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  
  // Solar time calculation
  const hours = date.getHours() + date.getMinutes() / 60 + date.getTimezoneOffset() / 60 + lng / 15;
  const solarTime = hours + (4 * lng + 229.18) / 60;
  const hourAngle = (solarTime - 12) * 15 * Math.PI / 180;
  
  // Declination angle (Earth's axial tilt effect)
  const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * Math.PI / 180) * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  
  // Solar altitude (elevation above horizon)
  const sinAltitude = Math.sin(latRad) * Math.sin(declination) + 
                      Math.cos(latRad) * Math.cos(declination) * Math.cos(hourAngle);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAltitude)));
  
  // Solar azimuth (compass direction)
  const cosAzimuth = (Math.sin(declination) - Math.sin(latRad) * sinAltitude) / 
                     (Math.cos(latRad) * Math.cos(altitude));
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAzimuth)));
  
  // Adjust azimuth for afternoon (mirror across noon)
  if (hourAngle > 0) azimuth = 2 * Math.PI - azimuth;
  
  return { altitude, azimuth };
}

/**
 * Calculate day factor (0 = midnight, 1 = noon) for UI theming
 * 
 * @param date Current date/time
 * @param lat Latitude in degrees
 * @param lng Longitude in degrees
 * @returns Day factor from 0 to 1
 */
export function calculateDayFactor(date: Date, lat: number, lng: number): number {
  const { altitude } = calculateSunPosition(date, lat, lng);
  // Normalize: 0 = deep night, 1 = noon (with slight offset to start transition before sunrise)
  return Math.max(0, Math.min(1, (altitude + 0.15) / (Math.PI / 2 + 0.15)));
}
