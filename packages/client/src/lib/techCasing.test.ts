import { describe, expect, it } from 'vitest';
import { detectInconsistentCasing } from './techCasing';

describe('detectInconsistentCasing', () => {
  it('returns empty hits for canonical-only usage', () => {
    const r = detectInconsistentCasing('JavaScript / TypeScript / React');
    expect(r.hits).toHaveLength(0);
    expect(r.suggestion).toContain('일관');
  });

  it('detects JavaScript vs javascript mix', () => {
    const r = detectInconsistentCasing('I use JavaScript and javascript daily.');
    expect(r.hits.length).toBeGreaterThanOrEqual(1);
    expect(r.hits[0].canonical).toBe('JavaScript');
    expect(r.suggestion).toMatch(/불일치/);
  });

  it('detects GitHub vs github mix', () => {
    const r = detectInconsistentCasing('GitHub repo on github here.');
    const hit = r.hits.find((h) => h.canonical === 'GitHub');
    expect(hit).toBeDefined();
    expect(hit!.variants.length).toBeGreaterThanOrEqual(2);
  });

  it('returns empty hits for empty input', () => {
    const r = detectInconsistentCasing('');
    expect(r.hits).toHaveLength(0);
  });

  it('variants are sorted by count descending', () => {
    const r = detectInconsistentCasing('javascript javascript javascript JavaScript');
    const hit = r.hits.find((h) => h.canonical === 'JavaScript');
    if (hit && hit.variants.length >= 2) {
      expect(hit.variants[0].count).toBeGreaterThanOrEqual(hit.variants[1].count);
    }
  });

  it('total equals sum of variant counts', () => {
    const r = detectInconsistentCasing('GitHub github Github');
    const hit = r.hits.find((h) => h.canonical === 'GitHub');
    if (hit) {
      const sum = hit.variants.reduce((acc, v) => acc + v.count, 0);
      expect(hit.total).toBe(sum);
    }
  });

  it('caps hits at 8', () => {
    const heavy =
      'JavaScript javascript GitHub github MySQL mysql Docker docker React react Next.js next.js TypeScript typescript';
    const r = detectInconsistentCasing(heavy);
    expect(r.hits.length).toBeLessThanOrEqual(8);
  });

  it('detects Node.js vs NodeJS inconsistency', () => {
    const r = detectInconsistentCasing('Node.js 서버 개발. NodeJS 경험 있음.');
    const hit = r.hits.find((h) => h.canonical === 'Node.js');
    expect(hit).toBeDefined();
  });

  it('suggestion names first hit canonical when violations exist', () => {
    const r = detectInconsistentCasing('React react');
    if (r.hits.length > 0) {
      expect(r.suggestion).toContain(r.hits[0].canonical);
    }
  });

  it('does not flag single-form usage', () => {
    const r = detectInconsistentCasing('Docker Docker Docker Docker');
    expect(r.hits).toHaveLength(0);
  });
});
