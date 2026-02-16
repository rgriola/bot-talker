/**
 * Weather display utilities for emoji and AQI color mapping.
 * Refactored: 2026-02-16 @ extraction from page.tsx
 */

import type { WeatherData } from '@/types/simulation';

/**
 * Get weather emoji based on current conditions
 * Priority: stormy > snowing > raining > foggy > night/cloudy > cloudy > clear
 * 
 * @param weather Current weather data
 * @returns Weather emoji character
 */
export function getWeatherEmoji(weather: WeatherData): string {
  if (weather.isStormy) return '⛈️';
  if (weather.isSnowing) return '🌨️';
  if (weather.isRaining) return '🌧️';
  if (weather.isFoggy) return '🌫️';
  if (!weather.isDay) return weather.isCloudy ? '☁️' : '🌙';
  if (weather.cloudCover > 80) return '☁️';
  if (weather.cloudCover > 40) return '⛅';
  return '☀️';
}

/**
 * Get AQI (Air Quality Index) color based on EPA standards
 * 
 * @param aqi US AQI value (0-500+)
 * @returns Hex color representing air quality level
 */
export function getAQIColor(aqi: number): string {
  if (aqi <= 50) return '#00e400';      // Green - Good
  if (aqi <= 100) return '#ffff00';     // Yellow - Moderate
  if (aqi <= 150) return '#ff7e00';     // Orange - Unhealthy for Sensitive Groups
  if (aqi <= 200) return '#ff0000';     // Red - Unhealthy
  if (aqi <= 300) return '#8f3f97';     // Purple - Very Unhealthy
  return '#7e0023';                      // Maroon - Hazardous
}

/**
 * WMO weather code to condition string mapping
 */
export const WEATHER_CONDITIONS: Record<number, string> = {
  0: 'Clear',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Heavy showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm',
  99: 'Severe thunderstorm',
};

/**
 * Check if weather code indicates rain
 */
export function isRainCode(code: number): boolean {
  return [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code);
}

/**
 * Check if weather code indicates snow
 */
export function isSnowCode(code: number): boolean {
  return [71, 73, 75, 77, 85, 86].includes(code);
}

/**
 * Check if weather code indicates fog
 */
export function isFogCode(code: number): boolean {
  return [45, 48].includes(code);
}

/**
 * Check if weather code indicates storm
 */
export function isStormCode(code: number): boolean {
  return [82, 95, 96, 99].includes(code);
}
