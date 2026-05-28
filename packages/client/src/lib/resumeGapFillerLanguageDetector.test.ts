import { describe, expect, it } from 'vitest';
import { detectResumeGapFillerLanguage } from './resumeGapFillerLanguageDetector';

describe('detectResumeGapFillerLanguage', () => {
  it('returns clean for empty text', () => {
    const r = detectResumeGapFillerLanguage('');
    expect(r.severity).toBe('clean');
    expect(r.matches).toHaveLength(0);
  });

  it('returns clean for concrete text', () => {
    const r = detectResumeGapFillerLanguage(
      'API 응답 시간 40% 단축, DAU 3만 → 8만 달성, 팀 주도 마이그레이션 완료.',
    );
    expect(r.severity).toBe('clean');
  });

  it('detects vague_effort — 열심히 노력', () => {
    const r = detectResumeGapFillerLanguage('항상 열심히 노력했습니다.');
    expect(r.matches.some((m) => m.category === 'vague_effort')).toBe(true);
  });

  it('detects vague_effort — 성실하게 임했', () => {
    const r = detectResumeGapFillerLanguage('성실하게 임했습니다.');
    expect(r.matches.some((m) => m.category === 'vague_effort')).toBe(true);
  });

  it('detects hollow_diversity — 다양한 경험', () => {
    const r = detectResumeGapFillerLanguage('다양한 프로젝트 경험을 통해 성장했습니다.');
    expect(r.matches.some((m) => m.category === 'hollow_diversity')).toBe(true);
  });

  it('detects vague_contribution — 기여했습니다', () => {
    const r = detectResumeGapFillerLanguage('팀 프로젝트에 기여했습니다.');
    expect(r.matches.some((m) => m.category === 'vague_contribution')).toBe(true);
  });

  it('detects generic_teamwork — 원활한 소통을 통해', () => {
    const r = detectResumeGapFillerLanguage('원활한 소통을 통해 팀 성과를 높였습니다.');
    expect(r.matches.some((m) => m.category === 'generic_teamwork')).toBe(true);
  });

  it('detects growth_cliche — 끊임없이 성장하고자', () => {
    const r = detectResumeGapFillerLanguage('끊임없이 성장하고자 노력하고 있습니다.');
    expect(r.matches.some((m) => m.category === 'growth_cliche')).toBe(true);
  });

  it('detects vague_experience — 경험을 쌓았습니다', () => {
    const r = detectResumeGapFillerLanguage('다양한 경험을 쌓았습니다.');
    expect(r.matches.some((m) => m.category === 'vague_experience')).toBe(true);
  });

  it('grades heavy for 5+ matches', () => {
    const text = [
      '열심히 노력했습니다.',
      '성실하게 임했습니다.',
      '다양한 경험을 통해',
      '원활한 소통을 통해',
      '끊임없이 성장하고자',
      '경험을 쌓았습니다.',
    ].join(' ');
    const r = detectResumeGapFillerLanguage(text);
    expect(r.severity).toBe('heavy');
    expect(r.matches.length).toBeGreaterThanOrEqual(5);
  });

  it('grades moderate for 3-4 matches', () => {
    const text = ['열심히 노력했습니다.', '다양한 경험', '기여했습니다.'].join(' ');
    const r = detectResumeGapFillerLanguage(text);
    expect(['moderate', 'heavy']).toContain(r.severity);
  });

  it('grades light for 1-2 matches', () => {
    const r = detectResumeGapFillerLanguage('열심히 노력했으며 AWS 비용 30% 절감을 달성했습니다.');
    expect(r.severity).toBe('light');
  });

  it('summary is non-empty', () => {
    const r = detectResumeGapFillerLanguage('일반 텍스트입니다.');
    expect(r.summary.length).toBeGreaterThan(5);
  });

  it('provides rewriteGuide for filler matches', () => {
    const r = detectResumeGapFillerLanguage('열심히 노력했습니다. 다양한 경험 보유. 기여했습니다.');
    expect(r.rewriteGuide.length).toBeGreaterThan(0);
  });
});
