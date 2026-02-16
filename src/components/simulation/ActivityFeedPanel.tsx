/**
 * Left sidebar panel displaying bot activity feed with posts.
 * Refactored: 2026-02-16 @ extraction from page.tsx
 */

import { RefObject } from 'react';
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
}: ActivityFeedPanelProps) {
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
          border: `1px solid ${uiTheme.borderColor}`,
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
    <div
      style={{
        position: 'absolute',
        top: '48px',
        left: '0',
        width: '280px',
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
        <span style={{ color: uiTheme.textSecondary, fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' as const }}>
          💬 Activity
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
          <div style={{ color: uiTheme.textSecondary, fontSize: '12px', textAlign: 'center' as const, marginTop: '20px' }}>
            Bot posts will appear here...
          </div>
        )}
        {activityFeed.map(msg => (
          <div
            key={msg.id}
            onClick={() => selectPost(msg)}
            style={{
              padding: '8px 10px',
              marginBottom: '6px',
              background: selectedPost?.id === msg.id ? uiTheme.cardBgHover : uiTheme.cardBg,
              borderRadius: '8px',
              borderLeft: `4px solid ${ensureContrastRatio(msg.botColor, uiTheme.panelBgHex, 3.0)}`,
              animation: 'fadeInMsg 0.3s ease',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: ensureContrastRatio(msg.botColor, uiTheme.panelBgHex, 4.5), fontSize: '11px', fontWeight: 600 }}>
                {msg.botName}
              </span>
              <span style={{ color: uiTheme.textSecondary, fontSize: '10px' }}>
                {msg.time}
              </span>
            </div>
            <div style={{
              color: uiTheme.textPrimary,
              fontSize: '12px',
              lineHeight: '1.4',
              wordBreak: 'break-word' as const,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap' as const,
              transition: 'color 0.5s',
              fontWeight: 600,
            }}>
              {msg.text}
            </div>
            {/* Content preview with citations */}
            {msg.content && (
              <div style={{
                color: uiTheme.textSecondary,
                fontSize: '11px',
                lineHeight: '1.4',
                marginTop: '4px',
                wordBreak: 'break-word' as const,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as const,
                overflow: 'hidden',
                transition: 'color 0.5s',
              }}>
                {renderContentWithLinks(msg.content.length > 150 ? msg.content.substring(0, 150) + '...' : msg.content)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
