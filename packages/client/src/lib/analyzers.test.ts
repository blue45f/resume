import { describe, expect, it } from 'vitest';
import { extractQuotableLines } from './resumeGenerators';
import { analyzeStarPattern } from './starPattern';
import { computeJDMatch } from './jdKeywords';
import { detectPersonalInfo } from './pii';

const sampleResumeText = `
자기소개: 7년차 백엔드 개발자로서 대규모 트래픽 서비스 설계·운영 경험.
경력: 카카오 · 시니어 엔지니어 · 2020.01 ~ 2022.12
결제 플랫폼 리팩토링을 주도하여 응답시간을 30% 단축하고 장애율을 50% 감소시켰습니다.
경력: 네이버 · 백엔드 개발자 · 2016.03 ~ 2019.12
추천 시스템 개발을 담당했고 일 사용자 100만명 기반 API 를 설계·구축했습니다.
스킬 (Backend): Java, Kotlin, Spring, JPA, Kafka, PostgreSQL
`.trim();

describe('extractQuotableLines', () => {
  it('returns top-N lines with signals object', () => {
    const lines = extractQuotableLines(sampleResumeText, 3);
    expect(lines.length).toBeLessThanOrEqual(3);
    for (const line of lines) {
      expect(typeof line.sentence).toBe('string');
      expect(line.signals).toHaveProperty('hasNumber');
      expect(line.signals).toHaveProperty('hasStrongVerb');
      expect(line.signals).toHaveProperty('hasProper');
    }
  });

  it('ranks sentences with numeric results higher', () => {
    const lines = extractQuotableLines(sampleResumeText, 3);
    if (lines.length > 0) {
      // the quantified sentence should appear in top 3
      const joined = lines.map((l) => l.sentence).join(' ');
      expect(joined).toMatch(/30%|50%|100만명/);
    }
  });
});

describe('analyzeStarPattern', () => {
  it('returns coverage and tier for multi-sentence text', () => {
    const report = analyzeStarPattern(sampleResumeText);
    expect(report.analyzed).toBeGreaterThanOrEqual(0);
    expect(report.coverage).toBeGreaterThanOrEqual(0);
    expect(report.coverage).toBeLessThanOrEqual(100);
    expect(['excellent', 'good', 'fair', 'poor']).toContain(report.tier);
  });
});

describe('computeJDMatch', () => {
  it('finds overlapping keywords between resume and JD', () => {
    const jd = '백엔드 엔지니어 채용 · Java · Spring · Kafka · PostgreSQL · 대규모 트래픽 경험';
    const r = computeJDMatch(sampleResumeText, jd);
    expect(Array.isArray(r.matched)).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it('exposes missing + onlyInResume partitions', () => {
    const jd = '프론트엔드 React Vue Svelte CSS HTML';
    const r = computeJDMatch(sampleResumeText, jd);
    expect(Array.isArray(r.missing)).toBe(true);
    expect(Array.isArray(r.onlyInResume)).toBe(true);
  });
});

describe('detectPersonalInfo', () => {
  it('flags resident registration numbers (주민등록번호)', () => {
    const r = detectPersonalInfo('주민: 901231-1234567');
    expect(r.hits.some((h) => h.type === 'rrn')).toBe(true);
    expect(r.severity).toBe('critical');
  });

  it('flags credit card numbers', () => {
    const r = detectPersonalInfo('카드: 1234-5678-9012-3456');
    expect(r.hits.some((h) => h.type === 'card')).toBe(true);
  });

  it('returns no hits + severity none for clean text', () => {
    const r = detectPersonalInfo('저는 백엔드 개발자입니다. 경력 7년.');
    expect(r.hits).toHaveLength(0);
    expect(r.severity).toBe('none');
  });
});
