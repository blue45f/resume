import { describe, expect, it } from 'vitest';
import { analyzeKpiOkrAchievements } from './resumeKpiOkrAnalyzer';

describe('analyzeKpiOkrAchievements', () => {
  it('returns none for empty text', () => {
    const r = analyzeKpiOkrAchievements('');
    expect(r.grade).toBe('none');
    expect(r.score).toBe(0);
  });

  it('detects KPI explicit signal', () => {
    const r = analyzeKpiOkrAchievements('KPI 달성률 120%, 분기 목표 달성');
    expect(r.kpiExplicitCount).toBeGreaterThan(0);
    expect(r.grade).not.toBe('none');
  });

  it('detects OKR explicit signal', () => {
    const r = analyzeKpiOkrAchievements('OKR 달성률 110%로 팀 목표 초과 달성');
    expect(r.kpiExplicitCount).toBeGreaterThan(0);
  });

  it('detects numeric outcome (% improvement)', () => {
    const r = analyzeKpiOkrAchievements('응답속도 30% 단축, 비용 20% 절감');
    expect(r.numericOutcomeCount).toBeGreaterThan(0);
  });

  it('detects numeric outcome (배 improvement)', () => {
    const r = analyzeKpiOkrAchievements('처리 속도 3배 향상 달성');
    expect(r.numericOutcomeCount).toBeGreaterThan(0);
  });

  it('returns strong grade for KPI + numeric combo', () => {
    const text = `
      분기 OKR 달성률 130%.
      API 응답속도 40% 단축.
      MAU 50만→80만 성장 기여.
    `;
    const r = analyzeKpiOkrAchievements(text);
    expect(r.grade).toBe('strong');
  });

  it('detects vague positive signals', () => {
    const r = analyzeKpiOkrAchievements('큰 성과를 냈습니다. 많은 기여를 하였습니다.');
    expect(r.vagueCount).toBeGreaterThan(0);
  });

  it('detects effort-only signals', () => {
    const r = analyzeKpiOkrAchievements('열심히 했습니다. 노력했습니다.');
    expect(r.effortOnlyCount).toBeGreaterThan(0);
  });

  it('returns weak grade for effort-only text', () => {
    const r = analyzeKpiOkrAchievements(
      '열심히 하였습니다. 최선을 다했습니다. 많은 기여를 하였습니다.',
    );
    expect(r.grade).toBe('weak');
  });

  it('suggestion mentions OKR example for weak grade', () => {
    const r = analyzeKpiOkrAchievements('열심히 했습니다. 많은 기여를 하였습니다.');
    expect(r.suggestion).toContain('OKR');
  });
});
