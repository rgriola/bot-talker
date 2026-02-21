/**
 * PostCard — shared post card component for feed-style views.
 * Renders avatar, agent name link, verified badge, timestamp, content,
 * score, and a collapsible comment section (via children).
 * Refactored: 2026-02-21 — Phase 3 shared UI components
 */

'use client';

import Link from 'next/link';
import type { Post } from '@/types/post';
import { renderContentWithLinks } from '@/utils/content';

export interface PostCardProps {
  post: Post;
  /** Format a date string for display */
  formatDate?: (date: string) => string;
  /** Whether comments section is expanded */
  isExpanded?: boolean;
  /** Whether comments are currently loading */
  isLoadingComments?: boolean;
  /** Called when the comments toggle is clicked */
  onToggleComments?: () => void;
  /** Rendered inside the collapsible comments section (e.g. CommentThread) */
  children?: React.ReactNode;
}

const defaultDateFormat = (date: string) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export function PostCard({
  post,
  formatDate = defaultDateFormat,
  isExpanded = false,
  isLoadingComments = false,
  onToggleComments,
  children,
}: PostCardProps) {
  const agentColor = post.agent.color || '#7c3aed';
  const commentCount = post._count?.comments ?? 0;

  return (
    <article
      className="bg-white/10 backdrop-blur-lg rounded-xl p-6"
      style={{ borderLeft: `4px solid ${agentColor}` }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ background: agentColor }}
        >
          {post.agent.name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={`/bot/${encodeURIComponent(post.agent.name)}`}
              className="font-semibold text-white hover:underline"
            >
              {post.agent.name}
            </Link>
            {post.agent.verifiedAt && (
              <span className="text-blue-400 text-sm" title={`@${post.agent.blueskyHandle}`}>
                ✓ Bluesky
              </span>
            )}
          </div>
          <div className="text-purple-300 text-sm">{formatDate(post.createdAt)}</div>
        </div>
      </div>

      {/* Content */}
      <div className="text-purple-100 mb-4 whitespace-pre-wrap">
        {renderContentWithLinks(post.content)}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-6 text-purple-300 text-sm">
        {post.score !== undefined && (
          <span className={post.score > 0 ? 'text-green-400' : post.score < 0 ? 'text-red-400' : ''}>
            ⬆️ {post.score} votes
          </span>
        )}
        {onToggleComments && (
          <button
            onClick={onToggleComments}
            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
            disabled={isLoadingComments}
          >
            <span>{isExpanded ? '🔽' : '💬'}</span>
            <span>{commentCount} comments</span>
            {isLoadingComments && <span className="animate-spin">⏳</span>}
          </button>
        )}
      </div>

      {/* Collapsible Comments */}
      {isExpanded && children}
    </article>
  );
}
