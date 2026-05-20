import { describe, expect, it } from 'vitest';
import { extractKeywords, detectSkillMentions } from './jdKeywords';

describe('extractKeywords', () => {
  it('returns empty array for empty input', () => {
    expect(extractKeywords('')).toEqual([]);
  });

  it('extracts top frequency Korean+English tokens', () => {
    const text = '카카오 카카오 카카오 결제 결제 시스템 Java Kotlin Spring';
    const kws = extractKeywords(text, 5);
    expect(kws.length).toBeGreaterThan(0);
    // 가장 빈번한 단어가 '카카오'여야 함
    expect(kws[0].word).toBe('카카오');
    expect(kws[0].count).toBe(3);
  });

  it('filters out stopwords', () => {
    const kws = extractKeywords('그리고 그래서 하지만 카카오 카카오');
    expect(kws.find((k) => k.word === '그리고')).toBeUndefined();
    expect(kws.find((k) => k.word === '카카오')).toBeDefined();
  });

  it('respects topN limit', () => {
    const text = '가나 나다 다라 라마 마바 바사 사아 아자 자차';
    const kws = extractKeywords(text, 3);
    expect(kws.length).toBeLessThanOrEqual(3);
  });
});

describe('detectSkillMentions', () => {
  it('returns empty for plain text', () => {
    const r = detectSkillMentions('일반 텍스트입니다.');
    expect(r).toEqual([]);
  });

  it('detects common tech skills', () => {
    const r = detectSkillMentions('React, Vue, Spring, Kafka, PostgreSQL 사용 경험.');
    expect(r.length).toBeGreaterThan(0);
    const skills = r.map((s) => s.skill);
    expect(skills.some((s) => /react|vue|spring|kafka|postgres/i.test(s))).toBe(true);
  });
});
