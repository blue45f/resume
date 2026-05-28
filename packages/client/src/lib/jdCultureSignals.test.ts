import { describe, expect, it } from 'vitest';
import { buildJdCultureReport } from './jdCultureSignals';

describe('buildJdCultureReport', () => {
  it('returns neutral when text is empty', () => {
    const report = buildJdCultureReport('');
    expect(report.hits).toEqual([]);
    expect(report.specificityScore).toBe(0);
    expect(report.tone).toBe('neutral');
  });

  it('detects 수평적 문화 vague claim', () => {
    const report = buildJdCultureReport('우리는 수평적인 문화를 지향합니다.');
    expect(report.hits.some((h) => h.category === 'flat')).toBe(true);
    expect(report.hits[0]?.interviewQuestion).toMatch(/주니어|결정/);
  });

  it('flags 워라밸 as high severity', () => {
    const report = buildJdCultureReport('워라밸을 보장하는 회사입니다.');
    const hit = report.hits.find((h) => h.category === 'work-life');
    expect(hit?.severity).toBe('high');
  });

  it('flags 가족같은 분위기 as high severity', () => {
    const report = buildJdCultureReport('가족 같은 분위기에서 일합니다.');
    const hit = report.hits.find((h) => h.category === 'family');
    expect(hit?.severity).toBe('high');
  });

  it('rewards concrete signals (numbers, named programs)', () => {
    const text = `연차 15일, 주 2일 재택 근무, 식대 월 15만원, 평균 근속 4.5년.
    빠르게 성장하는 회사입니다.`;
    const report = buildJdCultureReport(text);
    expect(report.concreteSignals).toBeGreaterThanOrEqual(3);
    expect(report.specificityScore).toBeGreaterThan(50);
  });

  it('penalizes JD packed with vague claims', () => {
    const text = `수평적 문화, 자율과 책임, 워라밸 보장, 빠르게 성장하는 조직,
    가족같은 분위기, 열정적인 동료들과 함께합니다.`;
    const report = buildJdCultureReport(text);
    expect(report.hits.length).toBeGreaterThanOrEqual(5);
    expect(report.specificityScore).toBeLessThan(50);
    expect(report.tone).toBe('warning');
  });

  it('detects English equivalents', () => {
    const report = buildJdCultureReport(
      'We are a high-growth, fast-paced startup with a flat organization and passionate team.',
    );
    const cats = report.hits.map((h) => h.category);
    expect(cats).toEqual(expect.arrayContaining(['growth', 'flat', 'passionate-team']));
  });

  it('sorts hits with high severity first', () => {
    const text = `우리는 빠르게 성장하는 조직이며 워라밸을 보장합니다.`;
    const report = buildJdCultureReport(text);
    if (report.hits.length >= 2) {
      const rank = { high: 0, medium: 1, low: 2 } as const;
      expect(rank[report.hits[0]!.severity]).toBeLessThanOrEqual(rank[report.hits[1]!.severity]);
    }
  });

  it('each hit includes a concrete interview question', () => {
    const report = buildJdCultureReport('수평적 문화와 워라밸을 보장합니다.');
    for (const hit of report.hits) {
      expect(hit.interviewQuestion.length).toBeGreaterThan(10);
      expect(hit.interviewQuestion).toMatch(/[?？]/);
    }
  });
});
