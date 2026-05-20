import { describe, expect, it } from 'vitest';
import { analyzeDateConsistency } from './dateAnalyzers';

describe('analyzeDateConsistency', () => {
  it('returns empty when no dates', () => {
    const r = analyzeDateConsistency('이력서 본문입니다.');
    expect(r.hits).toHaveLength(0);
    expect(r.dominantFormat).toBeNull();
    expect(r.consistent).toBe(true);
  });

  it('detects dot format and reports consistency', () => {
    const r = analyzeDateConsistency('2020.01 ~ 2022.12 경력 보유');
    expect(r.dominantFormat).toBe('dot');
    expect(r.consistent).toBe(true);
    expect(r.formatCounts.dot).toBeGreaterThanOrEqual(2);
  });

  it('flags mixed dot + hyphen as inconsistent', () => {
    const r = analyzeDateConsistency('2020.01 ~ 2022-12 까지 근무');
    expect(r.distinctFormats).toBeGreaterThanOrEqual(2);
    expect(r.consistent).toBe(false);
    expect(r.suggestion).toMatch(/혼재|통일/);
  });

  it('recognizes Korean date format (2023년 1월)', () => {
    const r = analyzeDateConsistency('2023년 1월 입사');
    expect(r.formatCounts.korean).toBe(1);
    expect(r.dominantFormat).toBe('korean');
  });

  it('recognizes slash format', () => {
    const r = analyzeDateConsistency('2020/01 ~ 2021/12');
    expect(r.formatCounts.slash).toBeGreaterThanOrEqual(2);
  });
});
