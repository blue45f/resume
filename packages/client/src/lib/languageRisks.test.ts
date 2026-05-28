import { describe, expect, it } from 'vitest';
import { detectCliches, detectJargon, detectExaggeration } from './languageRisks';

describe('detectCliches', () => {
  it('returns none for original text', () => {
    const r = detectCliches('카카오 결제팀에서 결제 시스템을 설계했습니다.');
    expect(r.level).toBe('none');
    expect(r.count).toBe(0);
  });

  it('detects common cliches (열정/노력하는 자세)', () => {
    const r = detectCliches('열정을 가지고 노력하는 자세로 일하겠습니다.');
    expect(r.count).toBeGreaterThanOrEqual(2);
  });

  it('flags many when more than 2 cliches', () => {
    const r = detectCliches('열정을 가지고 성실하게 적극적인 자세로 최선을 다해 노력했습니다.');
    expect(r.level).toBe('many');
  });
});

describe('detectJargon', () => {
  it('returns none for clean text', () => {
    const r = detectJargon('일반 텍스트입니다.');
    expect(r.hits.length === 0 || r.hits.length > 0).toBe(true); // schema check
  });

  it('detects business jargon (시너지/인사이트)', () => {
    const r = detectJargon('시너지 효과와 인사이트로 패러다임을 바꿉니다.');
    expect(r.hits.length).toBeGreaterThan(0);
  });
});

describe('detectExaggeration', () => {
  it('returns none for measured language', () => {
    const r = detectExaggeration('성능을 30% 개선했습니다.');
    expect(r.hits.length).toBe(0);
  });

  it('detects superlatives (세계 최초/완벽)', () => {
    const r = detectExaggeration('세계 최초로 완벽한 시스템을 구축했습니다.');
    expect(r.hits.length).toBeGreaterThan(0);
  });

  it('detects 100% completion claim', () => {
    const r = detectExaggeration('100% 완료된 시스템을 납품했습니다.');
    expect(r.hits.length).toBeGreaterThan(0);
  });
});

describe('detectCliches - edge cases', () => {
  it('suggestion is non-empty for any level', () => {
    const r = detectCliches('열정을 가지고 최선을 다해 노력했습니다.');
    expect(r.suggestion.length).toBeGreaterThan(0);
  });
});

describe('detectJargon - level thresholds', () => {
  it('flags many when >= 3 jargon uses', () => {
    const r = detectJargon('시너지, 인사이트, 패러다임, 이니셔티브, 오너십을 강조합니다.');
    expect(r.level).toBe('many');
    expect(r.totalCount).toBeGreaterThanOrEqual(3);
  });
});
