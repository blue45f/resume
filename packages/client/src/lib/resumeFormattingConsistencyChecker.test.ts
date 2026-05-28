import { describe, expect, it } from 'vitest';
import { checkResumeFormattingConsistency } from './resumeFormattingConsistencyChecker';

describe('checkResumeFormattingConsistency', () => {
  it('returns consistent for empty text', () => {
    const r = checkResumeFormattingConsistency('');
    expect(r.consistency).toBe('consistent');
    expect(r.issues).toHaveLength(0);
  });

  it('detects mixed date formats (dot vs korean)', () => {
    const text = '2023.03 ~ 2024.01 입사. 2022년 5월에 이직.';
    const r = checkResumeFormattingConsistency(text);
    expect(r.issues.some((i) => i.type === 'mixed_date_formats')).toBe(true);
  });

  it('no issue for single date format', () => {
    const text = '2023.03 ~ 2024.01 근무. 2021.06 ~ 2023.02 이직.';
    const r = checkResumeFormattingConsistency(text);
    expect(r.issues.some((i) => i.type === 'mixed_date_formats')).toBe(false);
  });

  it('detects mixed bullet styles', () => {
    const text = '- 항목 1\n• 항목 2\n- 항목 3';
    const r = checkResumeFormattingConsistency(text);
    expect(r.issues.some((i) => i.type === 'mixed_bullet_styles')).toBe(true);
  });

  it('no bullet issue for single bullet style', () => {
    const text = '- 항목 1\n- 항목 2\n- 항목 3';
    const r = checkResumeFormattingConsistency(text);
    expect(r.issues.some((i) => i.type === 'mixed_bullet_styles')).toBe(false);
  });

  it('detects mixed sentence endings in list items', () => {
    const text = [
      '- REST API 설계 및 구현.',
      '- DB 인덱스 최적화',
      '- 성능 개선 30% 달성.',
      '- 팀 리드 역할 수행',
      '- CI/CD 파이프라인 구축.',
      '- 코드 리뷰 문화 정착',
    ].join('\n');
    const r = checkResumeFormattingConsistency(text);
    expect(r.issues.some((i) => i.type === 'mixed_sentence_endings')).toBe(true);
  });

  it('detects mixed number formats', () => {
    const text = '성능을 30퍼센트 향상시키고 비용을 20% 절감했습니다.';
    const r = checkResumeFormattingConsistency(text);
    expect(r.issues.some((i) => i.type === 'mixed_number_formats')).toBe(true);
  });

  it('grades inconsistent for 2+ issues', () => {
    const text = '2023.03 ~ 2024.01. 2022년 입사.\n- 항목\n• 항목2\n- 항목3';
    const r = checkResumeFormattingConsistency(text);
    expect(r.consistency).toBe('inconsistent');
  });

  it('grades minor_issues for exactly 1 issue', () => {
    const text = '2023.03 ~ 2024.01. 2022년 입사.';
    const r = checkResumeFormattingConsistency(text);
    expect(r.consistency).toBe('minor_issues');
  });

  it('provides fix guide for each issue type', () => {
    const text = '2023.03 ~ 2024.01. 2022년 입사.\n- 항목 A\n• 항목 B\n- 항목 C\n- 항목 D.';
    const r = checkResumeFormattingConsistency(text);
    expect(r.fixGuide.length).toBeGreaterThan(0);
  });

  it('summary is non-empty', () => {
    const r = checkResumeFormattingConsistency('이력서 내용');
    expect(r.summary.length).toBeGreaterThan(5);
  });
});
