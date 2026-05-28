import { describe, expect, it } from 'vitest';
import { detectCoverLetterEndingMonotony } from './coverLetterEndingMonotonyDetector';

describe('detectCoverLetterEndingMonotony', () => {
  it('returns varied for empty text', () => {
    const r = detectCoverLetterEndingMonotony('');
    expect(r.grade).toBe('varied');
    expect(r.sentenceCount).toBe(0);
  });

  it('returns varied for short text', () => {
    const r = detectCoverLetterEndingMonotony('안녕하세요.');
    expect(r.grade).toBe('varied');
  });

  it('returns varied for diverse endings', () => {
    const text = [
      '저는 5년간 백엔드 개발을 해왔습니다.',
      '특히 분산 시스템 설계에 관심이 깊은 엔지니어입니다.',
      '귀사의 기술 블로그를 통해 많은 영감을 받았습니다.',
      '마이크로서비스 아키텍처에서 성능을 30% 개선한 경험이 있어요.',
      '이 경험을 귀사에서 발전시키고 싶습니다.',
    ].join('\n');
    const r = detectCoverLetterEndingMonotony(text);
    expect(r.grade).not.toBe('monotonous');
  });

  it('detects monotonous ending pattern (했습니다 × 5)', () => {
    const text = [
      '저는 3년간 React를 개발했습니다.',
      '대규모 서비스에서 성능을 최적화했습니다.',
      '팀 리더로서 주도했습니다.',
      '사이드 프로젝트를 통해 성장했습니다.',
      '오픈소스에도 기여했습니다.',
    ].join('\n');
    const r = detectCoverLetterEndingMonotony(text);
    expect(r.grade).toBe('monotonous');
    expect(r.dominantEndingCount).toBeGreaterThanOrEqual(4);
  });

  it('detects runs of 3+ consecutive same endings', () => {
    const text = [
      '열심히 노력하겠습니다.',
      '최선을 다하겠습니다.',
      '꼭 기여하겠습니다.',
      '항상 배우겠습니다.',
    ].join('\n');
    const r = detectCoverLetterEndingMonotony(text);
    expect(r.runs.length).toBeGreaterThan(0);
    expect(r.runs[0].count).toBeGreaterThanOrEqual(3);
  });

  it('suggestion mentions the dominant ending', () => {
    const text = [
      '저는 기여했습니다.',
      '팀에서 활동했습니다.',
      '성과를 달성했습니다.',
      '역할을 수행했습니다.',
      '능력을 키웠습니다.',
    ].join('\n');
    const r = detectCoverLetterEndingMonotony(text);
    expect(r.suggestion).toContain('습니다');
  });

  it('counts unique endings correctly', () => {
    const text = [
      '저는 개발자입니다.',
      '3년간 일했습니다.',
      '성과를 냈습니다.',
      '팀에 기여했습니다.',
      '배움을 멈추지 않겠습니다.',
    ].join('\n');
    const r = detectCoverLetterEndingMonotony(text);
    expect(r.uniqueEndings).toBeGreaterThanOrEqual(2);
  });

  it('diversityRatio is between 0 and 1', () => {
    const text = [
      '저는 개발자입니다.',
      '3년간 React를 개발했습니다.',
      '성과를 달성했습니다.',
      '팀에 기여하겠습니다.',
    ].join('\n');
    const r = detectCoverLetterEndingMonotony(text);
    expect(r.diversityRatio).toBeGreaterThanOrEqual(0);
    expect(r.diversityRatio).toBeLessThanOrEqual(1);
  });
});
