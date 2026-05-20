import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDraft } from './useDraft';

const KEY = 'unit-test-draft';

describe('useDraft', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default values when no draft is saved', () => {
    const { result } = renderHook(() => useDraft(KEY, { title: '', body: '' }));
    expect(result.current.data).toEqual({ title: '', body: '' });
    expect(result.current.lastSaved).toBeNull();
  });

  it('restores prior draft from localStorage on mount', () => {
    window.localStorage.setItem('draft_' + KEY, JSON.stringify({ title: 'saved' }));
    const { result } = renderHook(() => useDraft(KEY, { title: '', body: '' }));
    expect(result.current.data.title).toBe('saved');
    expect(result.current.data.body).toBe('');
  });

  it('persists data after 1s debounce and sets lastSaved', () => {
    const { result } = renderHook(() => useDraft(KEY, { title: '', body: '' }));
    act(() => {
      result.current.setData({ title: 'hello', body: '' });
    });
    // 1s 가 지나야 저장
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(window.localStorage.getItem('draft_' + KEY)).toContain('hello');
    expect(result.current.lastSaved).toBeInstanceOf(Date);
  });

  it('skips writing when all values are empty (no content)', () => {
    const { result } = renderHook(() => useDraft(KEY, { title: '', body: '' }));
    act(() => {
      result.current.setData({ title: '', body: '' });
    });
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(window.localStorage.getItem('draft_' + KEY)).toBeNull();
  });

  it('clearDraft() removes from localStorage and resets data', () => {
    window.localStorage.setItem('draft_' + KEY, JSON.stringify({ title: 'old' }));
    const { result } = renderHook(() => useDraft(KEY, { title: '', body: '' }));
    expect(result.current.data.title).toBe('old');
    act(() => {
      result.current.clearDraft();
    });
    expect(result.current.data.title).toBe('');
    expect(window.localStorage.getItem('draft_' + KEY)).toBeNull();
  });
});
