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
});
