import { describe, expect, it } from 'vitest';
import { analyzeJdWorkLifeBalance } from './jdWorkLifeBalanceAnalyzer';

describe('analyzeJdWorkLifeBalance', () => {
  it('returns neutral for empty text', () => {
    const r = analyzeJdWorkLifeBalance('');
    expect(r.rating).toBe('neutral');
    expect(r.signals.length).toBe(0);
  });

  it('detects remote work signal', () => {
    const r = analyzeJdWorkLifeBalance('재택 근무 가능하며 하이브리드 제도를 운영합니다.');
    const signal = r.signals.find((s) => s.type === 'remote_work');
    expect(signal).toBeDefined();
  });

  it('detects flex_time signal', () => {
    const r = analyzeJdWorkLifeBalance('유연근무제를 도입하여 자율 출퇴근이 가능합니다.');
    const signal = r.signals.find((s) => s.type === 'flex_time');
    expect(signal).toBeDefined();
  });

  it('detects work_hour_compliance signal', () => {
    const r = analyzeJdWorkLifeBalance('52시간 준수를 엄격히 시행합니다. 야근 없는 문화입니다.');
    expect(r.detectedTypes.has('work_hour_compliance')).toBe(true);
  });

  it('rates excellent for rich WLB signals', () => {
    const r = analyzeJdWorkLifeBalance(
      '52시간 준수. 재택 근무 가능. 유연근무제 시행. 연차 눈치 없이 사용. 야근 강요 없음.',
    );
    expect(r.rating).toBe('excellent');
  });

  it('detects red flag for on-call culture', () => {
    const r = analyzeJdWorkLifeBalance('24시간 서비스를 위해 온콜 필수 대기가 필요합니다.');
    expect(r.redFlags.length).toBeGreaterThan(0);
  });

  it('rates concern when red flags dominate', () => {
    const r = analyzeJdWorkLifeBalance('빠른 성장 원하는 분. 긴급 대응 필수. 24시간 서비스.');
    expect(r.rating).toBe('concern');
  });

  it('provides interview questions for missing types', () => {
    const r = analyzeJdWorkLifeBalance('좋은 회사입니다. 성장 기회가 많습니다.');
    expect(r.interviewQuestions.length).toBeGreaterThan(0);
  });

  it('detects parental support signal', () => {
    const r = analyzeJdWorkLifeBalance('육아휴직 100% 보장 및 어린이집 연계를 지원합니다.');
    expect(r.detectedTypes.has('parental_support')).toBe(true);
  });

  it('summary is non-empty string', () => {
    const r = analyzeJdWorkLifeBalance('일반적인 채용공고 내용입니다.');
    expect(r.summary.length).toBeGreaterThan(10);
  });
});
