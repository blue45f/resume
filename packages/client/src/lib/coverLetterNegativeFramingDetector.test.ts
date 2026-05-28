import { describe, expect, it } from 'vitest';
import { detectCoverLetterNegativeFraming } from './coverLetterNegativeFramingDetector';

describe('detectCoverLetterNegativeFraming', () => {
  it('returns clean for positive cover letter', () => {
    const r = detectCoverLetterNegativeFraming(
      '새로운 기술에 도전하며 성장하고 싶어 지원합니다. 팀과 협업하여 좋은 결과를 만들고 싶습니다.',
    );
    expect(r.grade).toBe('clean');
  });

  it('flags ex-employer badmouthing', () => {
    const r = detectCoverLetterNegativeFraming(
      '이전 회사는 비전이 없고 박봉이어서 퇴사를 결심했습니다.',
    );
    expect(r.matches.some((m) => m.type === 'ex_employer_badmouth')).toBe(true);
    expect(r.grade).not.toBe('clean');
  });

  it('flags colleague complaint', () => {
    const r = detectCoverLetterNegativeFraming('상사와 소통이 안 되고 답답한 환경이었습니다.');
    expect(r.matches.some((m) => m.type === 'colleague_complaint')).toBe(true);
  });

  it('flags negative resignation reason', () => {
    const r = detectCoverLetterNegativeFraming('워라밸이 없어서 퇴사하게 되었습니다.');
    expect(r.matches.some((m) => m.type === 'negative_resignation')).toBe(true);
  });

  it('flags blame/excuse framing', () => {
    const r = detectCoverLetterNegativeFraming('회사 환경 탓에 성과를 내기 어려웠습니다.');
    expect(r.matches.some((m) => m.type === 'blame_excuse')).toBe(true);
  });

  it('grades concerning when multiple issues', () => {
    const text = '이전 회사는 비전이 없었고, 상사와도 소통이 안 됐습니다.';
    const r = detectCoverLetterNegativeFraming(text);
    expect(r.grade).toBe('concerning');
  });

  it('does not false-positive on neutral mention of previous company', () => {
    const r = detectCoverLetterNegativeFraming(
      '이전 회사에서 결제 시스템을 구축하며 많은 것을 배웠습니다.',
    );
    expect(r.matches.some((m) => m.type === 'ex_employer_badmouth')).toBe(false);
  });

  it('deduplicates same framing type', () => {
    const text = '이전 회사는 박봉이었습니다.\n전 직장은 비전이 없었습니다.';
    const r = detectCoverLetterNegativeFraming(text);
    expect(r.matches.filter((m) => m.type === 'ex_employer_badmouth').length).toBe(1);
  });

  it('summary and suggestions non-empty when issues exist', () => {
    const r = detectCoverLetterNegativeFraming('전 직장은 갑질이 심했습니다.');
    expect(r.summary.length).toBeGreaterThan(5);
    expect(r.suggestions.length).toBeGreaterThan(0);
  });
});
