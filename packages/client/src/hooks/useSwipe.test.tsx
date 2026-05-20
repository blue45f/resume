import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSwipe } from './useSwipe';

function makeTouchEvent(
  touches: Array<{ x: number; y: number }>,
  changed?: Array<{ x: number; y: number }>,
): any {
  return {
    touches: touches.map((t) => ({ clientX: t.x, clientY: t.y })),
    changedTouches: (changed ?? touches).map((t) => ({ clientX: t.x, clientY: t.y })),
  };
}

describe('useSwipe', () => {
  it('returns handlers', () => {
    const { result } = renderHook(() => useSwipe());
    expect(typeof result.current.onTouchStart).toBe('function');
    expect(typeof result.current.onTouchEnd).toBe('function');
  });

  it('calls onSwipeLeft when finger moves left past threshold', () => {
    const left = vi.fn();
    const right = vi.fn();
    const { result } = renderHook(() => useSwipe(left, right, 50));
    result.current.onTouchStart(makeTouchEvent([{ x: 200, y: 100 }]));
    result.current.onTouchEnd(makeTouchEvent([{ x: 100, y: 105 }]));
    expect(left).toHaveBeenCalledTimes(1);
    expect(right).not.toHaveBeenCalled();
  });

  it('calls onSwipeRight when finger moves right past threshold', () => {
    const left = vi.fn();
    const right = vi.fn();
    const { result } = renderHook(() => useSwipe(left, right, 50));
    result.current.onTouchStart(makeTouchEvent([{ x: 100, y: 100 }]));
    result.current.onTouchEnd(makeTouchEvent([{ x: 200, y: 105 }]));
    expect(right).toHaveBeenCalledTimes(1);
    expect(left).not.toHaveBeenCalled();
  });

  it('does nothing when movement is below threshold', () => {
    const left = vi.fn();
    const right = vi.fn();
    const { result } = renderHook(() => useSwipe(left, right, 50));
    result.current.onTouchStart(makeTouchEvent([{ x: 100, y: 100 }]));
    result.current.onTouchEnd(makeTouchEvent([{ x: 110, y: 100 }]));
    expect(left).not.toHaveBeenCalled();
    expect(right).not.toHaveBeenCalled();
  });

  it('ignores when vertical movement dominates', () => {
    const left = vi.fn();
    const right = vi.fn();
    const { result } = renderHook(() => useSwipe(left, right, 50));
    result.current.onTouchStart(makeTouchEvent([{ x: 100, y: 100 }]));
    result.current.onTouchEnd(makeTouchEvent([{ x: 110, y: 300 }]));
    expect(left).not.toHaveBeenCalled();
    expect(right).not.toHaveBeenCalled();
  });
});
