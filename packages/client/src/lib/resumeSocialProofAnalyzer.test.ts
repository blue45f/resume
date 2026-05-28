import { describe, expect, it } from 'vitest';
import { analyzeResumeSocialProof } from './resumeSocialProofAnalyzer';

describe('analyzeResumeSocialProof', () => {
  it('returns none level for empty text', () => {
    const r = analyzeResumeSocialProof('');
    expect(r.level).toBe('none');
    expect(r.score).toBe(0);
    expect(r.signals.length).toBe(0);
  });

  it('returns none for text without social proof signals', () => {
    const r = analyzeResumeSocialProof('React TypeScript로 SPA를 개발했습니다. 3년 경력.');
    expect(r.level).toBe('none');
  });

  it('detects open source contribution', () => {
    const r = analyzeResumeSocialProof('GitHub star 150 오픈소스 라이브러리 운영. PR merged 30건');
    expect(r.types.has('open_source')).toBe(true);
    expect(r.score).toBeGreaterThan(0);
  });

  it('detects conference talk signal', () => {
    const r = analyzeResumeSocialProof('DEVIEW 2023 발표. 사내 Tech Talk 진행 3회.');
    expect(r.types.has('conference_talk')).toBe(true);
  });

  it('detects patent signal', () => {
    const r = analyzeResumeSocialProof('특허 등록 2건. 등록 특허 번호 10-2345678.');
    expect(r.types.has('patent')).toBe(true);
  });

  it('detects award signal', () => {
    const r = analyzeResumeSocialProof('해커톤 우승 (카카오 개발자 컨테스트). 공모전 대상 수상.');
    expect(r.types.has('award')).toBe(true);
  });

  it('detects publication signals', () => {
    const r = analyzeResumeSocialProof(
      'CVPR 2022 논문 게재. 기술 블로그 운영 (velog 월 방문자 5천).',
    );
    expect(r.types.has('publication')).toBe(true);
  });

  it('returns high level for multiple strong signals', () => {
    const text = `
      IEEE 논문 게재 (2022). 특허 등록 1건.
      JSConf Korea 스피커. 오픈소스 메인테이너 (GitHub star 500+).
    `;
    const r = analyzeResumeSocialProof(text);
    expect(r.score).toBeGreaterThanOrEqual(50);
    expect(r.level).toBe('high');
  });

  it('provides missing tips when signals are low', () => {
    const r = analyzeResumeSocialProof('React 개발자. 3년 경력.');
    expect(r.missingTips.length).toBeGreaterThan(0);
  });
});
