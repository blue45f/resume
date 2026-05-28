import { describe, expect, it } from 'vitest';
import { analyzeJdSalaryTransparency } from './jdSalaryTransparencyAnalyzer';

describe('analyzeJdSalaryTransparency', () => {
  it('returns silent for empty text', () => {
    const r = analyzeJdSalaryTransparency('');
    expect(r.transparency).toBe('silent');
    expect(r.disclosureSignals).toHaveLength(0);
    expect(r.opacitySignals).toHaveLength(0);
  });

  it('detects explicit salary range (Korean 만원)', () => {
    const r = analyzeJdSalaryTransparency('연봉 5,000만 원 ~ 8,000만 원 협의 가능합니다.');
    expect(r.transparency).toBe('transparent');
    expect(r.disclosureSignals.some((s) => s.type === 'explicit_range')).toBe(true);
  });

  it('detects explicit salary range (short form)', () => {
    const r = analyzeJdSalaryTransparency('급여: 5000만~7000만');
    expect(r.transparency).toBe('transparent');
  });

  it('detects explicit base salary', () => {
    const r = analyzeJdSalaryTransparency('기본급 350만 원 + 성과급 별도.');
    expect(r.transparency).toBe('transparent');
    expect(r.disclosureSignals.some((s) => s.type === 'explicit_base')).toBe(true);
  });

  it('detects negotiable_stated', () => {
    const r = analyzeJdSalaryTransparency('연봉 협의 가능합니다. 역량에 따라 결정.');
    expect(r.transparency).toBe('partial');
    expect(r.disclosureSignals.some((s) => s.type === 'negotiable_stated')).toBe(true);
  });

  it('detects equity mentioned', () => {
    const r = analyzeJdSalaryTransparency('스톡 옵션 제공 (클리프 1년, 베스팅 4년)');
    expect(r.hasEquity).toBe(true);
    expect(r.transparency).toBe('partial');
    expect(r.negotiationTips.some((t) => t.includes('스톡옵션'))).toBe(true);
  });

  it('detects bonus mentioned', () => {
    const r = analyzeJdSalaryTransparency('성과급 지급 (연 2회), 명절 보너스 포함.');
    expect(r.disclosureSignals.some((s) => s.type === 'bonus_mentioned')).toBe(true);
  });

  it('detects benefits_detailed', () => {
    const r = analyzeJdSalaryTransparency('복지 포인트 연 120만 원 지급.');
    expect(r.disclosureSignals.some((s) => s.type === 'benefits_detailed')).toBe(true);
  });

  it('detects vague competitive language', () => {
    const r = analyzeJdSalaryTransparency('업계 최고 수준 연봉을 드립니다.');
    expect(r.transparency).toBe('opaque');
    expect(r.opacitySignals.some((s) => s.type === 'vague_competitive')).toBe(true);
  });

  it('detects interview_only opacity', () => {
    const r = analyzeJdSalaryTransparency('처우는 면접 후 결정됩니다.');
    expect(r.transparency).toBe('opaque');
    expect(r.opacitySignals.some((s) => s.type === 'interview_only')).toBe(true);
  });

  it('explicit range overrides opacity signals', () => {
    const r = analyzeJdSalaryTransparency('연봉 6000만 원 ~ 9000만 원. 업계 최고 수준 처우.');
    expect(r.transparency).toBe('transparent');
  });

  it('negotiation tips include market research for silent JD', () => {
    const r = analyzeJdSalaryTransparency('프론트엔드 개발자를 모집합니다.');
    expect(r.transparency).toBe('silent');
    expect(r.negotiationTips.some((t) => t.includes('잡코리아'))).toBe(true);
  });

  it('summary is non-empty for all transparency levels', () => {
    const levels = ['silent', 'opaque', 'partial', 'transparent'] as const;
    for (const level of levels) {
      const r = analyzeJdSalaryTransparency(
        level === 'transparent'
          ? '연봉 5000~8000만 원'
          : level === 'partial'
            ? '연봉 협의'
            : level === 'opaque'
              ? '경쟁력 있는 연봉'
              : '일반 공고',
      );
      expect(r.summary.length).toBeGreaterThan(10);
    }
  });
});
