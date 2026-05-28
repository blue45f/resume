import { describe, expect, it } from 'vitest';
import { checkCareerGapExplanations } from './careerGapExplanationChecker';

describe('checkCareerGapExplanations', () => {
  it('returns no signals for empty text', () => {
    const r = checkCareerGapExplanations('');
    expect(r.totalGapSignals).toBe(0);
    expect(r.hasUnexplainedGap).toBe(false);
  });

  it('detects military service explanation', () => {
    const r = checkCareerGapExplanations('2021.03 ~ 2022.12 군복무 (현역 전역). 이후 복직.');
    expect(r.explanationTypes).toContain('military');
    expect(r.totalGapSignals).toBeGreaterThan(0);
  });

  it('detects language study explanation', () => {
    const r = checkCareerGapExplanations('2022.01 ~ 2022.09 어학 연수 (캐나다). TOEIC 900 취득.');
    expect(r.explanationTypes).toContain('study');
  });

  it('detects side project as gap explanation', () => {
    const r = checkCareerGapExplanations('2023.01 ~ 2023.06 개인 프로젝트 개발 및 오픈소스 기여.');
    expect(r.explanationTypes).toContain('side_project');
  });

  it('detects parental leave', () => {
    const r = checkCareerGapExplanations('2022.03 ~ 2022.12 육아 휴직.');
    expect(r.explanationTypes).toContain('personal');
  });

  it('detects startup gap explanation', () => {
    const r = checkCareerGapExplanations('2021.06 ~ 2022.03 스타트업 창업 준비.');
    expect(r.explanationTypes).toContain('startup');
  });

  it('flags unexplained gap when date pattern present but no explanation', () => {
    const text = '2020.01 ~ 2021.12 A회사 재직. 공백 기간이 있습니다. 2022.06 ~ 현재 B회사.';
    const r = checkCareerGapExplanations(text);
    // "공백 기간이 있습니다" is a generic marker but no specific explanation type
    // should detect the marker but no explanation types
    expect(r.suggestion.length).toBeGreaterThan(0);
  });

  it('provides tips when explanation is missing', () => {
    const r = checkCareerGapExplanations('2020.01 ~ 현재 회사 재직 경력 기재');
    expect(r.tips).toBeDefined();
  });
});
