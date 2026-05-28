import { describe, expect, it } from 'vitest';
import { detectJdApplicationUrgency } from './jdApplicationUrgencyDetector';

describe('detectJdApplicationUrgency', () => {
  it('returns unspecified for empty text', () => {
    const r = detectJdApplicationUrgency('');
    expect(r.level).toBe('unspecified');
  });

  it('detects urgent hire', () => {
    const r = detectJdApplicationUrgency('급구! 즉시 출근 가능자 우대합니다.');
    expect(r.level).toBe('urgent');
    expect(r.signals.some((s) => s.type === 'urgent_hire')).toBe(true);
  });

  it('detects fill-and-close as urgent', () => {
    const r = detectJdApplicationUrgency('적합한 인재 채용 시 조기 마감될 수 있습니다.');
    expect(r.level).toBe('urgent');
  });

  it('detects fixed deadline', () => {
    const r = detectJdApplicationUrgency('모집기간: 2026.06.15까지 지원 받습니다.');
    expect(r.level).toBe('deadline_fixed');
    expect(r.deadlineText).toBeTruthy();
  });

  it('detects deadline in month-day format', () => {
    const r = detectJdApplicationUrgency('6월 15일 마감입니다.');
    expect(r.level).toBe('deadline_fixed');
    expect(r.deadlineText).toContain('6월');
  });

  it('detects rolling recruitment', () => {
    const r = detectJdApplicationUrgency('상시 채용 중이며 연중 지원 가능합니다.');
    expect(r.level).toBe('rolling');
  });

  it('prioritizes urgent over rolling', () => {
    const r = detectJdApplicationUrgency('상시 채용이지만 급구 포지션입니다.');
    expect(r.level).toBe('urgent');
  });

  it('summary and tips are non-empty', () => {
    const r = detectJdApplicationUrgency('일반 채용 공고입니다.');
    expect(r.summary.length).toBeGreaterThan(3);
    expect(r.tips.length).toBeGreaterThan(0);
  });
});
