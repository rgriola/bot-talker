/**
 * useWeather hook — fetches weather + air quality data from Open-Meteo APIs.
 * Extracted from simulation/page.tsx to reduce component size.
 */

'use client';

import { useEffect, useState } from 'react';
import type { AirQualityData, WeatherData } from '@/types/simulation';
import { DEFAULT_LOCATION } from '@/config/simulation';
import {
  isRainCode,
  isSnowCode,
  isFogCode,
  isStormCode,
  WEATHER_CONDITIONS,
  getAqiLabel,
} from '@/utils/weather';

async function fetchAirQuality(lat: number, lng: number): Promise<AirQualityData | undefined> {
    try {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`;
        const response = await fetch(url);
        if (!response.ok) return undefined;
        const data = await response.json();
        const aq = data.current;
        return {
            us_aqi: Math.round(aq.us_aqi || 0),
            european_aqi: Math.round(aq.european_aqi || 0),
            pm10: Math.round(aq.pm10 * 10) / 10,
            pm2_5: Math.round(aq.pm2_5 * 10) / 10,
            carbon_monoxide: Math.round(aq.carbon_monoxide || 0),
            nitrogen_dioxide: Math.round(aq.nitrogen_dioxide * 10) / 10,
            sulphur_dioxide: Math.round(aq.sulphur_dioxide * 10) / 10,
            ozone: Math.round(aq.ozone * 10) / 10,
            quality_label: getAqiLabel(Math.round(aq.us_aqi || 0)),
        };
    } catch (err) {
        console.error('Air quality fetch failed:', err);
        return undefined;
    }
}

async function fetchWeatherData(lat: number, lng: number): Promise<WeatherData | null> {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,weather_code,cloud_cover,precipitation,relative_humidity_2m,wind_speed_10m,is_day&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=mm`;
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        const current = data.current;

        const weatherCode = current.weather_code;
        const isRain = isRainCode(weatherCode);
        const isSnow = isSnowCode(weatherCode);
        const isFog = isFogCode(weatherCode);
        const isStorm = isStormCode(weatherCode);

        // Fetch air quality in parallel
        const airQuality = await fetchAirQuality(lat, lng);

        return {
            temperature: Math.round(current.temperature_2m),
            feelsLike: Math.round(current.apparent_temperature),
            condition: WEATHER_CONDITIONS[weatherCode] || 'Clear',
            weatherCode,
            cloudCover: current.cloud_cover,
            precipitation: current.precipitation,
            humidity: current.relative_humidity_2m,
            windSpeed: Math.round(current.wind_speed_10m),
            isDay: current.is_day === 1,
            isRaining: isRain || current.precipitation > 0,
            isSnowing: isSnow,
            isCloudy: current.cloud_cover > 50,
            isFoggy: isFog,
            isStormy: isStorm,
            airQuality,
        };
    } catch (error) {
        console.error('Weather fetch failed:', error);
        return null;
    }
}

// ─── Hook ────────────────────────────────────────────────────────

interface UseWeatherOptions {
    location: { lat: number; lng: number } | null;
    /** Refresh interval in ms. Default: 10 minutes */
    refreshInterval?: number;
}

/**
 * Fetches weather + air quality data for a given location.
 * Falls back to NYC coordinates if no location is provided.
 */
export function useWeather({ location, refreshInterval = 10 * 60 * 1000 }: UseWeatherOptions) {
    const [weather, setWeather] = useState<WeatherData | null>(null);

    useEffect(() => {
        const lat = location?.lat ?? DEFAULT_LOCATION.lat;
        const lng = location?.lng ?? DEFAULT_LOCATION.lng;

        fetchWeatherData(lat, lng).then(setWeather);
        const interval = setInterval(() => fetchWeatherData(lat, lng).then(setWeather), refreshInterval);
        return () => clearInterval(interval);
    }, [location, refreshInterval]);

    return weather;
}
