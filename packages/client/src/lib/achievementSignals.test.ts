import { describe, expect, it } from 'vitest';
import { analyzeQuantification, analyzeActionVerbs, countAchievements } from './achievementSignals';

describe('analyzeQuantification', () => {
  it('returns none when no numbers', () => {
    const r = analyzeQuantification('성과를 향상시켰습니다.');
    expect(r.level).toBe('none');
    expect(r.total).toBe(0);
  });

  it('detects percentage signals', () => {
    const r = analyzeQuantification('응답시간 30% 단축, 장애율 50% 감소.');
    expect(r.percents).toBeGreaterThanOrEqual(2);
    expect(r.level).not.toBe('none');
  });

  it('detects period signals (N년/N개월)', () => {
    const r = analyzeQuantification('5년 경력 + 6개월 인턴 보유.');
    expect(r.periods).toBeGreaterThanOrEqual(2);
  });

  it('detects currency signals (원/만원/억)', () => {
    const r = analyzeQuantification('매출 1억원과 200만원 비용 절감.');
    expect(r.currencies).toBeGreaterThanOrEqual(1);
  });

  it('reports high level when many signals present', () => {
    const r = analyzeQuantification('3년간 100% 달성, 매출 5억원, 1위 등극, 80% 향상.');
    expect(r.level).toBe('high');
  });
});

describe('analyzeActionVerbs', () => {
  it('returns ratio 0 for no verbs', () => {
    const r = analyzeActionVerbs('Plain text without verbs.');
    expect(r.strong + r.weak).toBe(0);
  });

  it('detects strong action verbs', () => {
    const r = analyzeActionVerbs('프로젝트를 주도하고 시스템을 구현했습니다.');
    expect(r.strong).toBeGreaterThan(0);
  });

  it('detects weak verbs (담당/참여)', () => {
    const r = analyzeActionVerbs('업무를 담당하고 회의에 참여했습니다.');
    expect(r.weak).toBeGreaterThan(0);
  });
});

describe('countAchievements', () => {
  it('returns zero for unrelated text', () => {
    const r = countAchievements('일상 텍스트');
    expect(r.total).toBe(0);
  });

  it('detects award + certification keywords', () => {
    const r = countAchievements('대상 수상 및 정보처리기사 자격증 취득.');
    expect(r.total).toBeGreaterThan(0);
  });
});
