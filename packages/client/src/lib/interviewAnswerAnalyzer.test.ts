import { describe, expect, it } from 'vitest';
import { analyzeInterviewAnswer } from './interviewAnswerAnalyzer';

describe('analyzeInterviewAnswer', () => {
  it('returns score 0 for empty text', () => {
    const r = analyzeInterviewAnswer('');
    expect(r.score).toBe(0);
    expect(r.charCount).toBe(0);
  });

  it('score is 0-100 for normal text', () => {
    const r = analyzeInterviewAnswer('저는 팀을 리드하며 API 성능을 40% 개선했습니다.');
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it('detects numbers presence', () => {
    const r = analyzeInterviewAnswer('처리량을 300% 향상시켰습니다.');
    expect(r.hasNumbers).toBe(true);
  });

  it('detects first person', () => {
    const r = analyzeInterviewAnswer('저는 직접 설계하고 구현했습니다.');
    expect(r.hasFirstPerson).toBe(true);
  });

  it('counts fillers', () => {
    const r = analyzeInterviewAnswer('음 어 그러니까 저는 그냥 했습니다.');
    expect(r.fillerCount).toBeGreaterThan(0);
  });

  it('detects STAR action signal', () => {
    const r = analyzeInterviewAnswer('제가 직접 API를 구현하고 성과를 달성했습니다.');
    expect(r.starSignals.action).toBe(true);
  });

  it('detects STAR result signal', () => {
    const r = analyzeInterviewAnswer('결과적으로 성과를 달성하고 성공했습니다.');
    expect(r.starSignals.result).toBe(true);
  });

  it('provides tips array', () => {
    const r = analyzeInterviewAnswer('짧은 답변입니다.');
    expect(Array.isArray(r.tips)).toBe(true);
  });

  it('good answer scores higher than minimal answer', () => {
    const good = analyzeInterviewAnswer(
      '저는 당시 팀 리더로서 API 응답 지연 문제를 담당했습니다. ' +
        '성능 병목을 분석하고 쿼리를 최적화하여 응답시간을 300ms에서 80ms로 단축했습니다. ' +
        '결과적으로 사용자 만족도가 40% 향상되었습니다.',
    );
    const minimal = analyzeInterviewAnswer('그냥 했습니다.');
    expect(good.score).toBeGreaterThan(minimal.score);
  });

  it('starScore is 0-4', () => {
    const r = analyzeInterviewAnswer(
      '프로젝트에서 저는 성능 개선 목표를 맡아 분석하고 결과를 달성했습니다.',
    );
    expect(r.starScore).toBeGreaterThanOrEqual(0);
    expect(r.starScore).toBeLessThanOrEqual(4);
  });
});
