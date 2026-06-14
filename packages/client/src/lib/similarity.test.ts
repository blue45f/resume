import { describe, expect, it } from 'vitest'

import { findDuplicates } from './similarity'

import type { Resume } from '@/types/resume'

function makeResume(overrides: Partial<Resume> = {}): Resume {
  return {
    id: 'r1',
    title: '테스트 이력서',
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
  } as Resume
}

describe('findDuplicates', () => {
  it('returns no issues for empty resume', () => {
    expect(findDuplicates(makeResume())).toEqual([])
  })

  it('detects duplicate experience descriptions', () => {
    const desc = '결제 시스템을 설계하고 트래픽을 30% 개선했습니다.'
    const r = makeResume({
      experiences: [
        {
          id: '1',
          company: 'A사',
          position: 'BE',
          startDate: '',
          endDate: '',
          current: false,
          description: desc,
          achievements: '',
          techStack: '',
        },
        {
          id: '2',
          company: 'B사',
          position: 'BE',
          startDate: '',
          endDate: '',
          current: false,
          description: desc,
          achievements: '',
          techStack: '',
        },
      ],
    })
    const issues = findDuplicates(r)
    expect(issues.length).toBeGreaterThan(0)
    expect(issues[0].section).toBe('경력')
    expect(issues[0].similarity).toBeGreaterThanOrEqual(60)
  })

  it('does not flag short / dissimilar descriptions', () => {
    const r = makeResume({
      experiences: [
        {
          id: '1',
          company: 'A',
          position: 'p',
          startDate: '',
          endDate: '',
          current: false,
          description: '짧음',
          achievements: '',
          techStack: '',
        },
        {
          id: '2',
          company: 'B',
          position: 'p',
          startDate: '',
          endDate: '',
          current: false,
          description: '완전히 다른 내용입니다.',
          achievements: '',
          techStack: '',
        },
      ],
    })
    expect(findDuplicates(r)).toEqual([])
  })
})
