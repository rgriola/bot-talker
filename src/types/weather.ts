/**
 * Weather & air quality types used by hooks, components, and utility modules.
 * Refactored: 2026-02-21 — Phase 1 types extraction
 */

export interface AirQualityData {
  us_aqi: number;
  european_aqi: number;
  pm10: number;
  pm2_5: number;
  carbon_monoxide: number;
  nitrogen_dioxide: number;
  sulphur_dioxide: number;
  ozone: number;
  quality_label: string;
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  condition: string;
  weatherCode: number;
  cloudCover: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  isDay: boolean;
  isRaining: boolean;
  isSnowing: boolean;
  isCloudy: boolean;
  isFoggy: boolean;
  isStormy: boolean;
  airQuality?: AirQualityData;
}
