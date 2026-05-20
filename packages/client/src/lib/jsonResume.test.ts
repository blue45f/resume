import { describe, expect, it } from 'vitest';
import { buildJsonResume } from './jsonResume';
import type { Resume } from '@/types/resume';

function makeResume(): Resume {
  return {
    id: 'r',
    title: '백엔드 개발자',
    createdAt: '',
    updatedAt: '',
    personalInfo: {
      name: '홍길동',
      email: 'a@b.com',
      phone: '010-1234-5678',
      address: '서울',
      website: 'https://example.com',
      summary: '<p>5년차 백엔드 개발자입니다.</p>',
      github: 'gildong',
    },
    experiences: [
      {
        id: '1',
        company: '카카오',
        position: 'Senior',
        startDate: '2020-01',
        endDate: '',
        current: true,
        description: '<p>결제 시스템 개발</p>',
        techStack: 'Kotlin, Spring',
      },
    ],
    educations: [
      {
        id: 'e1',
        school: 'KAIST',
        degree: '학사',
        field: '컴퓨터공학',
        gpa: '4.0',
        startDate: '2014',
        endDate: '2018',
        description: '',
      },
    ],
    skills: [{ id: 's1', category: 'Backend', items: 'Java, Kotlin, Spring' }],
    projects: [],
    certifications: [],
    languages: [],
    awards: [],
    activities: [],
  };
}

describe('buildJsonResume', () => {
  it('maps basic identity fields', () => {
    const json = buildJsonResume(makeResume());
    expect(json.basics.name).toBe('홍길동');
    expect(json.basics.email).toBe('a@b.com');
    expect(json.basics.phone).toBe('010-1234-5678');
  });

  it('includes label from current position', () => {
    const json = buildJsonResume(makeResume());
    expect(json.basics.label).toBe('Senior');
  });

  it('adds GitHub profile when github username present', () => {
    const json = buildJsonResume(makeResume());
    const github = json.basics.profiles?.find((p) => p.network === 'GitHub');
    expect(github).toBeDefined();
    expect(github?.url).toContain('github.com/gildong');
  });

  it('maps experiences to work[]', () => {
    const json = buildJsonResume(makeResume());
    expect(json.work?.[0].name).toBe('카카오');
    expect(json.work?.[0].position).toBe('Senior');
  });

  it('maps educations to education[]', () => {
    const json = buildJsonResume(makeResume());
    expect(json.education?.[0].institution).toBe('KAIST');
  });

  it('honors options.canonical in meta', () => {
    const json = buildJsonResume(makeResume(), { canonical: 'https://x/y' });
    expect(json.meta?.canonical).toBe('https://x/y');
  });
});
