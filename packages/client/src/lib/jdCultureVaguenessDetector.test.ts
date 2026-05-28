import { describe, expect, it } from 'vitest';
import { detectJdCultureVagueness } from './jdCultureVaguenessDetector';

describe('detectJdCultureVagueness', () => {
  it('returns none clarity for empty text', () => {
    const r = detectJdCultureVagueness('');
    expect(r.clarity).toBe('none');
    expect(r.vagueSignals.length).toBe(0);
  });

  it('detects family_metaphor vague signal', () => {
    const r = detectJdCultureVagueness('패밀리 같은 분위기에서 함께 일합니다.');
    const signal = r.vagueSignals.find((s) => s.type === 'family_metaphor');
    expect(signal).toBeDefined();
  });

  it('detects passion_demand vague signal', () => {
    const r = detectJdCultureVagueness('열정 있는 분을 환영합니다.');
    const signal = r.vagueSignals.find((s) => s.type === 'passion_demand');
    expect(signal).toBeDefined();
  });

  it('detects ambiguous_growth vague signal', () => {
    const r = detectJdCultureVagueness('함께 성장할 수 있는 환경을 제공합니다.');
    const signal = r.vagueSignals.find((s) => s.type === 'ambiguous_growth');
    expect(signal).toBeDefined();
  });

  it('detects process_evidence concrete signal', () => {
    const r = detectJdCultureVagueness('코드 리뷰 문화가 있으며 주간 회고를 진행합니다.');
    const signal = r.concreteSignals.find((s) => s.type === 'process_evidence');
    expect(signal).toBeDefined();
  });

  it('detects measurable_benefit concrete signal', () => {
    const r = detectJdCultureVagueness('스톡옵션 제공 및 기본 연차 15일 이상 보장합니다.');
    const signal = r.concreteSignals.find((s) => s.type === 'measurable_benefit');
    expect(signal).toBeDefined();
  });

  it('rates vague clarity for multiple vague signals', () => {
    const r = detectJdCultureVagueness(
      '패밀리 같은 분위기. 열정 있는 분 환영. 함께 성장. 좋은 기업 문화를 유지합니다.',
    );
    expect(r.clarity).toBe('vague');
    expect(r.riskLevel).not.toBe('none');
  });

  it('rates concrete clarity for concrete signals', () => {
    const r = detectJdCultureVagueness(
      '코드 리뷰 문화, 스프린트 2주, 전사 OKR 공유, 연차 15일 이상, 1:1 미팅 정기 진행.',
    );
    expect(r.clarity).toBe('concrete');
  });

  it('provides interview questions when vague signals present', () => {
    const r = detectJdCultureVagueness('열정 있는 분. 패밀리 문화.');
    expect(r.interviewQuestions.length).toBeGreaterThan(0);
  });

  it('summary is non-empty string', () => {
    const r = detectJdCultureVagueness('일반적인 채용공고 내용입니다.');
    expect(r.summary.length).toBeGreaterThan(10);
  });
});
