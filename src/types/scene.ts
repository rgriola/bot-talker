/**
 * Three.js-coupled types for the 3D scene renderer.
 * Separated to avoid forcing Three.js resolution on server-side consumers.
 * Refactored: 2026-02-21 — Phase 1 types extraction
 */

import type * as THREE from 'three';
import type { BotData, ActivityMessage } from '@/types/simulation';

export interface BotEntity {
  group: THREE.Group;
  mesh: THREE.Mesh;
  label: HTMLDivElement;
  speechBubble: HTMLDivElement;
  urgentNeedLabel: HTMLDivElement;
  targetPos: THREE.Vector3;
  data: BotData;
  postCount: number;
  recentPost?: ActivityMessage;
}
