import { describe, expect, it } from 'vitest';
import { buildJdKeywordGapReport } from './jdKeywordGap';

describe('buildJdKeywordGapReport', () => {
  it('returns empty when JD is empty', () => {
    const r = buildJdKeywordGapReport('', '');
    expect(r.jdKeywords).toHaveLength(0);
    expect(r.matchScore).toBe(0);
  });

  it('detects Python in JD', () => {
    const r = buildJdKeywordGapReport('Python 경험 3년 이상', '');
    expect(r.jdKeywords.some((k) => k.keyword === 'Python')).toBe(true);
  });

  it('marks keyword as present when it appears in resume', () => {
    const r = buildJdKeywordGapReport(
      'Python, TypeScript 경험 필요',
      'Python을 이용하여 데이터 파이프라인을 구축하였습니다.',
    );
    const python = r.jdKeywords.find((k) => k.keyword === 'Python');
    expect(python?.status).toBe('present');
    const ts = r.jdKeywords.find((k) => k.keyword === 'TypeScript');
    expect(ts?.status).toBe('missing');
  });

  it('marks keyword as missing when not in resume', () => {
    const r = buildJdKeywordGapReport('React, Docker 활용', 'Vue를 사용합니다.');
    expect(r.missing.some((k) => k.keyword === 'React')).toBe(true);
    expect(r.missing.some((k) => k.keyword === 'Docker')).toBe(true);
  });

  it('calculates matchScore correctly', () => {
    const jd = 'React, Python, AWS 경험 필요';
    const resume = 'React와 Python을 활용하여 서비스를 개발하였습니다.';
    const r = buildJdKeywordGapReport(jd, resume);
    // 2 of 3 matched
    expect(r.present.length).toBe(2);
    expect(r.missing.length).toBe(1);
    expect(r.matchScore).toBe(Math.round((2 / 3) * 100));
  });

  it('detects Korean keyword aliases (파이썬)', () => {
    const r = buildJdKeywordGapReport('파이썬 및 장고 경험자 우대', '');
    const keywords = r.jdKeywords.map((k) => k.keyword);
    expect(keywords).toContain('Python');
    expect(keywords).toContain('Django');
  });

  it('groups keywords by category', () => {
    const r = buildJdKeywordGapReport('React, AWS, MySQL, Python', '');
    expect(r.byCategory.framework.some((k) => k.keyword === 'React')).toBe(true);
    expect(r.byCategory.cloud.some((k) => k.keyword === 'AWS')).toBe(true);
    expect(r.byCategory.database.some((k) => k.keyword === 'MySQL')).toBe(true);
    expect(r.byCategory.language.some((k) => k.keyword === 'Python')).toBe(true);
  });

  it('100% match score when all JD keywords are in resume', () => {
    const jd = 'TypeScript, React 활용';
    const resume = 'TypeScript와 React로 개발하였습니다.';
    const r = buildJdKeywordGapReport(jd, resume);
    expect(r.matchScore).toBe(100);
    expect(r.missing).toHaveLength(0);
  });

  it('does not confuse Java and JavaScript', () => {
    const r = buildJdKeywordGapReport('Java 백엔드 개발자', '자바스크립트를 주로 사용합니다.');
    const java = r.jdKeywords.find((k) => k.keyword === 'Java');
    // Java keyword detected in JD, but resume has JavaScript (자바스크립트) not Java (자바)
    expect(java).toBeDefined();
    // 자바스크립트 should NOT satisfy 자바(?!스크립트) lookhead in Java pattern
    expect(java?.status).toBe('missing');
  });
});
