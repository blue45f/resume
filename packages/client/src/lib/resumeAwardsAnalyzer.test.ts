import { describe, expect, it } from 'vitest';
import { analyzeResumeAwards } from './resumeAwardsAnalyzer';

describe('analyzeResumeAwards', () => {
  it('returns none for text without awards', () => {
    const r = analyzeResumeAwards('백엔드 개발자로 다양한 API를 개발했습니다.');
    expect(r.quality).toBe('none');
    expect(r.count).toBe(0);
  });

  it('detects competition award', () => {
    const r = analyzeResumeAwards('2023 전국 해커톤 대상 수상');
    expect(r.count).toBeGreaterThan(0);
    expect(r.awards.some((a) => a.category === 'competition' || a.category === 'recognition')).toBe(
      true,
    );
  });

  it('grades strong when multiple awards with context', () => {
    const text = [
      '수상',
      '2023 전국 대학생 공모전 대상 (주최: 과기부)',
      '2022 교내 해커톤 우승',
    ].join('\n');
    const r = analyzeResumeAwards(text);
    expect(r.quality).toBe('strong');
  });

  it('grades bare when award lacks context', () => {
    const r = analyzeResumeAwards('해커톤 입상 경험 있음');
    expect(['bare', 'present']).toContain(r.quality);
  });

  it('detects scholarship', () => {
    const r = analyzeResumeAwards('2021 성적 우수 장학금 수혜');
    expect(r.awards.some((a) => a.category === 'scholarship')).toBe(true);
  });

  it('detects patent/publication', () => {
    const r = analyzeResumeAwards('2020 특허 출원 1건, SCI 논문 게재');
    expect(r.awards.some((a) => a.category === 'patent_publication')).toBe(true);
  });

  it('computes context ratio', () => {
    const text = ['2023 공모전 대상', '해커톤 우승'].join('\n');
    const r = analyzeResumeAwards(text);
    expect(r.contextRatio).toBeGreaterThanOrEqual(0);
    expect(r.contextRatio).toBeLessThanOrEqual(100);
  });

  it('summary and suggestions are non-empty', () => {
    const r = analyzeResumeAwards('일반 이력서 내용');
    expect(r.summary.length).toBeGreaterThan(5);
    expect(r.suggestions.length).toBeGreaterThan(0);
  });
});
