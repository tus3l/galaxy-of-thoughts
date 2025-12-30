// Global type definitions for the Galaxy of Thoughts project

import * as THREE from 'three';

// ==================== Star Types ====================

export interface StarData {
  id: number;
  position: [number, number, number];
  color: THREE.Color;
  scale: number;
  speed: number;
  message: string;
  author?: string;
  createdAt?: Date;
  mood?: StarMood;
}

export type StarMood = 'dream' | 'secret' | 'advice' | 'wish' | 'love' | 'hope' | 'thought' | 'pure';

export interface StarColors {
  dream: string;
  secret: string;
  advice: string;
  wish: string;
  love: string;
  hope: string;
  thought: string;
  pure: string;
}

// ==================== Database Types ====================

export interface DatabaseStar {
  id: number;
  message: string;
  position_x: number;
  position_y: number;
  position_z: number;
  color: string;
  mood: StarMood;
  fingerprint_id: string;
  created_at: string;
  is_approved: boolean;
}

// ==================== API Types ====================

export interface CreateStarRequest {
  message: string;
  mood: StarMood;
  fingerprintId: string;
}

export interface CreateStarResponse {
  success: boolean;
  star?: StarData;
  error?: string;
}

export interface ModerationResult {
  flagged: boolean;
  categories: {
    hate: boolean;
    'hate/threatening': boolean;
    'self-harm': boolean;
    sexual: boolean;
    'sexual/minors': boolean;
    violence: boolean;
    'violence/graphic': boolean;
  };
}

// ==================== Component Props ====================

export interface SceneProps {
  onStarClick?: (star: StarData) => void;
  onStarHover?: (star: StarData | null) => void;
}

export interface GalaxyProps {
  starCount?: number;
  starData?: StarData[];
  onStarClick?: (star: StarData) => void;
  onStarHover?: (star: StarData | null) => void;
}

export interface MessageOverlayProps {
  star: StarData | null;
  isVisible: boolean;
  onClose: () => void;
}

export interface AddStarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string, mood: StarMood) => Promise<void>;
}

// ==================== Camera Animation ====================

export interface CameraTarget {
  position: [number, number, number];
  lookAt: [number, number, number];
  duration: number;
  easing?: string;
}

// ==================== Shader Uniforms ====================

export interface StarShaderUniforms {
  uTime: { value: number };
  uPixelRatio: { value: number };
  uHoveredIndex: { value: number };
  uClickedIndex: { value: number };
}

// ==================== Utility Types ====================

export type Vector3Tuple = [number, number, number];
export type ColorString = `#${string}`;

// ==================== Configuration ====================

export interface AppConfig {
  maxStars: number;
  galaxyRadius: number;
  autoRotateSpeed: number;
  cameraTransitionDuration: number;
  bloomIntensity: number;
  postProcessingEnabled: boolean;
}

// ==================== Error Types ====================

export class GalaxyError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'GalaxyError';
  }
}

export class ValidationError extends GalaxyError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class ModerationError extends GalaxyError {
  constructor(message: string) {
    super(message, 'MODERATION_ERROR', 403);
    this.name = 'ModerationError';
  }
}

export class RateLimitError extends GalaxyError {
  constructor(message: string) {
    super(message, 'RATE_LIMIT_ERROR', 429);
    this.name = 'RateLimitError';
  }
}
