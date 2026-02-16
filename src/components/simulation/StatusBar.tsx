/**
 * Top status bar showing time, location, weather, and bot needs.
 * Refactored: 2026-02-16 @ extraction from page.tsx
 */

import { RefObject } from 'react';
import type { WeatherData, SelectedBotInfo } from '@/types/simulation';
import { getWeatherEmoji, getAQIColor } from '@/utils/weather';

export interface StatusBarProps {
  /** Current time (null during SSR) */
  currentTime: Date | null;
  /** User's GPS location */
  location: { lat: number; lng: number } | null;
  /** Current weather data */
  weather: WeatherData | null;
  /** Selected bot info (for physical needs button) */
  selectedBotInfo: SelectedBotInfo | null;
  /** Whether air quality panel is shown */
  showAirQuality: boolean;
  /** Callback to toggle air quality panel */
  setShowAirQuality: (show: boolean) => void;
  /** Whether physical needs panel is shown */
  showPhysicalNeeds: boolean;
  /** Callback to toggle physical needs panel */
  setShowPhysicalNeeds: (show: boolean) => void;
  /** Ref for connection status element */
  statusRef: RefObject<HTMLDivElement | null>;
  /** Callback to reset camera view */
  onReset: () => void;
}

/**
 * Status bar component with time, weather, AQI, and navigation controls.
 * Fixed to top of simulation viewport.
 */
export function StatusBar({
  currentTime,
  location,
  weather,
  selectedBotInfo,
  showAirQuality,
  setShowAirQuality,
  showPhysicalNeeds,
  setShowPhysicalNeeds,
  statusRef,
  onReset,
}: StatusBarProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '48px',
        background: 'linear-gradient(180deg, rgba(10,10,26,0.95), rgba(10,10,26,0.6))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 10,
        borderBottom: '1px solid rgba(74, 158, 255, 0.15)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Left: Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '20px' }}>🌍</span>
        <span style={{ color: '#e0e0ff', fontWeight: 600, fontSize: '15px', letterSpacing: '0.5px' }}>
          Bot-Talker Simulation
        </span>
      </div>

      {/* Right: Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Date/Time */}
        <div style={{ fontSize: '12px', color: '#a0a0c0', fontFamily: 'monospace', textAlign: 'right' }}>
          <div>{currentTime?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) ?? '—'}</div>
          <div>{currentTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) ?? '—'}</div>
        </div>

        {/* Location */}
        {location && (
          <div style={{ fontSize: '11px', color: '#7a7a9a', fontFamily: 'monospace' }}>
            📍 {location.lat.toFixed(3)}, {location.lng.toFixed(3)}
          </div>
        )}

        {/* Weather */}
        {weather && (
          <div style={{ 
            fontSize: '12px', 
            color: '#e0e0ff', 
            fontFamily: 'system-ui',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(74, 158, 255, 0.1)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(74, 158, 255, 0.2)',
          }}>
            <span style={{ fontSize: '18px' }}>{getWeatherEmoji(weather)}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600 }}>{weather.temperature}°F</div>
              <div style={{ fontSize: '10px', color: '#a0a0c0' }}>{weather.condition}</div>
            </div>
          </div>
        )}

        {/* Air Quality Button */}
        {weather?.airQuality && (
          <button
            onClick={() => setShowAirQuality(!showAirQuality)}
            style={{
              fontSize: '12px',
              color: '#e0e0ff',
              fontFamily: 'system-ui',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: showAirQuality ? 'rgba(74, 158, 255, 0.2)' : 'rgba(74, 158, 255, 0.1)',
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${showAirQuality ? 'rgba(74, 158, 255, 0.4)' : 'rgba(74, 158, 255, 0.2)'}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '16px' }}>🫁</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ 
                fontWeight: 600,
                color: getAQIColor(weather.airQuality.us_aqi)
              }}>
                AQI {weather.airQuality.us_aqi}
              </div>
              <div style={{ fontSize: '10px', color: '#a0a0c0' }}>{weather.airQuality.quality_label}</div>
            </div>
          </button>
        )}

        {/* Physical Needs Button */}
        {selectedBotInfo?.needs && (
          <button
            onClick={() => setShowPhysicalNeeds(!showPhysicalNeeds)}
            style={{
              fontSize: '12px',
              color: '#e0e0ff',
              fontFamily: 'system-ui',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: showPhysicalNeeds ? 'rgba(74, 158, 255, 0.2)' : 'rgba(74, 158, 255, 0.1)',
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${showPhysicalNeeds ? 'rgba(74, 158, 255, 0.4)' : 'rgba(74, 158, 255, 0.2)'}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '16px' }}>💧</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ 
                fontWeight: 600,
                color: selectedBotInfo.needs.water < 30 ? '#f44336' : 
                       selectedBotInfo.needs.water < 60 ? '#ff9800' : '#4caf50'
              }}>
                {Math.round(selectedBotInfo.needs.water)}%
              </div>
              <div style={{ fontSize: '10px', color: '#a0a0c0' }}>Physical Needs</div>
            </div>
          </button>
        )}

        {/* Connection Status */}
        <div
          ref={statusRef}
          style={{ fontSize: '13px', color: '#fbbf24', transition: 'color 0.3s' }}
        >
          ⏳ Connecting...
        </div>

        {/* Dashboard Link */}
        <a
          href="/dashboard"
          style={{
            color: '#8888cc',
            fontSize: '13px',
            textDecoration: 'none',
            padding: '4px 12px',
            border: '1px solid rgba(136,136,204,0.3)',
            borderRadius: '6px',
          }}
        >
          Dashboard →
        </a>

        {/* Reset View Button */}
        <button
          onClick={onReset}
          style={{
            color: '#e0e0ff',
            fontSize: '13px',
            background: 'rgba(74, 158, 255, 0.15)',
            padding: '4px 12px',
            border: '1px solid rgba(74, 158, 255, 0.3)',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          ↺ Reset View
        </button>
      </div>
    </div>
  );
}
