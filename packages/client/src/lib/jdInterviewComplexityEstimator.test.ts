import { describe, expect, it } from 'vitest';
import { estimateJdInterviewComplexity } from './jdInterviewComplexityEstimator';

describe('estimateJdInterviewComplexity', () => {
  it('returns entry for empty text', () => {
    const r = estimateJdInterviewComplexity('');
    expect(r.difficulty).toBe('entry');
    expect(r.signalCount).toBe(0);
  });

  it('detects coding_test_mentioned', () => {
    const r = estimateJdInterviewComplexity('채용 과정에는 코딩 테스트 진행이 포함됩니다.');
    expect(r.signals.some((s) => s.type === 'coding_test_mentioned')).toBe(true);
  });

  it('detects algorithm_required', () => {
    const r = estimateJdInterviewComplexity('알고리즘 역량이 뛰어난 분을 찾습니다.');
    expect(r.signals.some((s) => s.type === 'algorithm_required')).toBe(true);
  });

  it('detects system_design_required', () => {
    const r = estimateJdInterviewComplexity(
      '분산 시스템 설계 경험 필수. 대용량 트래픽 설계 가능한 분을 찾습니다.',
    );
    expect(r.signals.some((s) => s.type === 'system_design_required')).toBe(true);
  });

  it('detects high_seniority_bar', () => {
    const r = estimateJdInterviewComplexity('경력 10년 이상의 시니어 개발자를 모집합니다.');
    expect(r.signals.some((s) => s.type === 'high_seniority_bar')).toBe(true);
  });

  it('detects leadership_required', () => {
    const r = estimateJdInterviewComplexity('테크 리드 역할 경험이 있는 분을 환영합니다.');
    expect(r.signals.some((s) => s.type === 'leadership_required')).toBe(true);
  });

  it('grades expert for algo + system design', () => {
    const text = '알고리즘 역량 필수. 시스템 설계 면접 진행. 분산 시스템 설계 경험 필수.';
    const r = estimateJdInterviewComplexity(text);
    expect(['expert', 'senior']).toContain(r.difficulty);
  });

  it('grades senior for 5+ years required', () => {
    const r = estimateJdInterviewComplexity('경력 5년 이상의 백엔드 개발자를 모집합니다.');
    expect(['senior', 'mid']).toContain(r.difficulty);
  });

  it('extracts required experience years', () => {
    const r = estimateJdInterviewComplexity('경력 7년 이상 필수.');
    expect(r.requiredExperienceYears).toBe(7);
  });

  it('returns null for experience years when not mentioned', () => {
    const r = estimateJdInterviewComplexity('신입 개발자를 모집합니다.');
    expect(r.requiredExperienceYears).toBeNull();
  });

  it('provides prep tips for algo/system', () => {
    const text = '코딩 테스트 진행. 시스템 설계 면접 포함.';
    const r = estimateJdInterviewComplexity(text);
    expect(r.prepTips.length).toBeGreaterThan(0);
  });

  it('summary is non-empty', () => {
    const r = estimateJdInterviewComplexity('일반 공고');
    expect(r.summary.length).toBeGreaterThan(5);
  });
});
