/**
 * useDraftStore — 통합 draft 저장소
 *
 * 지원 타입: 'community_post' | 'resume' | 'cover_letter'
 *
 * Usage:
 *   import { useDraftStore } from '@/stores';
 *
 *   // 저장
 *   useDraftStore.getState().saveDraft('resume', { title, content });
 *
 *   // 불러오기
 *   const draft = useDraftStore((s) => s.loadDraft('cover_letter'));
 *
 *   // 삭제
 *   useDraftStore.getState().clearDraft('community_post');
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type DraftType = 'community_post' | 'resume' | 'cover_letter';

export interface DraftEntry<T = unknown> {
  data: T;
  savedAt: string; // ISO timestamp
}

type DraftMap = Partial<Record<DraftType, DraftEntry>>;

interface DraftState {
  drafts: DraftMap;
  saveDraft: <T = unknown>(type: DraftType, data: T) => void;
  loadDraft: <T = unknown>(type: DraftType) => DraftEntry<T> | null;
  clearDraft: (type: DraftType) => void;
  clearAllDrafts: () => void;
}

export const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => ({
      drafts: {},

      saveDraft: (type, data) => {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [type]: { data, savedAt: new Date().toISOString() },
          },
        }));
      },

      loadDraft: <T>(type: DraftType) => {
        const entry = get().drafts[type];
        return (entry as DraftEntry<T> | undefined) ?? null;
      },

      clearDraft: (type) => {
        set((state) => {
          const next: DraftMap = { ...state.drafts };
          delete next[type];
          return { drafts: next };
        });
      },

      clearAllDrafts: () => set({ drafts: {} }),
    }),
    {
      name: 'draft-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
