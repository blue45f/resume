import { describe, expect, it } from 'vitest';
import {
  analyzeSentenceEndings,
  analyzeSentenceStarts,
  analyzePassiveVoice,
} from './sentenceStructure';

describe('analyzeSentenceEndings', () => {
  it('returns zero counts for empty input', () => {
    const r = analyzeSentenceEndings('');
    expect(r.total).toBe(0);
    expect(r.dominantEndings).toHaveLength(0);
  });

  it('flags monotonous endings when all sentences end with 했습니다', () => {
    const text = Array(8).fill('프로젝트를 완료했습니다.').join(' ');
    const r = analyzeSentenceEndings(text);
    expect(r.monotonyScore).toBeGreaterThanOrEqual(60);
    expect(r.suggestion).toMatch(/단조|변주/);
  });

  it('returns balanced suggestion when endings vary', () => {
    const text =
      '기획을 주도했습니다. 새로운 도구를 도입했어요. 성과를 측정합니다. 결과를 공유했다. 다음 단계로 넘어갑니다.';
    const r = analyzeSentenceEndings(text);
    expect(r.total).toBeGreaterThan(0);
  });
});

describe('analyzeSentenceStarts', () => {
  it('flags repeated start word', () => {
    const text =
      '저는 백엔드 개발자입니다. 저는 5년차입니다. 저는 카카오에서 일했습니다. 저는 데이터를 분석합니다. 저는 팀을 리딩합니다.';
    const r = analyzeSentenceStarts(text);
    expect(r.repeatedStartRatio).toBeGreaterThan(0.4);
    expect(r.suggestion).toMatch(/변주|재구성/);
  });

  it('returns insufficient when <5 sentences', () => {
    const r = analyzeSentenceStarts('한 문장만 있습니다.');
    expect(r.suggestion).toMatch(/부족/);
  });
});

describe('analyzePassiveVoice', () => {
  it('detects passive markers (되어졌)', () => {
    // "되어졌" 패턴은 lookbehind 없이 직접 매칭
    const text = '시스템이 되어졌고 자동화가 되어졌습니다.';
    const r = analyzePassiveVoice(text);
    expect(r.passiveCount).toBeGreaterThan(0);
  });

  it('reports active when text uses 능동태', () => {
    const text =
      '시스템을 설계했습니다. 결과를 도출했습니다. 자동화를 구현했습니다. 성능을 개선했습니다.';
    const r = analyzePassiveVoice(text);
    expect(r.activeCount).toBeGreaterThan(0);
  });
});
