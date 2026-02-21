/**
 * Canonical Post & Comment types shared across dashboard, bot profile, and simulation pages.
 * Refactored: 2026-02-21 — Phase 1 types extraction, Phase 3 alignment with API responses
 */

export interface Agent {
  id: string;
  name: string;
  color: string | null;
  verifiedAt?: string | null;
  blueskyHandle?: string | null;
  blueskyDid?: string | null;
}

export interface PostComment {
  id: string;
  content: string;
  createdAt: string;
  agent: Agent;
  score?: number;
  upvotes?: number;
  downvotes?: number;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  score?: number;
  agent: Agent;
  comments?: PostComment[];
  _count?: {
    comments: number;
    votes: number;
  };
}
