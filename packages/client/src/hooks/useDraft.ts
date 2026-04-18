import { useState, useEffect, useCallback } from 'react';

const DRAFT_PREFIX = 'draft_';

export function useDraft<T extends Record<string, any>>(key: string, initial: T) {
  const storageKey = DRAFT_PREFIX + key;

  const [data, setData] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...initial, ...parsed };
      }
    } catch {}
    return initial;
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const hasContent = Object.values(data).some((v) =>
        typeof v === 'string' ? v.trim().length > 0 : !!v,
      );
      if (hasContent) {
        localStorage.setItem(storageKey, JSON.stringify(data));
        setLastSaved(new Date());
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [data, storageKey]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setData(initial);
    setLastSaved(null);
  }, [storageKey, initial]);

  const hasDraft = useCallback(() => {
    return !!localStorage.getItem(storageKey);
  }, [storageKey]);

  return { data, setData, clearDraft, hasDraft, lastSaved };
}
