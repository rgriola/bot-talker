/**
 * Left sidebar panel displaying bot activity feed with posts.
 * Refactored: 2026-02-16 @ extraction from page.tsx
 */

import { RefObject, useEffect } from 'react';
import type { UiTheme, ActivityMessage } from '@/types/simulation';
import { renderContentWithLinks } from '@/utils/content';
import { ensureContrastRatio } from '@/utils/color';

export interface ActivityFeedPanelProps {
  /** UI theme for day/night styling */
  uiTheme: UiTheme;
  /** Array of activity messages to display */
  activityFeed: ActivityMessage[];
  /** Currently selected post (if any) */
  selectedPost: ActivityMessage | null;
  /** Callback when a post is selected */
  selectPost: (msg: ActivityMessage | null) => void;
  /** Whether the feed panel is visible */
  showFeed: boolean;
  /** Callback to toggle feed visibility */
  setShowFeed: (show: boolean) => void;
  /** Ref for the scrollable feed container */
  feedRef: RefObject<HTMLDivElement | null>;
  /** Whether the WebSocket broadcast is connected */
  isConnected?: boolean;
}
/**
 * Activity feed panel showing recent bot posts in a left sidebar.
 * Supports selecting posts to view details, with animated transitions.
 */
export function ActivityFeedPanel({
  uiTheme,
  activityFeed,
  selectedPost,
  selectPost,
  showFeed,
  setShowFeed,
  feedRef,
  isConnected = false,
}: ActivityFeedPanelProps) {
  // Log feed changes to debug lagging, missing colors, and repetition
  useEffect(() => {
    if (activityFeed.length > 0) {
      const latest = activityFeed[0];
      console.log(`[ActivityUI] Feed Update: ${activityFeed.length} items.`, {
        latestBot: latest.botName,
        latestColor: latest.botColor,
        latestText: latest.text.substring(0, 30) + '...',
        isConnected
      });
    } else if (isConnected) {
      console.log('[ActivityUI] Feed is currently empty.');
    }
  }, [activityFeed, isConnected]);

  // Feed toggle button when panel is hidden
  if (!showFeed) {
    return (
      <button
        onClick={() => setShowFeed(true)}
        style={{
          position: 'absolute',
          top: '56px',
          left: '0',
          background: uiTheme.panelBg,
          borderTop: `1px solid ${uiTheme.borderColor}`,
          borderRight: `1px solid ${uiTheme.borderColor}`,
          borderBottom: `1px solid ${uiTheme.borderColor}`,
          borderLeft: 'none',
          borderRadius: '0 8px 8px 0',
          padding: '8px 10px',
          color: uiTheme.textSecondary,
          cursor: 'pointer',
          zIndex: 10,
          fontSize: '14px',
          transition: 'background 0.5s, border-color 0.5s, color 0.5s',
        }}
      >
        💬
      </button>
    );
  }

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: '48px',
          left: '0',
          width: 'min(280px, 85vw)', // Responsive: cap at 85vw on mobile
          bottom: '0',
          background: uiTheme.panelBg,
          borderRight: `1px solid ${uiTheme.borderColor}`,
          zIndex: 10,
          fontFamily: "'Inter', system-ui, sans-serif",
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column' as const,
          transition: 'background 0.5s, border-color 0.5s',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${uiTheme.borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ color: uiTheme.textSecondary, fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' as const, display: 'flex', alignItems: 'center', gap: '6px' }}>
            📡 Broadcast
            {isConnected && (
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                color: '#fff',
                background: '#ef4444',
                padding: '1px 5px',
                borderRadius: '3px',
                letterSpacing: '0.5px',
                animation: 'livePulse 2s ease-in-out infinite',
              }}>LIVE</span>
            )}
          </span>
          <button
            onClick={() => setShowFeed(false)}
            style={{
              color: uiTheme.textMuted,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Feed Content */}
        <div
          ref={feedRef}
          style={{
            flex: 1,
            overflowY: 'auto' as const,
            padding: '8px 12px',
          }}
        >
          {activityFeed.length === 0 && (
            <div style={{ color: uiTheme.textSecondary, fontSize: '12px', textAlign: 'center' as const, marginTop: '40px', padding: '0 16px' }}>
              <div style={{ fontSize: '28px', marginBottom: '12px', animation: isConnected ? undefined : 'signalPulse 1.5s ease-in-out infinite' }}>📡</div>
              <div style={{ fontWeight: 600, marginBottom: '4px', color: uiTheme.textPrimary }}>
                {isConnected ? 'Listening for broadcasts...' : 'Tuning into broadcast...'}
              </div>
              <div style={{ fontSize: '11px', color: uiTheme.textMuted }}>
                {isConnected ? 'Bot transmissions will appear here' : 'Searching for signal'}
              </div>
            </div>
          )}

          {activityFeed.map(msg => {
            const isReply = !!msg.parentId;

            return (
              <div
                key={msg.id}
                onClick={() => selectPost(msg)}
                style={{
                  padding: '14px',
                  marginBottom: '10px',
                  background: selectedPost?.id === msg.id ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '16px',
                  animation: 'fadeInMsg 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  border: `1px solid ${selectedPost?.id === msg.id ? ensureContrastRatio(msg.botColor, uiTheme.panelBgHex, 3.0) : 'rgba(255, 255, 255, 0.05)'}`,
                  boxShadow: selectedPost?.id === msg.id ? `0 8px 16px -4px ${msg.botColor}33` : 'none',
                  position: 'relative',
                }}
              >
                {/* Thread indicator if reply */}
                {isReply && (
                  <div style={{
                    fontSize: '10px',
                    color: uiTheme.textMuted,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginBottom: '-2px',
                    opacity: 0.8
                  }}>
                    <span style={{ fontSize: '12px' }}>↩️</span> replied in thread
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  {/* Avatar Circle */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '12px', // Squircle
                    background: ensureContrastRatio(msg.botColor, uiTheme.panelBgHex, 3.0),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${msg.botColor}44`,
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  }}>
                    {msg.botName.substring(0, 1)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ color: uiTheme.textPrimary, fontSize: '14px', fontWeight: 700, letterSpacing: '-0.2px' }}>
                        {msg.botName}
                      </span>
                      <span style={{ color: uiTheme.textMuted, fontSize: '10px', fontWeight: 500 }}>
                        {msg.time}
                      </span>
                    </div>

                    {/* Content */}
                    <div style={{
                      color: uiTheme.textSecondary,
                      fontSize: '13px',
                      lineHeight: '1.5',
                      letterSpacing: '0.01em',
                      wordBreak: 'break-word' as const,
                      display: '-webkit-box',
                      WebkitLineClamp: isReply ? 8 : 4, // Allow more space for replies
                      WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden',
                      transition: 'color 0.5s',
                    }}>
                      {renderContentWithLinks(msg.content || msg.text)}
                    </div>
                  </div>
                </div>

                {/* Interaction hints - subtle */}
                <div style={{
                  marginTop: '4px',
                  display: 'flex',
                  gap: '12px',
                  paddingLeft: '48px',
                  opacity: 0.4
                }}>
                  <span style={{ fontSize: '11px' }}>💬</span>
                  <span style={{ fontSize: '11px' }}>🔄</span>
                  <span style={{ fontSize: '11px' }}>❤️</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Keyframe animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes signalPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes fadeInMsg {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </>
  );
}
