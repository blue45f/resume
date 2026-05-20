import { describe, expect, it } from 'vitest';
import { analyzeNumericFormat } from './numericFormat';

describe('analyzeNumericFormat', () => {
  it('reports no numbers for short text', () => {
    const r = analyzeNumericFormat('이력서 소개 텍스트입니다.');
    expect(r.dominant).toBeNull();
    expect(r.consistent).toBe(true);
    expect(r.distinct).toBe(0);
    expect(r.suggestion).toContain('없습니다');
  });

  it('flags consistent comma-formatted numbers', () => {
    const r = analyzeNumericFormat('매출 1,000,000원과 1,500원을 달성했습니다.');
    expect(r.comma).toBeGreaterThan(0);
    expect(r.dominant).toBe('comma');
    expect(r.consistent).toBe(true);
  });

  it('detects mixed comma + plain number formats', () => {
    const r = analyzeNumericFormat('매출 1,000원과 10000원 그리고 5000건.');
    expect(r.distinct).toBeGreaterThanOrEqual(2);
    expect(r.consistent).toBe(false);
    expect(r.suggestion).toMatch(/혼재|통일/);
  });

  it('recognizes Korean unit numbers (천/만/억)', () => {
    const r = analyzeNumericFormat('100만 명을 대상으로 100억 원 매출을 달성.');
    expect(r.korean).toBeGreaterThan(0);
  });
});
