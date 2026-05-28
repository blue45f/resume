import { describe, expect, it } from 'vitest';
import { detectCoverLetterCta } from './coverLetterCtaDetector';

describe('detectCoverLetterCta', () => {
  it('returns absent for empty text', () => {
    const r = detectCoverLetterCta('');
    expect(r.strength).toBe('absent');
  });

  it('detects strong CTA — interview request', () => {
    const r = detectCoverLetterCta(
      '저의 역량을 발휘할 자신이 있습니다.\n\n면접 기회를 주시면 더 자세히 설명드리겠습니다.',
    );
    expect(r.strength).toBe('strong');
    expect(r.matches.some((m) => m.pattern === 'interview_request')).toBe(true);
  });

  it('detects strong CTA — contact readiness', () => {
    const r = detectCoverLetterCta(
      '열심히 하겠습니다.\n\n추가 자료가 필요하시면 언제든 연락 주세요.',
    );
    expect(r.strength).toBe('strong');
  });

  it('detects strong CTA — portfolio offer', () => {
    const r = detectCoverLetterCta(
      '프로젝트를 진행했습니다.\n\n포트폴리오를 보내드리겠습니다. 감사합니다.',
    );
    expect(r.strength).toBe('strong');
  });

  it('detects weak CTA — passive closing only', () => {
    const r = detectCoverLetterCta('귀사에 기여하고 싶습니다.\n\n검토해 주시면 감사하겠습니다.');
    expect(['weak', 'present']).toContain(r.strength);
  });

  it('detects abrupt end', () => {
    const r = detectCoverLetterCta('열심히 하겠습니다.\n\n감사합니다.');
    expect(r.strength).not.toBe('strong');
    expect(r.matches.some((m) => m.pattern === 'abrupt_end')).toBe(true);
  });

  it('summary is non-empty', () => {
    const r = detectCoverLetterCta('지원 동기 내용입니다. 감사합니다.');
    expect(r.summary.length).toBeGreaterThan(3);
  });

  it('suggestions are provided for weak/absent', () => {
    const r = detectCoverLetterCta('감사합니다.');
    expect(r.suggestions.length).toBeGreaterThan(0);
  });
});
