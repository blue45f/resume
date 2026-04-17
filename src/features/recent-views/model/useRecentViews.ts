import { useState, useCallback } from 'react';

interface RecentView {
  id: string;
  title: string;
  name?: string;
  viewedAt: number;
}

const KEY = 'recent_resume_views';
const MAX = 10;

function load(): RecentView[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function useRecentViews() {
  const [views, setViews] = useState<RecentView[]>(load);

  const addView = useCallback((id: string, title: string, name?: string) => {
    setViews(prev => {
      const filtered = prev.filter(v => v.id !== id);
      const updated = [{ id, title, name, viewedAt: Date.now() }, ...filtered].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearViews = useCallback(() => {
    localStorage.removeItem(KEY);
    setViews([]);
  }, []);

  return { views, addView, clearViews };
}

export function addRecentView(id: string, title: string, name?: string) {
  const views = load().filter(v => v.id !== id);
  const updated = [{ id, title, name, viewedAt: Date.now() }, ...views].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(updated));
}
