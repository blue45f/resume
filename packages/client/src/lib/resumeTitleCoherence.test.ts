import { describe, expect, it } from 'vitest';
import {
  analyzeResumeTitleCoherence,
  detectRoleFamily,
  detectTitleLevel,
} from './resumeTitleCoherence';

describe('detectTitleLevel', () => {
  it('returns unknown for empty title', () => {
    expect(detectTitleLevel('')).toBe('unknown');
  });

  it('returns unknown when title has no level keyword', () => {
    expect(detectTitleLevel('Frontend Engineer')).toBe('unknown');
  });

  it('detects 시니어', () => {
    expect(detectTitleLevel('시니어 백엔드 엔지니어')).toBe('senior');
  });

  it('detects Senior in English', () => {
    expect(detectTitleLevel('Senior Software Engineer')).toBe('senior');
  });

  it('promotes lead over senior when both appear', () => {
    expect(detectTitleLevel('Senior Lead Engineer')).toBe('lead');
  });

  it('detects staff/임원', () => {
    expect(detectTitleLevel('Head of Engineering')).toBe('staff');
    expect(detectTitleLevel('수석 엔지니어')).toBe('staff');
  });

  it('detects 신입/주니어', () => {
    expect(detectTitleLevel('신입 개발자')).toBe('entry');
    expect(detectTitleLevel('주니어 프론트엔드')).toBe('junior');
  });
});

describe('detectRoleFamily', () => {
  it('detects engineering family', () => {
    expect(detectRoleFamily('Senior Backend Engineer')).toBe('engineering');
    expect(detectRoleFamily('백엔드 개발자')).toBe('engineering');
  });

  it('detects design family', () => {
    expect(detectRoleFamily('Product Designer')).toBe('design');
    expect(detectRoleFamily('UX 디자이너')).toBe('design');
  });

  it('detects product manager', () => {
    expect(detectRoleFamily('Senior Product Manager')).toBe('product');
    expect(detectRoleFamily('프로덕트 매니저')).toBe('product');
  });

  it('falls back to unknown when no family match', () => {
    expect(detectRoleFamily('Vibes Coordinator')).toBe('unknown');
  });
});

describe('analyzeResumeTitleCoherence', () => {
  it('flags level overshoot when title is Senior but only 1 year experience', () => {
    const result = analyzeResumeTitleCoherence({
      title: 'Senior Frontend Engineer',
      experienceText: '2024.01 ~ 현재 백엔드 개발자',
      experienceYears: 1,
    });
    expect(result.titleLevel).toBe('senior');
    expect(result.mismatch).toBe('level-overshoot');
    expect(result.tone).toBe('warning');
    expect(result.label).toBe('타이틀 과장');
  });

  it('flags role shift when title is engineering but experience is design', () => {
    const result = analyzeResumeTitleCoherence({
      title: 'Senior Frontend Engineer',
      experienceText:
        '2018.01 ~ 2022.12 프로덕트 디자이너로 디자인 시스템을 운영했고 UX 리서치를 진행했습니다.',
      experienceYears: 5,
    });
    expect(result.titleLevel).toBe('senior');
    expect(result.titleRoleFamily).toBe('engineering');
    expect(result.experienceRoleFamily).toBe('design');
    expect(result.mismatch).toBe('role-shift');
    expect(result.tone).toBe('warning');
  });

  it('flags level undershoot when title is Junior but 10 years experience', () => {
    const result = analyzeResumeTitleCoherence({
      title: 'Junior Backend Engineer',
      experienceText: '2014 ~ 현재 백엔드 개발자',
      experienceYears: 10,
    });
    expect(result.mismatch).toBe('level-undershoot');
    expect(result.tone).toBe('warning');
  });

  it('returns coherent when level and role match', () => {
    const result = analyzeResumeTitleCoherence({
      title: '시니어 백엔드 엔지니어',
      experienceText: '2018 ~ 현재 백엔드 개발자로 Node.js, Kotlin 기반 서비스 운영',
      experienceYears: 7,
    });
    expect(result.coherent).toBe(true);
    expect(result.mismatch).toBe('none');
    expect(result.tone).toBe('good');
  });

  it('handles unknown title level gracefully', () => {
    const result = analyzeResumeTitleCoherence({
      title: 'Frontend Engineer',
      experienceText: '백엔드 개발 2020 ~ 현재',
      experienceYears: 4,
    });
    expect(result.mismatch).toBe('level-unknown');
    expect(result.tone).toBe('neutral');
    expect(result.suggestion).toContain('미드');
  });

  it('falls back to estimateExperienceYears when experienceYears is not provided', () => {
    const result = analyzeResumeTitleCoherence({
      title: 'Senior Engineer',
      experienceText: '2019.01 ~ 2024.01 백엔드 엔지니어',
    });
    // 2019.01 -> 2024.01 = ~5 years -> mid; with senior title that's only 1 level away => coherent
    expect(result.experienceYears).toBeGreaterThan(3);
    expect(result.titleLevel).toBe('senior');
  });
});
