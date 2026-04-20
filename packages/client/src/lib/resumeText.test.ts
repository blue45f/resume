import { describe, expect, it } from 'vitest';
import { buildResumePlainText } from './resumeText';
import type { Resume } from '@/types/resume';

const baseResume = (): Partial<Resume> => ({
  title: '백엔드 개발자 이력서',
  personalInfo: {
    name: '홍길동',
    email: 'a@b.com',
    phone: '',
    address: '',
    website: '',
    summary: '<p>5년 경력의 백엔드 개발자입니다.</p>',
  },
  experiences: [
    {
      id: '1',
      company: '카카오',
      position: '시니어 엔지니어',
      startDate: '2020-01',
      endDate: '2022-12',
      current: false,
      description: '<p>검색 플랫폼 개발 및 운영</p>',
      achievements: '응답시간 30% 단축',
      techStack: 'Kotlin, Spring',
    },
  ],
  educations: [],
  skills: [{ id: 's1', category: 'Backend', items: 'Java, Kotlin, Spring' }],
  projects: [],
  certifications: [],
  languages: [],
  awards: [],
  activities: [],
});

describe('buildResumePlainText', () => {
  it('returns empty string when input is null/undefined', () => {
    expect(buildResumePlainText(null)).toBe('');
    expect(buildResumePlainText(undefined)).toBe('');
  });

  it('strips HTML from summary and descriptions', () => {
    const out = buildResumePlainText(baseResume());
    expect(out).not.toContain('<p>');
    expect(out).toContain('5년 경력의 백엔드 개발자입니다.');
    expect(out).toContain('검색 플랫폼 개발 및 운영');
  });

  it('serializes experience period in a format the date parser can read', () => {
    const out = buildResumePlainText(baseResume());
    expect(out).toContain('2020.01');
    expect(out).toContain('2022.12');
  });

  it('marks current position with 현재', () => {
    const resume = baseResume();
    resume.experiences![0].current = true;
    resume.experiences![0].endDate = '';
    const out = buildResumePlainText(resume);
    expect(out).toContain('현재');
  });

  it('includes skills and achievements sections', () => {
    const out = buildResumePlainText(baseResume());
    expect(out).toContain('Backend');
    expect(out).toContain('Java, Kotlin, Spring');
    expect(out).toContain('응답시간 30% 단축');
  });
});
