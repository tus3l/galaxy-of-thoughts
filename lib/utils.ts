import * as THREE from 'three';
import { StarData, StarMood, Vector3Tuple } from '@/types';
import { STAR_COLORS, SAMPLE_MESSAGES } from '@/config/constants';

// ==================== Star Generation ====================

/**
 * Generates a spherical distribution of stars with galaxy-like spiral pattern
 */
export function generateStarData(count: number): StarData[] {
  const stars: StarData[] = [];
  const colorKeys = Object.keys(STAR_COLORS) as StarMood[];

  for (let i = 0; i < count; i++) {
    // توزيع في عالم واسع جداً - النجوم بعيدة عن الكاميرا
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const radius = 300 + Math.random() * 3200; // نطاق أكبر (300-3500)

    // توزيع ثلاثي الأبعاد واسع
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    // كل النجوم بيضاء
    const mood = 'pure'; // أبيض
    const colorHex = '#ffffff';

    stars.push({
      id: i,
      position: [x, y, z],
      color: new THREE.Color(colorHex),
      scale: 1.5 + Math.random() * 3.5, // نجوم أكبر بكثير
      speed: 0.3 + Math.random() * 1.0, // حركة أبطأ وأنعم
      message: SAMPLE_MESSAGES[Math.floor(Math.random() * SAMPLE_MESSAGES.length)],
      mood,
      createdAt: new Date(),
    });
  }

  return stars;
}

/**
 * Generates a random position in 3D space within galaxy bounds
 * with better distribution and collision avoidance
 */
export function generateRandomPosition(radius: number = 200): Vector3Tuple {
  // Use spherical coordinates for better 3D distribution
  const theta = Math.random() * Math.PI * 2; // Angle around Y-axis (0 to 2π)
  const phi = Math.acos((Math.random() * 2) - 1); // Angle from Y-axis (0 to π)
  
  // Random radius with better distribution (closer stars more likely)
  const r = 50 + Math.pow(Math.random(), 0.7) * radius;

  // Convert spherical to Cartesian coordinates
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);

  return [x, y, z];
}

// ==================== Color Utilities ====================

/**
 * Get THREE.Color from mood
 */
export function getColorFromMood(mood: StarMood): THREE.Color {
  return new THREE.Color(STAR_COLORS[mood]);
}

/**
 * Get hex color string from mood
 */
export function getHexFromMood(mood: StarMood): string {
  return STAR_COLORS[mood];
}

// ==================== Math Utilities ====================

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start * (1 - t) + end * t;
}

/**
 * Smooth step function
 */
export function smoothstep(min: number, max: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

/**
 * Calculate distance between two 3D points
 */
export function distance3D(
  p1: Vector3Tuple,
  p2: Vector3Tuple
): number {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// ==================== Validation Utilities ====================

/**
 * Validate message content
 */
export function validateMessage(message: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = message.trim();

  if (trimmed.length < 10) {
    return {
      valid: false,
      error: 'Message must be at least 10 characters long',
    };
  }

  if (trimmed.length > 280) {
    return {
      valid: false,
      error: 'Message must be no more than 280 characters',
    };
  }

  // Check for empty or only whitespace
  if (!/\S/.test(trimmed)) {
    return {
      valid: false,
      error: 'Message cannot be empty',
    };
  }

  return { valid: true };
}

/**
 * Sanitize user input
 */
export function sanitizeMessage(message: string): string {
  return message
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .substring(0, 280); // Enforce max length
}

// ==================== Formatting Utilities ====================

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// ==================== Performance Utilities ====================

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ==================== Local Storage Utilities ====================

/**
 * Check if user has already submitted
 */
export function hasUserSubmitted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('galaxy_submitted') === 'true';
}

/**
 * Mark user as submitted
 */
export function markUserSubmitted(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('galaxy_submitted', 'true');
}

/**
 * Clear submission status (for testing)
 */
export function clearSubmissionStatus(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('galaxy_submitted');
}
