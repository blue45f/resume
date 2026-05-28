import { describe, expect, it } from 'vitest';
import { checkResumeEducationCompleteness } from './resumeEducationCompletenessChecker';

describe('checkResumeEducationCompleteness', () => {
  it('returns absent for text with no education info', () => {
    const r = checkResumeEducationCompleteness(
      '백엔드 개발자입니다. 다양한 프로젝트를 진행했습니다.',
    );
    expect(r.completeness).toBe('absent');
  });

  it('detects complete education section', () => {
    const text = ['학력', '서울대학교 컴퓨터공학과 학사', '2015 ~ 2019 졸업', '학점: 3.8/4.5'].join(
      '\n',
    );
    const r = checkResumeEducationCompleteness(text);
    expect(r.completeness).toBe('complete');
    expect(r.presentCount).toBe(4);
    expect(r.hasGpa).toBe(true);
  });

  it('detects school field', () => {
    const r = checkResumeEducationCompleteness('학력\n연세대학교 경영학과');
    expect(r.fields.find((f) => f.field === 'school')?.present).toBe(true);
    expect(r.fields.find((f) => f.field === 'major')?.present).toBe(true);
  });

  it('grades good when 3 of 4 core fields present', () => {
    const text = '학력\n고려대학교 전기전자공학부\n2020 졸업';
    const r = checkResumeEducationCompleteness(text);
    expect(['good', 'complete']).toContain(r.completeness);
  });

  it('flags missing fields in suggestions', () => {
    const text = '학력\n한양대학교';
    const r = checkResumeEducationCompleteness(text);
    expect(r.suggestions.length).toBeGreaterThan(0);
  });

  it('detects section header presence', () => {
    const r = checkResumeEducationCompleteness('학력사항\nKAIST 전산학부 석사 2018 졸업');
    expect(r.sectionDetected).toBe(true);
  });

  it('isolates education section from later sections', () => {
    const text = [
      '학력',
      '부산대학교 화학공학과 학사 2017 졸업',
      '경력사항',
      '삼성전자 졸업 프로젝트 진행 2.5억 매출',
    ].join('\n');
    const r = checkResumeEducationCompleteness(text);
    expect(r.sectionDetected).toBe(true);
    expect(r.fields.find((f) => f.field === 'school')?.present).toBe(true);
  });

  it('summary is non-empty', () => {
    const r = checkResumeEducationCompleteness('학력\n인하대학교');
    expect(r.summary.length).toBeGreaterThan(5);
  });

  it('recommends GPA for juniors when missing', () => {
    const text = '학력\n중앙대학교 소프트웨어학과 2021 졸업';
    const r = checkResumeEducationCompleteness(text);
    expect(r.suggestions.some((s) => s.includes('학점'))).toBe(true);
  });
});
