import { describe, expect, it } from 'vitest';
import { analyzeResumeCertifications } from './resumeCertificationAnalyzer';

describe('analyzeResumeCertifications', () => {
  it('returns zero certs for empty text', () => {
    const r = analyzeResumeCertifications('');
    expect(r.totalCount).toBe(0);
    expect(r.certs.length).toBe(0);
  });

  it('detects 정보처리기사 as IT national cert', () => {
    const text = '자격증: 정보처리기사 (2021.05). 컴퓨터활용능력 1급.';
    const r = analyzeResumeCertifications(text);
    expect(r.hasItCert).toBe(true);
    expect(r.certs.some((c) => c.name === '정보처리기사')).toBe(true);
    expect(r.certs.find((c) => c.name === '정보처리기사')?.tier).toBe('national');
  });

  it('detects AWS certification as cloud cert', () => {
    const text = '자격증: AWS Solutions Architect Associate. Docker/K8s 경험.';
    const r = analyzeResumeCertifications(text);
    expect(r.hasCloudCert).toBe(true);
    expect(r.certs.some((c) => c.category === 'cloud')).toBe(true);
  });

  it('detects TOEIC as language cert', () => {
    const text = '어학: TOEIC 870점. OPIc IH.';
    const r = analyzeResumeCertifications(text);
    expect(r.hasLanguageCert).toBe(true);
    expect(r.certs.some((c) => c.name === 'TOEIC')).toBe(true);
    expect(r.certs.some((c) => c.name === 'OPIc')).toBe(true);
  });

  it('detects JLPT Japanese cert', () => {
    const text = '일본어 능력 시험 JLPT N2 취득.';
    const r = analyzeResumeCertifications(text);
    expect(r.certs.some((c) => c.name === 'JLPT')).toBe(true);
    expect(r.hasLanguageCert).toBe(true);
  });

  it('detects SQLD as IT national cert', () => {
    const text = 'SQLD 자격증 보유. SQL 개발자 실무 경험 3년.';
    const r = analyzeResumeCertifications(text);
    expect(r.certs.some((c) => c.name === 'SQLD')).toBe(true);
  });

  it('detects PMP as business cert', () => {
    const text = 'PMP 취득. 프로젝트 관리 전문가 자격 보유.';
    const r = analyzeResumeCertifications(text);
    expect(r.certs.some((c) => c.name === 'PMP')).toBe(true);
    expect(r.certs.find((c) => c.name === 'PMP')?.tier).toBe('global');
  });

  it('provides non-empty suggestion', () => {
    const r = analyzeResumeCertifications('React TypeScript 개발자 3년 경력.');
    expect(r.suggestion.length).toBeGreaterThan(0);
  });
});
