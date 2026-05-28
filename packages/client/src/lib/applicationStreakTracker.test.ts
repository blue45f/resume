import { describe, expect, it } from 'vitest';
import type { JobApplication } from './api';
import {
  buildApplicationStreakReport,
  readApplicationTarget,
  writeApplicationTarget,
  APPLICATION_TARGET_STORAGE_KEY,
} from './applicationStreakTracker';

function mkApp(date: string, idx = 0): JobApplication {
  return {
    id: `app-${date}-${idx}`,
    company: '회사',
    position: '엔지니어',
    status: 'applied',
    appliedDate: date,
    createdAt: date,
    updatedAt: date,
  };
}

function memoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };
}

describe('readApplicationTarget / writeApplicationTarget', () => {
  it('returns default 5 when nothing stored', () => {
    const storage = memoryStorage();
    expect(readApplicationTarget(storage)).toBe(5);
  });

  it('round-trips an integer target', () => {
    const storage = memoryStorage();
    writeApplicationTarget(8, storage);
    expect(readApplicationTarget(storage)).toBe(8);
  });

  it('clamps target to MIN/MAX', () => {
    const storage = memoryStorage();
    writeApplicationTarget(999, storage);
    expect(readApplicationTarget(storage)).toBe(50);
    writeApplicationTarget(-2, storage);
    expect(readApplicationTarget(storage)).toBe(1);
  });

  it('falls back to default when stored value is garbage', () => {
    const storage = memoryStorage();
    storage.setItem(APPLICATION_TARGET_STORAGE_KEY, 'not-a-number');
    expect(readApplicationTarget(storage)).toBe(5);
  });
});

describe('buildApplicationStreakReport', () => {
  const now = new Date('2026-05-27T12:00:00Z'); // Wednesday

  it('returns zero-streak when there are no applications', () => {
    const report = buildApplicationStreakReport([], { now, lookbackWeeks: 4, target: 5 });
    expect(report.weeks).toHaveLength(4);
    expect(report.currentStreak).toBe(0);
    expect(report.bestStreak).toBe(0);
    expect(report.thisWeekCount).toBe(0);
    expect(report.tone).toBe('warning');
  });

  it('counts current week and computes pace', () => {
    const apps = [mkApp('2026-05-25T09:00:00Z'), mkApp('2026-05-26T09:00:00Z')];
    const report = buildApplicationStreakReport(apps, { now, target: 5 });
    expect(report.thisWeekCount).toBe(2);
    expect(report.paceNeeded).toBeGreaterThan(0);
    expect(report.daysLeftInWeek).toBe(5); // Wed -> Sun inclusive
  });

  it('detects a 3-week streak when target is met three weeks in a row', () => {
    const target = 2;
    const apps: JobApplication[] = [];
    // current week (Mon=2026-05-25 .. Sun=2026-05-31)
    apps.push(mkApp('2026-05-25T09:00:00Z', 1), mkApp('2026-05-26T09:00:00Z', 2));
    // prev week (2026-05-18 .. 24)
    apps.push(mkApp('2026-05-18T09:00:00Z', 1), mkApp('2026-05-19T09:00:00Z', 2));
    // 2 weeks ago (2026-05-11 .. 17)
    apps.push(mkApp('2026-05-11T09:00:00Z', 1), mkApp('2026-05-12T09:00:00Z', 2));
    const report = buildApplicationStreakReport(apps, { now, lookbackWeeks: 6, target });
    expect(report.currentStreak).toBe(3);
    expect(report.bestStreak).toBeGreaterThanOrEqual(3);
    expect(report.tone).toBe('good');
    expect(report.label).toContain('3주 연속');
  });

  it('breaks the streak when a recent week falls short', () => {
    const target = 2;
    const apps: JobApplication[] = [
      mkApp('2026-05-25T09:00:00Z', 1), // current week 1
      mkApp('2026-05-26T09:00:00Z', 2), // current week 2
      mkApp('2026-05-11T09:00:00Z', 1), // 2 weeks ago 1
      mkApp('2026-05-12T09:00:00Z', 2), // 2 weeks ago 2
      // prev week deliberately empty
    ];
    const report = buildApplicationStreakReport(apps, { now, lookbackWeeks: 6, target });
    expect(report.currentStreak).toBe(1); // only current week
    expect(report.bestStreak).toBeGreaterThanOrEqual(1);
  });

  it('reports the best week within the window', () => {
    const target = 2;
    const apps: JobApplication[] = [
      mkApp('2026-05-11T09:00:00Z', 1),
      mkApp('2026-05-12T09:00:00Z', 2),
      mkApp('2026-05-13T09:00:00Z', 3),
      mkApp('2026-05-14T09:00:00Z', 4),
      mkApp('2026-05-25T09:00:00Z', 5),
    ];
    const report = buildApplicationStreakReport(apps, { now, lookbackWeeks: 4, target });
    expect(report.bestWeek?.count).toBe(4);
    expect(report.bestWeek?.weekStart).toBe('2026-05-11');
  });

  it('summary surfaces pace when behind', () => {
    const report = buildApplicationStreakReport([mkApp('2026-05-25T09:00:00Z')], {
      now,
      target: 5,
    });
    expect(report.summary).toMatch(/페이스|부족|미시작/);
  });
});
