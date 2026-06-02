import { useEffect, useRef, useState } from 'react';

/** ease-out quint — DESIGN.md 모션 토큰과 동일한 감속 곡선 (cubic-bezier(0.22,1,0.36,1) 의 수치 등가). */
function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

interface CountUpOptions {
  /** 애니메이션 길이(ms). 기본 900ms — 분석 점수 reveal 용. */
  durationMs?: number;
  /** 시작값. 기본 0. */
  from?: number;
}

/**
 * 정수 카운트업. 목표값이 바뀔 때마다 이전 표시값에서 새 값으로 ease-out 감속하며 센다.
 * prefers-reduced-motion 이면 즉시 최종값으로 고정한다(애니메이션 없음).
 *
 * 분석 점수 링/레이더의 "살아 있는" reveal 에 사용. 정확한 최종값은 항상 보존된다.
 */
export function useCountUp(target: number, { durationMs = 900, from = 0 }: CountUpOptions = {}) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : from));
  const frameRef = useRef<number | null>(null);
  const startValueRef = useRef(value);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }

    const start = performance.now();
    const startValue = startValueRef.current;
    const delta = target - startValue;

    if (delta === 0) {
      setValue(target);
      return;
    }

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const next = Math.round(startValue + delta * easeOutQuint(t));
      setValue(next);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        startValueRef.current = target;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [target, durationMs]);

  return value;
}
