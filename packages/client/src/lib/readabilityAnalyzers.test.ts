import { describe, expect, it } from 'vitest';
import { analyzeReadability, analyzeLength, countSentencesByEnding } from './readabilityAnalyzers';

describe('analyzeReadability', () => {
  it('reports 0 for empty', () => {
    const r = analyzeReadability('');
    expect(r.sentenceCount).toBe(0);
    expect(r.readabilityScore).toBe(0);
  });

  it('rates short balanced sentences as easy', () => {
    const r = analyzeReadability('짧은 문장입니다. 또 다른 문장. 마지막 문장.');
    expect(r.level).toBe('easy');
    expect(r.readabilityScore).toBeGreaterThanOrEqual(75);
  });

  it('penalizes a single very long sentence as hard', () => {
    const longSentence = '저는 ' + '단어 '.repeat(80) + '입니다.';
    const r = analyzeReadability(longSentence);
    expect(r.maxSentenceLength).toBeGreaterThan(80);
    expect(r.readabilityScore).toBeLessThan(80);
  });
});

describe('analyzeLength', () => {
  it('returns no-target status when no target provided', () => {
    const r = analyzeLength('hello world');
    expect(r.status).toBe('no-target');
    expect(r.charsWithSpaces).toBe('hello world'.length);
    expect(r.charsWithoutSpaces).toBe('helloworld'.length);
  });

  it('reports under when below min', () => {
    const r = analyzeLength('짧음', { min: 100 });
    expect(r.status).toBe('under');
    expect(r.suggestion).toMatch(/부족/);
  });

  it('reports ok when within bounds', () => {
    const r = analyzeLength('a'.repeat(150), { min: 100, max: 200 });
    expect(r.status).toBe('ok');
  });

  it('reports over when above max', () => {
    const r = analyzeLength('a'.repeat(300), { max: 100 });
    expect(r.status).toBe('over');
    expect(r.suggestion).toMatch(/초과/);
  });
});

describe('countSentencesByEnding', () => {
  it('returns none for empty', () => {
    const r = countSentencesByEnding('');
    expect(r.total).toBe(0);
    expect(r.dominant).toBe('none');
  });

  it('marks dominant as formal for 합니다 sentences', () => {
    const text =
      '백엔드 개발자입니다. 5년 근무했습니다. 카카오에서 일했습니다. 결제를 담당했습니다. 성과를 냈습니다.';
    const r = countSentencesByEnding(text);
    expect(r.formal).toBeGreaterThanOrEqual(3);
    expect(r.dominant).toBe('formal');
  });

  it('returns mixed when no dominant 60% bucket', () => {
    const text = '입사했습니다. 일했다. 즐거워요. 했고.';
    const r = countSentencesByEnding(text);
    expect(r.dominant).toBe('mixed');
  });
});
