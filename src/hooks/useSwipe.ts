import { useRef, useCallback } from 'react';

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function useSwipe(onSwipeLeft?: () => void, onSwipeRight?: () => void, threshold = 50): SwipeHandlers {
  const startX = useRef(0);
  const startY = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - startX.current;
    const diffY = endY - startY.current;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
      if (diffX > 0 && onSwipeRight) onSwipeRight();
      if (diffX < 0 && onSwipeLeft) onSwipeLeft();
    }
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return { onTouchStart, onTouchEnd };
}
