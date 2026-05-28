import { describe, expect, it } from 'vitest';
import { checkResumeProjectDescriptionQuality } from './resumeProjectDescriptionQualityChecker';

describe('checkResumeProjectDescriptionQuality', () => {
  it('returns weak for empty text', () => {
    const r = checkResumeProjectDescriptionQuality('');
    expect(r.grade).toBe('weak');
    expect(r.qualitySignals.length).toBe(0);
  });

  it('detects outcome_quantified signal', () => {
    const r = checkResumeProjectDescriptionQuality('응답 속도를 40% 개선하였습니다.');
    const signal = r.qualitySignals.find((s) => s.dimension === 'outcome_quantified');
    expect(signal).toBeDefined();
  });

  it('detects role_clarity signal', () => {
    const r = checkResumeProjectDescriptionQuality(
      '5인 팀 리드 담당으로 백엔드 설계를 주도했습니다.',
    );
    const signal = r.qualitySignals.find(
      (s) => s.dimension === 'role_clarity' || s.dimension === 'team_scale',
    );
    expect(signal).toBeDefined();
  });

  it('detects tech_specificity signal', () => {
    const r = checkResumeProjectDescriptionQuality(
      'Spring Boot 3 기반 REST API 서버를 개발했습니다.',
    );
    const signal = r.qualitySignals.find((s) => s.dimension === 'tech_specificity');
    expect(signal).toBeDefined();
  });

  it('detects problem_statement signal', () => {
    const r = checkResumeProjectDescriptionQuality(
      '기존 방식의 병목 현상을 발견하고 개선했습니다.',
    );
    const signal = r.qualitySignals.find((s) => s.dimension === 'problem_statement');
    expect(signal).toBeDefined();
  });

  it('detects vague_verb weakness', () => {
    const r = checkResumeProjectDescriptionQuality(
      '회원가입 기능을 개발했습니다. 게시판을 구현했습니다.',
    );
    const weakness = r.weaknessSignals.find((s) => s.type === 'vague_verb');
    expect(weakness).toBeDefined();
  });

  it('grades excellent for rich quality signals', () => {
    const r = checkResumeProjectDescriptionQuality(
      '5인 팀 리드 담당으로 기존 방식의 병목 발견. Spring Boot 3 기반. ' +
        '응답 속도 40% 개선, MAU 10만 달성. 2024.01~2024.06 (6개월 프로젝트).',
    );
    expect(r.grade).toBe('excellent');
  });

  it('provides suggestions for missing dimensions', () => {
    const r = checkResumeProjectDescriptionQuality('게시판 서비스를 React로 개발했습니다.');
    expect(r.suggestions.length).toBeGreaterThan(0);
  });

  it('summary is non-empty string', () => {
    const r = checkResumeProjectDescriptionQuality('일반적인 프로젝트 설명입니다.');
    expect(r.summary.length).toBeGreaterThan(10);
  });
});
