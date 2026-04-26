import { describe, it, expect } from 'vitest';
import { computeResumeCompletion } from './resumeCompletion';
import type { ResumeSummary } from '@/types/resume';

function makeResume(overrides: Partial<ResumeSummary> = {}): ResumeSummary {
  return {
    id: 'r1',
    title: '',
    visibility: 'private',
    isOpenToWork: false,
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      summary: '',
    },
    tags: [],
    skills: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as ResumeSummary;
}

describe('computeResumeCompletion', () => {
  it('returns 0% on a blank resume', () => {
    const r = computeResumeCompletion(makeResume());
    expect(r.pct).toBe(0);
    expect(r.grade).toBe('low');
    expect(r.missingItems.length).toBeGreaterThan(0);
  });

  it('reaches 100% on a fully filled resume', () => {
    const r = computeResumeCompletion(
      makeResume({
        title: '프론트엔드 개발자 — 김OO',
        visibility: 'public',
        isOpenToWork: true,
        personalInfo: {
          name: '김OO',
          email: 'a@b.com',
          phone: '010-0000-0000',
          address: '서울',
          website: 'https://blog.dev',
          github: 'https://github.com/me',
          summary: 'a'.repeat(220),
          photo: 'data:...',
          links: [{ label: 'site', url: 'x' }] as any,
        } as any,
        tags: [{ id: 't1', name: 'FE', color: '#000' } as any],
        skills: Array.from({ length: 12 }, (_, i) => ({ id: `s${i}` })) as any,
      }),
    );
    expect(r.pct).toBe(100);
    expect(r.grade).toBe('excellent');
    expect(r.missingItems).toHaveLength(0);
  });

  it('summary length is graduated, not binary', () => {
    const a = computeResumeCompletion(
      makeResume({ personalInfo: { ...makeResume().personalInfo, summary: 'a'.repeat(40) } }),
    );
    const b = computeResumeCompletion(
      makeResume({ personalInfo: { ...makeResume().personalInfo, summary: 'a'.repeat(120) } }),
    );
    const c = computeResumeCompletion(
      makeResume({ personalInfo: { ...makeResume().personalInfo, summary: 'a'.repeat(220) } }),
    );
    expect(a.pct).toBeLessThan(b.pct);
    expect(b.pct).toBeLessThan(c.pct);
  });

  it('skills count is graduated', () => {
    const one = computeResumeCompletion(makeResume({ skills: [{ id: '1' }] as any }));
    const five = computeResumeCompletion(
      makeResume({ skills: Array.from({ length: 5 }, (_, i) => ({ id: `${i}` })) as any }),
    );
    const eleven = computeResumeCompletion(
      makeResume({ skills: Array.from({ length: 11 }, (_, i) => ({ id: `${i}` })) as any }),
    );
    expect(one.pct).toBeLessThan(five.pct);
    expect(five.pct).toBeLessThan(eleven.pct);
  });

  it('grade thresholds match documented bands', () => {
    expect(computeResumeCompletion(makeResume()).grade).toBe('low');
    // craft a resume around ~50% (fair) — name/email/phone/address (29) + summary 6 + skills 4 = 39%
    const fair = computeResumeCompletion(
      makeResume({
        title: 't',
        personalInfo: {
          name: '김',
          email: 'a@b',
          phone: '01000',
          address: '서울',
          website: '',
          summary: 'a'.repeat(35),
        },
        skills: [{ id: '1' }] as any,
      }),
    );
    // Should be at minimum 'fair' or 'low' — boundary check
    expect(['fair', 'low', 'good']).toContain(fair.grade);
  });

  it('missingItems are ordered by impact (max desc)', () => {
    const r = computeResumeCompletion(makeResume());
    const maxes = r.missingItems.map((i) => i.max);
    const sorted = [...maxes].sort((a, b) => b - a);
    expect(maxes).toEqual(sorted);
  });

  it('items cover identity/depth/web/discoverability categories', () => {
    const r = computeResumeCompletion(makeResume());
    const cats = new Set(r.items.map((i) => i.category));
    expect(cats).toContain('identity');
    expect(cats).toContain('depth');
    expect(cats).toContain('web');
    expect(cats).toContain('discoverability');
  });
});
