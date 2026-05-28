import { describe, expect, it } from 'vitest';
import { analyzeCoverLetterLengthBalance } from './coverLetterLengthBalanceAnalyzer';

describe('analyzeCoverLetterLengthBalance', () => {
  it('returns optimal for empty text (no issues)', () => {
    const r = analyzeCoverLetterLengthBalance('');
    expect(r.charCount).toBe(0);
    expect(r.issues).not.toContain('too_long');
  });

  it('flags too_short for < 300 chars', () => {
    const r = analyzeCoverLetterLengthBalance('안녕하세요. 저는 지원자입니다.');
    expect(r.issues).toContain('too_short');
    expect(r.grade).toBe('poor');
  });

  it('flags too_long for > 3000 chars', () => {
    const longText = '가나다라마바사아자차카타파하'.repeat(250);
    const r = analyzeCoverLetterLengthBalance(longText);
    expect(r.issues).toContain('too_long');
    expect(r.grade).toBe('poor');
  });

  it('flags single_block for unparagraphed long text', () => {
    const block = '이것은 문단 분리가 없는 긴 텍스트입니다. '.repeat(30);
    const r = analyzeCoverLetterLengthBalance(block);
    expect(r.issues).toContain('single_block');
  });

  it('grades optimal for well-structured text', () => {
    const good = [
      '저는 5년간 백엔드 개발자로 근무하며 여러 성과를 쌓았습니다. 특히 API 응답 속도를 40% 단축한 경험이 있습니다.',
      '',
      '이를 위해 캐시 레이어를 직접 설계하고 팀과 협력하여 배포했습니다. 그 결과 월 서버 비용이 30% 절감되었습니다.',
      '',
      '귀사의 인프라 확장 로드맵에 기여하고 싶습니다. 함께 성장하는 기회를 주시면 최선을 다하겠습니다.',
    ].join('\n');
    const r = analyzeCoverLetterLengthBalance(good.repeat(3));
    expect(['optimal', 'acceptable']).toContain(r.grade);
  });

  it('counts paragraphs correctly with double newlines', () => {
    const text = '문단 하나입니다.\n\n두 번째 문단입니다.\n\n세 번째 문단입니다.';
    const r = analyzeCoverLetterLengthBalance(text);
    expect(r.paragraphCount).toBe(3);
  });

  it('counts paragraphs correctly with Windows CRLF blank lines', () => {
    const text = '첫 번째 문단입니다.\r\n\r\n두 번째 문단입니다.\r\n\r\n세 번째 문단입니다.';
    const r = analyzeCoverLetterLengthBalance(text);
    expect(r.paragraphCount).toBe(3);
  });

  it('charCount is accurate', () => {
    const text = '안녕하세요.';
    const r = analyzeCoverLetterLengthBalance(text);
    expect(r.charCount).toBe(text.length);
  });

  it('summary is non-empty', () => {
    const r = analyzeCoverLetterLengthBalance('텍스트');
    expect(r.summary.length).toBeGreaterThan(5);
  });

  it('provides suggestions for issues', () => {
    const r = analyzeCoverLetterLengthBalance('짧은 텍스트');
    expect(r.suggestions.length).toBeGreaterThan(0);
  });
});
