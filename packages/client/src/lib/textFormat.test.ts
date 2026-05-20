import { describe, expect, it } from 'vitest';
import { analyzeBracketBalance, detectWhitespaceAnomalies } from './textFormat';

describe('analyzeBracketBalance', () => {
  it('reports balanced when brackets are paired', () => {
    const r = analyzeBracketBalance('Hello (world) [array] {object}');
    expect(r.unbalanced).toBe(false);
    expect(r.suggestion).toContain('맞');
  });

  it('flags unbalanced parentheses', () => {
    const r = analyzeBracketBalance('Hello (world');
    expect(r.unbalanced).toBe(true);
    expect(r.suggestion).toMatch(/불균형|짝/);
  });

  it('reports no brackets when none used', () => {
    const r = analyzeBracketBalance('plain text');
    expect(r.pairs).toHaveLength(0);
    expect(r.suggestion).toContain('사용되지');
  });
});

describe('detectWhitespaceAnomalies', () => {
  it('flags trailing whitespace', () => {
    const r = detectWhitespaceAnomalies('line one   \nline two');
    expect(r.anomalies.some((a) => a.type === 'trailing')).toBe(true);
    expect(r.clean).toBe(false);
  });

  it('flags tab characters', () => {
    const r = detectWhitespaceAnomalies('a\tb');
    expect(r.anomalies.some((a) => a.type === 'tab')).toBe(true);
  });

  it('flags NBSP', () => {
    const r = detectWhitespaceAnomalies('a b');
    expect(r.anomalies.some((a) => a.type === 'nbsp')).toBe(true);
  });

  it('flags fullwidth space', () => {
    const r = detectWhitespaceAnomalies('a　b');
    expect(r.anomalies.some((a) => a.type === 'fullwidth')).toBe(true);
  });

  it('returns clean=true for tidy text', () => {
    const r = detectWhitespaceAnomalies('clean text\nno issues');
    expect(r.clean).toBe(true);
    expect(r.suggestion).toContain('없습니다');
  });
});
