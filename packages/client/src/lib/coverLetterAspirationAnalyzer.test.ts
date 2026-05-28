import { describe, expect, it } from 'vitest';
import { analyzeCoverLetterAspiration } from './coverLetterAspirationAnalyzer';

describe('analyzeCoverLetterAspiration', () => {
  it('returns absent for empty text', () => {
    const r = analyzeCoverLetterAspiration('');
    expect(r.clarity).toBe('absent');
    expect(r.signals.length).toBe(0);
  });

  it('returns absent when no aspiration language found', () => {
    const r = analyzeCoverLetterAspiration('저는 React와 TypeScript를 사용한 경험이 있습니다.');
    expect(r.clarity).toBe('absent');
  });

  it('detects vague pledges (열심히 하겠습니다)', () => {
    const r = analyzeCoverLetterAspiration(
      '입사 후에는 열심히 하겠습니다. 최선을 다하겠습니다. 노력하겠습니다.',
    );
    expect(r.clarity).toBe('vague');
    expect(r.vagueCount).toBeGreaterThanOrEqual(2);
  });

  it('detects specific growth goal with time horizon', () => {
    const r = analyzeCoverLetterAspiration('3년 안에 시니어 개발자로 성장하는 것이 목표입니다.');
    expect(r.signals.some((s) => s.type === 'growth_goal')).toBe(true);
    expect(r.hasTimeHorizon).toBe(true);
  });

  it('detects company contribution aspiration', () => {
    const r = analyzeCoverLetterAspiration(
      '귀사의 결제 플랫폼 성장에 기여하고 팀의 핵심 인재로서 역할을 하고 싶습니다.',
    );
    expect(r.signals.some((s) => s.type === 'company_contribution')).toBe(true);
  });

  it('returns specific when multiple signals present', () => {
    const text = `
      5년 안에 테크 리드가 되는 것이 목표입니다.
      귀사의 데이터 파이프라인 개선에 기여하고 싶습니다.
      Kubernetes와 MSA 아키텍처를 심화 학습할 계획입니다.
    `;
    const r = analyzeCoverLetterAspiration(text);
    expect(r.clarity).toBe('specific');
  });

  it('detects time horizon presence', () => {
    const r = analyzeCoverLetterAspiration('향후 3년 후에는 팀 리더로 성장하겠습니다.');
    expect(r.hasTimeHorizon).toBe(true);
  });

  it('provides non-empty suggestion and rewriteHint', () => {
    const r = analyzeCoverLetterAspiration('성장하고 싶습니다.');
    expect(r.suggestion.length).toBeGreaterThan(0);
    expect(r.rewriteHint.length).toBeGreaterThan(0);
  });
});
