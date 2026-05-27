import { describe, expect, it } from 'vitest';
import { analyzeJdSeniority, extractYearsRequirement } from './jdSeniorityAnalyzer';

describe('extractYearsRequirement', () => {
  it('parses Korean min year requirements', () => {
    expect(extractYearsRequirement('관련 경력 5년 이상 필수')).toEqual({ min: 5, max: null });
  });

  it('parses Korean ranges', () => {
    expect(extractYearsRequirement('3~5년차 백엔드 엔지니어')).toEqual({ min: 3, max: 5 });
  });

  it('parses Korean "최소 N년"', () => {
    expect(extractYearsRequirement('최소 7년 시니어급')).toEqual({ min: 7, max: null });
  });

  it('parses English "N+ years"', () => {
    expect(extractYearsRequirement('5+ years of React experience')).toEqual({
      min: 5,
      max: null,
    });
  });

  it('parses English ranges', () => {
    expect(extractYearsRequirement('3 to 6 years of frontend work')).toEqual({
      min: 3,
      max: 6,
    });
  });

  it('parses "최소 N years"', () => {
    expect(extractYearsRequirement('minimum 4 years on a product team')).toEqual({
      min: 4,
      max: null,
    });
  });

  it('returns nulls when text has no year markers', () => {
    expect(extractYearsRequirement('We want curious problem solvers.')).toEqual({
      min: null,
      max: null,
    });
  });
});

describe('analyzeJdSeniority', () => {
  it('returns "unspecified" when the JD is empty', () => {
    const result = analyzeJdSeniority('');
    expect(result.level).toBe('unspecified');
    expect(result.tone).toBe('neutral');
  });

  it('detects entry-level Korean phrases', () => {
    const result = analyzeJdSeniority('신입 개발자 채용 · 경력 무관');
    expect(result.level).toBe('entry');
    expect(result.label).toContain('신입');
  });

  it('detects senior signals with year requirement', () => {
    const result = analyzeJdSeniority(
      '시니어 프론트엔드 엔지니어 · 관련 경력 5년 이상 · React, TypeScript 능숙',
    );
    expect(result.level).toBe('senior');
    expect(result.years.min).toBe(5);
    expect(result.label).toContain('시니어');
    expect(result.label).toContain('5년차');
  });

  it('flags leadership responsibilities for senior+ roles', () => {
    const result = analyzeJdSeniority('리드 엔지니어 · 7년 이상 · 팀 리딩 및 멘토링 경험 우대');
    expect(result.level).toBe('lead');
    expect(result.hasLeadership).toBe(true);
    expect(result.detail).toContain('리더십');
  });

  it('promotes to staff when "수석" 등 책임급 단어가 보일 때', () => {
    const result = analyzeJdSeniority('수석 엔지니어 · 백엔드 아키텍처 책임');
    expect(result.level).toBe('staff');
    expect(result.label).toContain('스태프');
  });

  it('falls back to years-only inference when no explicit level keyword', () => {
    const result = analyzeJdSeniority('관련 분야 3~5년 경력 우대');
    expect(result.level).toBe('mid');
    expect(result.years.min).toBe(3);
    expect(result.years.max).toBe(5);
  });

  it('returns at least one signal entry when level was detected', () => {
    const result = analyzeJdSeniority('Senior Software Engineer, 5+ years.');
    expect(result.signals.length).toBeGreaterThan(0);
    expect(result.signals[0].weight).toBeGreaterThan(0);
  });
});
