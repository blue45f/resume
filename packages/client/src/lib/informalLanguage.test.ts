import { describe, expect, it } from 'vitest';
import { detectInformalLanguage } from './informalLanguage';

describe('detectInformalLanguage', () => {
  it('returns level=none for clean formal Korean', () => {
    const r = detectInformalLanguage('백엔드 개발자로 5년 근무하였습니다.');
    expect(r.level).toBe('none');
    expect(r.count).toBe(0);
  });

  it('detects 초성체 (ㅋㅋ/ㅎㅎ)', () => {
    const r = detectInformalLanguage('이것은 너무 좋아요 ㅋㅋㅋ');
    expect(r.hits.some((h) => h.category === 'chosung')).toBe(true);
    expect(r.count).toBeGreaterThan(0);
  });

  it('detects emoji as emoticon category', () => {
    const r = detectInformalLanguage('성공했어요 🎉🚀');
    expect(r.hits.some((h) => h.category === 'emoticon')).toBe(true);
  });

  it('detects slang (JMT/존맛)', () => {
    const r = detectInformalLanguage('이번 결과 JMT 였습니다.');
    expect(r.hits.some((h) => h.category === 'slang')).toBe(true);
  });

  it('detects casual replacement words (근데)', () => {
    const r = detectInformalLanguage('근데 결과는 좋았습니다.');
    expect(r.hits.some((h) => h.category === 'casual')).toBe(true);
  });

  it('flags many (>2) as level=many', () => {
    const r = detectInformalLanguage('ㅋㅋㅋ ㅎㅎㅎ ㅠㅠ JMT 갑분싸 너무너무 근데');
    expect(r.level).toBe('many');
    expect(r.count).toBeGreaterThan(2);
  });

  it('flags 1-2 hits as level=few', () => {
    const r = detectInformalLanguage('근데 결과가 좋았습니다.');
    expect(r.level).toBe('few');
    expect(r.count).toBeLessThanOrEqual(2);
  });

  it('suggestion is non-empty', () => {
    const r = detectInformalLanguage('ㅋㅋ 성공했어요');
    expect(r.suggestion.length).toBeGreaterThan(0);
  });

  it('caps hits at 30', () => {
    const heavy = 'ㅋㅋ '.repeat(40);
    const r = detectInformalLanguage(heavy);
    expect(r.hits.length).toBeLessThanOrEqual(30);
  });

  it('detects repeated exclamation marks', () => {
    const r = detectInformalLanguage('정말 대단해요!!! 믿을 수 없어요??');
    expect(r.hits.some((h) => h.category === 'exclaim')).toBe(true);
  });
});
