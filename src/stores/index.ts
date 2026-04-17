/**
 * Zustand stores — barrel export
 *
 * Usage:
 *   import { useAuthStore, useUIStore, useDraftStore } from '@/stores';
 */
export { useAuthStore } from './useAuthStore';
export type { AuthUser } from './useAuthStore';

export { useUIStore } from './useUIStore';
export type { Theme } from './useUIStore';

export { useDraftStore } from './useDraftStore';
export type { DraftType, DraftEntry } from './useDraftStore';
