import { describe, expect, it } from 'vitest';
import { analyzeJdGrowthOpportunity } from './jdGrowthOpportunityAnalyzer';

describe('analyzeJdGrowthOpportunity', () => {
  it('returns none for empty text', () => {
    const r = analyzeJdGrowthOpportunity('');
    expect(r.rating).toBe('none');
    expect(r.score).toBe(0);
    expect(r.signals.length).toBe(0);
  });

  it('returns none for JD with no growth signals', () => {
    const r = analyzeJdGrowthOpportunity('주 5일 출근, 연봉 협의, React 개발 경험자 우대');
    expect(r.rating).toBe('none');
  });

  it('detects learning budget signal', () => {
    const r = analyzeJdGrowthOpportunity('교육비 지원, 도서 구매 지원 연 30만원');
    expect(r.types.has('learning_budget')).toBe(true);
  });

  it('detects mentoring signal', () => {
    const r = analyzeJdGrowthOpportunity('1:1 코칭 및 멘토링 프로그램 운영');
    expect(r.types.has('mentoring')).toBe(true);
  });

  it('detects conference support signal', () => {
    const r = analyzeJdGrowthOpportunity('컨퍼런스 참가 지원 및 외부 행사 지원');
    expect(r.types.has('conference')).toBe(true);
  });

  it('detects ownership signal', () => {
    const r = analyzeJdGrowthOpportunity('자율 근무, 오너십 기반 업무 환경');
    expect(r.types.has('ownership')).toBe(true);
  });

  it('detects tech challenges signal', () => {
    const r = analyzeJdGrowthOpportunity('대규모 트래픽 처리 경험 환경, 최신 기술 스택 사용');
    expect(r.types.has('tech_challenges')).toBe(true);
  });

  it('returns rich rating for comprehensive growth JD', () => {
    const text = `
      교육비 지원, 컨퍼런스 참가 지원.
      멘토링 프로그램 운영.
      자율 근무, 오너십 있는 업무 환경.
      대규모 트래픽 서비스 경험.
      승진 체계 명시, 커리어 패스 지원.
    `;
    const r = analyzeJdGrowthOpportunity(text);
    expect(r.rating).toBe('rich');
    expect(r.score).toBeGreaterThanOrEqual(60);
  });

  it('returns moderate for partial signals', () => {
    const r = analyzeJdGrowthOpportunity('교육비 지원. 자율 근무.');
    expect(['moderate', 'sparse']).toContain(r.rating);
  });

  it('provides missing area tips', () => {
    const r = analyzeJdGrowthOpportunity('React 개발자 모집');
    expect(r.missingAreas.length).toBeGreaterThan(0);
  });
});
