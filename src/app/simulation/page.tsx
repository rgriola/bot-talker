/**
 * 3D simulation page with bot visualization and real-time WebSocket updates.
 * Refactored: 2026-02-21 — Phase 4 hook extraction.
 * Core logic lives in useSimulation, useSimulationClock, and useSimulationTheme.
 */

'use client';

import { useRef, useState } from 'react';

import { getPersonalityMeta } from '@/config/bot-visuals';
import { useWeather } from '@/hooks/useWeather';
import { useSimulationClock } from '@/hooks/useSimulationClock';
import { useSimulationTheme } from '@/hooks/useSimulationTheme';
import { useSimulation } from '@/hooks/useSimulation';

import {
  StatusBar,
  ActivityFeedPanel,
  PostDetailPanel,
  BotMetricsPanel,
  AirQualityPanel,
  PhysicalNeedsPanel,
  WeatherStatsPanel,
  AllBotsPanel,
  DraggablePanel,
} from '@/components/simulation';

export default function SimulationPage() {
  // ─── DOM Refs ─────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);

  // ─── Panel Toggle State ───────────────────────────────────────
  const [showFeed, setShowFeed] = useState(true);
  const [showAirQuality, setShowAirQuality] = useState(false);
  const [showWeather, setShowWeather] = useState(true);
  const [showAllBots, setShowAllBots] = useState(false);
  const [showPhysicalNeeds, setShowPhysicalNeeds] = useState(false);

  // ─── Hooks ────────────────────────────────────────────────────
  const { currentTime, location } = useSimulationClock();
  const weather = useWeather({ location });
  const uiTheme = useSimulationTheme(currentTime, location);

  const {
    statusRef,
    feedRef,
    botsRef,
    wsConnected,
    activityFeed,
    selectedPost,
    postDetail,
    detailLoading,
    selectedBotInfo,
    setSelectedBotInfo,
    allBotsData,
    simSpeed,
    selectPost,
    setSpeed,
    fullReset,
    handleReset,
  } = useSimulation({
    containerRef,
    labelsRef,
    currentTime,
    location,
    weather,
    showAllBots,
  });

  // ─── JSX ──────────────────────────────────────────────────────

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#0a0a1a' }}>
      {/* Status Bar */}
      <StatusBar
        currentTime={currentTime}
        location={location}
        weather={weather}
        selectedBotInfo={selectedBotInfo}
        showAirQuality={showAirQuality}
        setShowAirQuality={setShowAirQuality}
        showWeather={showWeather}
        setShowWeather={setShowWeather}
        showAllBots={showAllBots}
        setShowAllBots={setShowAllBots}
        statusRef={statusRef}
        onReset={handleReset}
        simSpeed={simSpeed}
        onSetSpeed={setSpeed}
        onFullReset={fullReset}
      />

      {/* Activity Feed Panel */}
      <ActivityFeedPanel
        uiTheme={uiTheme}
        activityFeed={activityFeed}
        selectedPost={selectedPost}
        selectPost={selectPost}
        showFeed={showFeed}
        setShowFeed={setShowFeed}
        feedRef={feedRef}
        isConnected={wsConnected}
      />

      {/* Bot Metrics Panel */}
      {selectedBotInfo && (
        <DraggablePanel id="bot-metrics" initialTop="115px" initialLeft={showFeed ? '288px' : '8px'}>
          <BotMetricsPanel
            uiTheme={uiTheme}
            selectedBotInfo={selectedBotInfo}
            showFeed={showFeed}
            onClose={() => setSelectedBotInfo(null)}
            showPhysicalNeeds={showPhysicalNeeds}
            onToggleNeeds={() => setShowPhysicalNeeds(!showPhysicalNeeds)}
          />
        </DraggablePanel>
      )}

      {/* Weather Stats Panel (Top Right) */}
      {showWeather && weather && (
        <DraggablePanel id="weather-stats" initialTop="80px" initialRight="25px">
          <WeatherStatsPanel
            uiTheme={uiTheme}
            weather={weather}
          />
        </DraggablePanel>
      )}

      {/* Air Quality Panel */}
      {showAirQuality && weather?.airQuality && (
        <DraggablePanel id="air-quality" initialTop="115px" initialRight="8px">
          <AirQualityPanel
            uiTheme={uiTheme}
            airQuality={weather.airQuality}
            onClose={() => setShowAirQuality(false)}
          />
        </DraggablePanel>
      )}

      {/* Physical Needs Panel */}
      {showPhysicalNeeds && selectedBotInfo?.needs && (
        <DraggablePanel id="physical-needs" initialTop="115px" initialRight={showAirQuality && weather?.airQuality ? '348px' : '8px'}>
          <PhysicalNeedsPanel
            uiTheme={uiTheme}
            selectedBotInfo={selectedBotInfo}
            needs={selectedBotInfo.needs}
            showAirQuality={showAirQuality}
            hasAirQuality={!!weather?.airQuality}
            onClose={() => setShowPhysicalNeeds(false)}
          />
        </DraggablePanel>
      )}

      {/* All Bots Dashboard */}
      {showAllBots && (
        <DraggablePanel id="all-bots" initialTop="50%" initialLeft="50%" center zIndex={100}>
          <AllBotsPanel
            uiTheme={uiTheme}
            bots={allBotsData}
            onClose={() => setShowAllBots(false)}
            onSelectBot={(botId) => {
              const entity = botsRef.current.get(botId);
              if (entity) {
                setSelectedBotInfo({
                  ...entity.data,
                  color: entity.data.color || '#888888',
                  postCount: entity.postCount
                });
                setShowAllBots(false);
              }
            }}
          />
        </DraggablePanel>
      )}

      {/* Post Detail Panel */}
      {selectedPost && (
        <PostDetailPanel
          uiTheme={uiTheme}
          selectedPost={selectedPost}
          postDetail={postDetail}
          detailLoading={detailLoading}
          onClose={() => selectPost(null)}
        />
      )}

      {/* Bot Types Legend — hidden on mobile */}
      <div
        className="hidden md:flex"
        style={{
          position: 'absolute',
          top: '56px',
          left: '290px',
          background: 'rgba(10,10,26,0.85)',
          border: '1px solid rgba(74, 158, 255, 0.2)',
          borderRadius: '12px',
          padding: '12px 16px',
          zIndex: 10,
          fontFamily: "'Inter', system-ui, sans-serif",
          backdropFilter: 'blur(10px)',
          gap: '14px',
          alignItems: 'center',
        }}
      >
        <div style={{ color: '#8888cc', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' as const }}>
          Bot Types
        </div>
        {Object.entries(
          { tech: getPersonalityMeta('tech'), philo: getPersonalityMeta('philo'), art: getPersonalityMeta('art'), science: getPersonalityMeta('science'), pirate: getPersonalityMeta('pirate') }
        ).map(([key, meta]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#ccc', fontSize: '12px' }}>
              {meta.emoji} {meta.label}
            </span>
          </div>
        ))}
      </div>

      {/* Controls hint — hidden on mobile */}
      <div
        className="hidden md:block"
        style={{
          position: 'absolute',
          bottom: '20px',
          right: selectedPost ? '360px' : '20px',
          background: 'rgba(10,10,26,0.85)',
          border: '1px solid rgba(74,158,255,0.2)',
          borderRadius: '12px',
          padding: '12px 16px',
          zIndex: 10,
          fontFamily: "'Inter', system-ui, sans-serif",
          backdropFilter: 'blur(10px)',
          color: '#666',
          fontSize: '11px',
          lineHeight: '1.6',
          transition: 'right 0.2s ease',
        }}
      >
        <span style={{ color: '#888' }}>🖱️ Drag</span> rotate &nbsp;·&nbsp;
        <span style={{ color: '#888' }}>⚙️ Scroll</span> zoom &nbsp;·&nbsp;
        <span style={{ color: '#888' }}>Right-Drag</span> pan &nbsp;·&nbsp;
        <span style={{ color: '#888' }}>Click</span> bot
      </div>

      {/* Labels container */}
      <div
        ref={labelsRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}
      />

      {/* Three.js canvas container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      <style dangerouslySetInnerHTML={{
        __html: `
        .bot-label {
          position: absolute;
          top: 0;
          left: 0;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #e0e0ff;
          text-shadow: 0 1px 4px rgba(0,0,0,0.8);
          white-space: nowrap;
          pointer-events: none;
          transition: opacity 0.2s;
        }
        .speech-bubble {
          position: absolute;
          top: 0;
          left: 0;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 11px;
          color: #fff;
          padding: 6px 10px;
          background: rgba(10, 10, 26, 0.95);
          border: 1px solid rgba(74, 158, 255, 0.3);
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.4);
          max-width: 180px;
          pointer-events: none;
          z-index: 100;
          animation: bubble-fade-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes bubble-fade-in {
          0% { transform: scale(0.8) translateY(10px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes fadeInMsg {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .urgent-need-label {
          position: absolute;
          top: 0;
          left: 0;
          font-size: 22px;
          pointer-events: none;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));
          animation: urgentPulse 1.2s ease-in-out infinite;
          z-index: 6;
        }
        @keyframes urgentPulse {
          0%, 100% { transform: translate(-50%, -100%) scale(1); }
          50% { transform: translate(-50%, -100%) scale(1.3); }
        }
        .activity-scroll::-webkit-scrollbar { width: 4px; }
        .activity-scroll::-webkit-scrollbar-track { background: transparent; }
        .activity-scroll::-webkit-scrollbar-thumb { background: rgba(74,158,255,0.2); border-radius: 2px; }
      ` }} />
    </div>
  );
}
