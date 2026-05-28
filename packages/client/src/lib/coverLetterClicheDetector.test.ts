import { describe, expect, it } from 'vitest';
import { buildCoverLetterClicheReport } from './coverLetterClicheDetector';

describe('buildCoverLetterClicheReport', () => {
  it('returns clean state for empty input', () => {
    const report = buildCoverLetterClicheReport('');
    expect(report.hits).toEqual([]);
    expect(report.score).toBe(100);
    expect(report.tone).toBe('good');
  });

  it('rewards a cliche-free body', () => {
    const text = `사내 결제 시스템을 처음부터 설계해 6주 만에 출시했습니다.
    출시 후 첫 분기에 거래 실패율을 4.2%에서 0.7%로 낮췄고, 결제 흐름 A/B 테스트를 통해
    객단가를 12% 끌어올렸습니다.`;
    const report = buildCoverLetterClicheReport(text);
    expect(report.hits.length).toBe(0);
    expect(report.score).toBe(100);
    expect(report.tone).toBe('good');
  });

  it('flags effort cliches (성실/최선/노력)', () => {
    const text = `저는 성실한 자세로 업무에 임하며 매일 최선을 다하겠습니다.
    꾸준히 노력하는 모습을 보이겠습니다.`;
    const report = buildCoverLetterClicheReport(text);
    expect(report.hits.length).toBeGreaterThanOrEqual(2);
    const cats = report.hits.map((h) => h.category);
    expect(cats).toContain('effort');
  });

  it('flags passion cliches (열정/도전)', () => {
    const text = `뜨거운 열정과 도전 정신으로 새로운 일에 임하겠습니다.`;
    const report = buildCoverLetterClicheReport(text);
    expect(report.hits.some((h) => h.category === 'passion')).toBe(true);
    expect(report.tone).toBe('warning');
  });

  it('flags closing cliches (기회를 주신다면)', () => {
    const text = `기회를 주신다면 회사에 보탬이 되겠습니다. 뽑아주신다면 후회없게 일하겠습니다.`;
    const report = buildCoverLetterClicheReport(text);
    expect(report.hits.some((h) => h.category === 'closing')).toBe(true);
  });

  it('flags "가족 같은" company framing', () => {
    const text = `귀사의 가족 같은 분위기가 마음에 들었습니다.`;
    const report = buildCoverLetterClicheReport(text);
    expect(report.hits.some((h) => h.category === 'family')).toBe(true);
  });

  it('flags English filler', () => {
    const text = `I am a passionate about technology, hard-working team player and detail-oriented engineer.`;
    const report = buildCoverLetterClicheReport(text);
    expect(report.hits.some((h) => h.category === 'generic-en')).toBe(true);
    const matches = report.hits.map((h) => h.match.toLowerCase());
    expect(matches.some((m) => m.includes('passionate'))).toBe(true);
    expect(matches.some((m) => m.includes('team player'))).toBe(true);
  });

  it('penalty per category is capped (one category cannot tank score alone)', () => {
    const text = `최선을 다하겠습니다. 최선을 다하겠습니다. 최선을 다하겠습니다.
    최선을 다하겠습니다. 최선을 다하겠습니다. 최선을 다하겠습니다.`;
    const report = buildCoverLetterClicheReport(text);
    expect(report.hits.length).toBeGreaterThanOrEqual(6);
    // 6 high hits * 15 = 90 raw, but cap is 30 per category.
    expect(report.score).toBeGreaterThanOrEqual(70);
  });

  it('hits are sorted with high severity first', () => {
    const text = `안녕하세요. 저는 열정과 도전을 가진 지원자입니다.`;
    const report = buildCoverLetterClicheReport(text);
    if (report.hits.length >= 2) {
      const first = report.hits[0]!.severity;
      const last = report.hits[report.hits.length - 1]!.severity;
      // First hit severity should be <= last hit severity rank.
      const rank = { high: 0, medium: 1, low: 2 } as const;
      expect(rank[first]).toBeLessThanOrEqual(rank[last]);
    }
  });
});
