import { describe, expect, it } from 'vitest'

import { scoreApplicationReadiness } from './applicationReadinessScore'

import type { JobApplication } from './api'

const baseApplication = (overrides: Partial<JobApplication>): JobApplication => ({
  id: overrides.id ?? 'app-1',
  company: overrides.company ?? '토스',
  position: overrides.position ?? 'Frontend Engineer',
  status: overrides.status ?? 'applied',
  createdAt: overrides.createdAt ?? '2026-05-20T09:00:00Z',
  updatedAt: overrides.updatedAt ?? '2026-05-26T09:00:00Z',
  ...overrides,
})

describe('scoreApplicationReadiness', () => {
  it('marks a fully prepared interview application as ready', () => {
    const readiness = scoreApplicationReadiness(
      baseApplication({
        url: 'https://www.linkedin.com/jobs/view/123',
        resumeId: 'resume-1',
        notes:
          'Recruiter: jane@company.com. JD 핵심 키워드: React, TypeScript, 성능 최적화, 실험 설계, 협업.',
        priority: 'high',
        deadline: '2026-05-31',
        status: 'interview',
        interviewDate: '2026-05-28',
      }),
      new Date('2026-05-27T12:00:00Z')
    )

    expect(readiness.grade).toBe('ready')
    expect(readiness.score).toBe(100)
    expect(readiness.blockingItems).toEqual([])
  })

  it('flags missing job context and tailored resume as blockers', () => {
    const readiness = scoreApplicationReadiness(
      baseApplication({
        url: '',
        notes: '',
        resumeId: '',
      }),
      new Date('2026-05-27T12:00:00Z')
    )

    expect(readiness.grade).toBe('blocked')
    expect(readiness.blockingItems.map((item) => item.id)).toEqual(
      expect.arrayContaining(['job-context', 'resume'])
    )
  })

  it('penalizes stale active applications without follow-up evidence', () => {
    const readiness = scoreApplicationReadiness(
      baseApplication({
        url: 'https://wanted.co.kr/wd/1',
        resumeId: 'resume-1',
        updatedAt: '2026-05-01T09:00:00Z',
      }),
      new Date('2026-05-27T12:00:00Z')
    )

    expect(readiness.checks.find((check) => check.id === 'follow-up')?.complete).toBe(false)
    expect(readiness.nextAction).toContain('후속')
  })

  it('does not require follow-up freshness for terminal applications', () => {
    const readiness = scoreApplicationReadiness(
      baseApplication({
        status: 'rejected',
        updatedAt: '2026-05-01T09:00:00Z',
      }),
      new Date('2026-05-27T12:00:00Z')
    )

    expect(readiness.checks.find((check) => check.id === 'follow-up')?.complete).toBe(true)
  })
})
