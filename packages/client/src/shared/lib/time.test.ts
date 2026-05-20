import { describe, expect, it } from 'vitest';
import { timeAgo } from './time';

function isoMinutesAgo(min: number): string {
  return new Date(Date.now() - min * 60_000).toISOString();
}

describe('timeAgo', () => {
  it('returns "방금 전" for <1 minute', () => {
    expect(timeAgo(new Date().toISOString())).toBe('방금 전');
  });

  it('returns minute label for <60 minutes', () => {
    expect(timeAgo(isoMinutesAgo(5))).toBe('5분 전');
    expect(timeAgo(isoMinutesAgo(59))).toBe('59분 전');
  });

  it('returns hour label for <24 hours', () => {
    expect(timeAgo(isoMinutesAgo(60))).toBe('1시간 전');
    expect(timeAgo(isoMinutesAgo(60 * 5))).toBe('5시간 전');
  });

  it('returns day label for <7 days', () => {
    expect(timeAgo(isoMinutesAgo(60 * 24 * 2))).toBe('2일 전');
  });

  it('returns week label for <30 days', () => {
    expect(timeAgo(isoMinutesAgo(60 * 24 * 14))).toBe('2주 전');
  });

  it('returns month label for <365 days', () => {
    expect(timeAgo(isoMinutesAgo(60 * 24 * 60))).toBe('2개월 전');
  });

  it('returns year label for >=365 days', () => {
    expect(timeAgo(isoMinutesAgo(60 * 24 * 365 * 3))).toBe('3년 전');
  });
});
