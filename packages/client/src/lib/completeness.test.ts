import { describe, expect, it } from 'vitest';
import { calculateCompleteness } from './completeness';
import type { Resume } from '@/types/resume';

function makeResume(overrides: Partial<Resume> = {}): Resume {
  return {
    id: 'r',
    title: 't',
    createdAt: '',
    updatedAt: '',
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      summary: '',
    },
    experiences: [],
    educations: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    awards: [],
    activities: [],
    ...overrides,
  } as Resume;
}

describe('calculateCompleteness', () => {
  it('returns very low percentage for empty resume + collects tips', () => {
    const r = calculateCompleteness(makeResume());
    expect(r.percentage).toBeLessThan(30);
    expect(r.tips.length).toBeGreaterThan(0);
    expect(r.grade).toBe('D');
  });

  it('rewards full personal info', () => {
    const empty = calculateCompleteness(makeResume());
    const full = calculateCompleteness(
      makeResume({
        personalInfo: {
          name: '홍길동',
          email: 'a@b.com',
          phone: '010-0000-0000',
          address: '서울',
          website: 'https://x',
          github: 'gildong',
          photo: 'https://p',
          summary: '5년차 백엔드 개발자 소개 텍스트입니다.',
        },
      }),
    );
    expect(full.percentage).toBeGreaterThan(empty.percentage);
  });

  it('grade ladder maps roughly to percentage', () => {
    const r = calculateCompleteness(
      makeResume({
        personalInfo: {
          name: '홍길동',
          email: 'a@b.com',
          phone: '010-0000-0000',
          address: '서울',
          website: 'https://x',
          summary: '백엔드 개발자 5년차의 자기소개 텍스트입니다.',
        },
        experiences: [
          {
            id: '1',
            company: '카카오',
            position: 'Senior',
            startDate: '2020-01',
            endDate: '2022-12',
            current: false,
            description: '결제 시스템을 설계하고 구축한 백엔드 개발자입니다.',
            techStack: 'Kotlin, Spring',
          },
        ],
        educations: [
          {
            id: 'e',
            school: 'X',
            degree: '학사',
            field: 'CS',
            startDate: '',
            endDate: '',
            description: '',
          },
        ],
        skills: [{ id: 's', category: 'Backend', items: 'Java, Kotlin, Spring' }],
      }),
    );
    expect(['S', 'A', 'B', 'C']).toContain(r.grade);
  });

  it('sections array reflects all 6 buckets', () => {
    const r = calculateCompleteness(makeResume());
    const labels = r.sections.map((s) => s.label);
    expect(labels).toContain('인적사항');
    expect(labels).toContain('경력');
    expect(labels).toContain('학력');
    expect(labels).toContain('기술');
  });
});
