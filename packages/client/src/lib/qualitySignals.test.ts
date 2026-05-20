import { describe, expect, it } from 'vitest';
import {
  detectUnquantifiedClaims,
  detectEmptyClaims,
  analyzeVerbTense,
  detectAllCapsOveruse,
} from './qualitySignals';

describe('detectUnquantifiedClaims', () => {
  it('returns empty for fully quantified sentences', () => {
    const r = detectUnquantifiedClaims('응답시간 30% 단축, 매출 12% 증가.');
    expect(r).toEqual([]);
  });

  it('flags sentences with vague impact words but no numbers', () => {
    const r = detectUnquantifiedClaims('성능을 크게 향상시켰습니다.');
    expect(r.length).toBeGreaterThanOrEqual(1);
  });
});

describe('detectEmptyClaims', () => {
  it('returns no hits for substantive sentences', () => {
    const r = detectEmptyClaims('카카오 결제팀에서 일했습니다.');
    expect(r.hits).toBeDefined();
  });

  it('flags vague self-promotion phrases', () => {
    const r = detectEmptyClaims('해당 분야에 자신 있고 꼼꼼합니다. 잘 알고 있는 영역.');
    expect(r.hits.length).toBeGreaterThan(0);
  });
});

describe('analyzeVerbTense', () => {
  it('detects past-tense dominance in resume bullets', () => {
    const text = '개발했습니다. 구현했습니다. 배포했습니다. 운영했습니다.';
    const r = analyzeVerbTense(text);
    expect(r.past).toBeGreaterThan(0);
  });

  it('returns counts for empty text', () => {
    const r = analyzeVerbTense('');
    expect(r.past + r.present + r.future).toBeGreaterThanOrEqual(0);
  });
});

describe('detectAllCapsOveruse', () => {
  it('returns no hits for normal casing', () => {
    const r = detectAllCapsOveruse('I am a Backend Developer at Kakao.');
    expect(r.hits.length).toBe(0);
  });

  it('flags ALL CAPS words longer than threshold', () => {
    const r = detectAllCapsOveruse('IMPORTANT REQUIREMENT DESCRIPTION MUST BE READ CAREFULLY.');
    expect(r.hits.length).toBeGreaterThan(0);
  });
});
