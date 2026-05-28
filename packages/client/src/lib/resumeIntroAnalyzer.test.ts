import { describe, expect, it } from 'vitest';
import { extractResumeIntro, analyzeResumeIntro } from './resumeIntroAnalyzer';

describe('extractResumeIntro', () => {
  it('returns empty string for empty input', () => {
    expect(extractResumeIntro('')).toBe('');
  });

  it('extracts text before 경력 사항 header', () => {
    const text = '5년 경력의 백엔드 개발자입니다.\n\n경력 사항\n네이버 2020-2024';
    const intro = extractResumeIntro(text);
    expect(intro).toContain('5년 경력');
    expect(intro).not.toContain('네이버');
  });

  it('extracts text before 학력 header', () => {
    const text = '저는 개발자입니다.\n\n학력\n서울대학교';
    const intro = extractResumeIntro(text);
    expect(intro).toContain('개발자');
    expect(intro).not.toContain('서울대');
  });

  it('caps at 300 chars when no section header', () => {
    const text = 'A'.repeat(500);
    expect(extractResumeIntro(text).length).toBe(300);
  });
});

describe('analyzeResumeIntro', () => {
  it('returns weak for empty text', () => {
    const r = analyzeResumeIntro('');
    expect(r.strength).toBe('weak');
    expect(r.hasCareerClaim).toBe(false);
  });

  it('returns weak for very short text', () => {
    const r = analyzeResumeIntro('안녕하세요');
    expect(r.strength).toBe('weak');
  });

  it('detects cliché phrases', () => {
    const text = '저는 성실하고 열정적인 사람입니다. 최선을 다하겠습니다.\n\n경력 사항\n';
    const r = analyzeResumeIntro(text);
    expect(r.clicheHits.length).toBeGreaterThanOrEqual(2);
    expect(r.strength).toBe('weak');
  });

  it('detects career claim with years and role', () => {
    const text = '5년 경력의 백엔드 개발자로서 MSA 아키텍처를 설계했습니다.\n\n경력 사항\n';
    const r = analyzeResumeIntro(text);
    expect(r.hasCareerClaim).toBe(true);
  });

  it('detects metric in intro', () => {
    const text = '3년차 프론트엔드 개발자로 MAU 50만 명의 서비스를 운영했습니다.\n\n경력 사항\n';
    const r = analyzeResumeIntro(text);
    expect(r.hasMetric).toBe(true);
  });

  it('returns strong when career claim + metric + no cliché', () => {
    const text =
      '5년 경력의 데이터 엔지니어로 일 100만 건 파이프라인을 설계했습니다.\n\n경력 사항\n';
    const r = analyzeResumeIntro(text);
    expect(r.hasCareerClaim).toBe(true);
    expect(r.hasMetric).toBe(true);
    expect(r.clicheHits.length).toBe(0);
    expect(r.strength).toBe('strong');
  });

  it('returns moderate when career claim but no metric', () => {
    const text = '3년차 iOS 개발자로 여러 앱을 개발했습니다.\n\n경력 사항\n';
    const r = analyzeResumeIntro(text);
    expect(r.hasCareerClaim).toBe(true);
    expect(r.strength).toBe('moderate');
  });

  it('includes intro text in result', () => {
    const text = '5년 경력의 개발자입니다.\n\n경력 사항\n';
    const r = analyzeResumeIntro(text);
    expect(r.intro).toContain('개발자');
  });

  it('provides a non-empty suggestion', () => {
    const r = analyzeResumeIntro('열정적인 사람입니다.');
    expect(r.suggestion.length).toBeGreaterThan(0);
  });
});
