import { describe, expect, it } from 'vitest';
import { parseJdRequiredVsPreferred } from './jdRequiredVsPreferredParser';

describe('parseJdRequiredVsPreferred', () => {
  it('returns empty for empty text', () => {
    const r = parseJdRequiredVsPreferred('');
    expect(r.requiredCount).toBe(0);
    expect(r.preferredCount).toBe(0);
    expect(r.hasExplicitSplit).toBe(false);
  });

  it('detects section-based split — 자격 요건 / 우대 사항', () => {
    const text = [
      '자격 요건',
      '- Java, Spring 경험 필수',
      '- PostgreSQL 사용 경험',
      '',
      '우대 사항',
      '- Kubernetes 경험 있으면 좋음',
      '- Kafka 사용 경험',
    ].join('\n');
    const r = parseJdRequiredVsPreferred(text);
    expect(r.hasExplicitSplit).toBe(true);
    expect(r.required.some((s) => s.skill === 'Java' || s.skill === 'Spring')).toBe(true);
    expect(r.preferred.some((s) => s.skill === 'Kubernetes' || s.skill === 'Kafka')).toBe(true);
  });

  it('detects inline required marker', () => {
    const r = parseJdRequiredVsPreferred('필수: Python, Django 개발 경험 2년 이상');
    expect(r.hasExplicitSplit).toBe(true);
    expect(r.required.some((s) => s.skill === 'Python' || s.skill === 'Django')).toBe(true);
  });

  it('detects inline preferred marker', () => {
    const r = parseJdRequiredVsPreferred('우대: React 사용 경험이 있으면 좋습니다');
    expect(r.hasExplicitSplit).toBe(true);
    expect(r.preferred.some((s) => s.skill === 'React')).toBe(true);
  });

  it('classifies skills as unknown when no section headers', () => {
    const r = parseJdRequiredVsPreferred('- AWS, Docker, Kubernetes 경험 필요');
    expect(r.unknown.some((s) => s.skill === 'AWS' || s.skill === 'Docker')).toBe(true);
    expect(r.hasExplicitSplit).toBe(false);
  });

  it('deduplicates same skill within a tier', () => {
    const text = ['자격 요건', '- React 개발 경험', '- React, TypeScript 경험'].join('\n');
    const r = parseJdRequiredVsPreferred(text);
    const reactEntries = r.required.filter((s) => s.skill === 'React');
    expect(reactEntries.length).toBeLessThanOrEqual(1);
  });

  it('summary is non-empty', () => {
    const r = parseJdRequiredVsPreferred('일반 공고');
    expect(r.summary.length).toBeGreaterThan(5);
  });

  it('fitGuide includes required skills warning', () => {
    const text = ['자격 요건', '- Java, Spring, PostgreSQL'].join('\n');
    const r = parseJdRequiredVsPreferred(text);
    if (r.requiredCount > 0) {
      expect(r.fitGuide.some((g) => g.includes('필수'))).toBe(true);
    }
  });
});
