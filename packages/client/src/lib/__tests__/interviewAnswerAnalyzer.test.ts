import { describe, it, expect } from 'vitest';
import { analyzeInterviewAnswer } from '../interviewAnswerAnalyzer';

describe('analyzeInterviewAnswer', () => {
  it('빈 입력 → score 0 + 길이 부족 tip', () => {
    const r = analyzeInterviewAnswer('');
    expect(r.score).toBe(0);
    expect(r.tips.some((t) => t.includes('짧아요'))).toBe(true);
  });

  it('이상적 답변 (STAR + 정량 + 1인칭) → 80점 이상', () => {
    const text =
      '저는 작년 카카오 결제팀에서 결제 시스템 안정화 프로젝트를 맡았습니다. ' +
      '당시 결제 실패율이 3%로 높아 사용자 이탈이 빈번한 상황이었습니다. ' +
      '제가 담당한 임무는 실패 원인을 분석하고 핵심 개선안을 도출하는 것이었습니다. ' +
      '저는 로그를 정밀 분석하고 retry 로직을 새로 설계해 도입했습니다. ' +
      '결과적으로 결제 실패율이 0.5%로 감소했고 월 매출이 12% 증가했습니다.';
    const r = analyzeInterviewAnswer(text);
    expect(r.score).toBeGreaterThanOrEqual(80);
    expect(r.starScore).toBe(4);
    expect(r.hasNumbers).toBe(true);
    expect(r.hasFirstPerson).toBe(true);
  });

  it('필러 많은 답변 → 점수 감점 + 필러 tip', () => {
    const text = '음 그러니까 어 저는 음 프로젝트를 음 진행했습니다 어 그게 음 좀 어려웠어요 음.';
    const r = analyzeInterviewAnswer(text);
    expect(r.fillerCount).toBeGreaterThan(3);
    expect(r.tips.some((t) => t.includes('필러'))).toBe(true);
  });

  it('너무 긴 답변 → 길이 감점 + 간결성 tip', () => {
    const text = '저는 프로젝트를 진행했습니다.'.repeat(70);
    const r = analyzeInterviewAnswer(text);
    expect(r.charCount).toBeGreaterThan(800);
    expect(r.tips.some((t) => t.includes('너무 길'))).toBe(true);
  });

  it('STAR 누락 → 각 항목별 tip 노출', () => {
    const text = '저는 그냥 평소처럼 일했습니다.';
    const r = analyzeInterviewAnswer(text);
    expect(r.starScore).toBeLessThan(4);
    const tipText = r.tips.join(' ');
    expect(tipText).toMatch(/S\(상황\)|T\(임무\)|A\(행동\)|R\(결과\)/);
  });

  it('정량 표현 없음 → 정량 tip', () => {
    const text =
      '저는 당시 팀에서 프로젝트를 맡아 진행하고 결과를 도출했습니다. ' + '많은 개선이 있었습니다.';
    const r = analyzeInterviewAnswer(text);
    expect(r.hasNumbers).toBe(false);
    expect(r.tips.some((t) => t.includes('정량'))).toBe(true);
  });

  it('1인칭 주어 없음 + 길이 충분 → 주어 tip', () => {
    const text =
      '당시 카카오 결제팀에서 결제 시스템 안정화 프로젝트를 맡아 진행하고 결과를 도출했습니다.';
    const r = analyzeInterviewAnswer(text);
    expect(r.hasFirstPerson).toBe(false);
    expect(r.tips.some((t) => t.includes('주어'))).toBe(true);
  });
});
