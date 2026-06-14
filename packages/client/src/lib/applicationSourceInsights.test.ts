import { describe, expect, it } from 'vitest'

import {
  buildApplicationSourceInsights,
  getApplicationSourceLabel,
} from './applicationSourceInsights'

import type { JobApplication } from './api'

const baseApplication = (overrides: Partial<JobApplication>): JobApplication => ({
  id: overrides.id ?? 'app-1',
  company: overrides.company ?? '테스트컴퍼니',
  position: overrides.position ?? 'Frontend Engineer',
  status: overrides.status ?? 'applied',
  createdAt: overrides.createdAt ?? '2026-05-20T09:00:00Z',
  updatedAt: overrides.updatedAt ?? '2026-05-20T09:00:00Z',
  ...overrides,
})

describe('getApplicationSourceLabel', () => {
  it('normalizes common job board domains into readable source labels', () => {
    expect(
      getApplicationSourceLabel(
        baseApplication({ url: 'https://www.linkedin.com/jobs/view/123?ref=foo' })
      )
    ).toBe('LinkedIn')
    expect(
      getApplicationSourceLabel(
        baseApplication({ url: 'https://boards.greenhouse.io/acme/jobs/1' })
      )
    ).toBe('Greenhouse')
    expect(
      getApplicationSourceLabel(baseApplication({ url: 'https://www.wanted.co.kr/wd/1' }))
    ).toBe('Wanted')
  })

  it('uses direct entry for applications without a job URL', () => {
    expect(getApplicationSourceLabel(baseApplication({ url: '' }))).toBe('직접 입력')
  })
})

describe('buildApplicationSourceInsights', () => {
  it('groups applications by source and calculates response conversion', () => {
    const insights = buildApplicationSourceInsights(
      [
        baseApplication({
          id: 'linkedin-1',
          url: 'https://linkedin.com/jobs/view/1',
          status: 'interview',
        }),
        baseApplication({
          id: 'linkedin-2',
          url: 'https://www.linkedin.com/jobs/view/2',
          status: 'applied',
        }),
        baseApplication({
          id: 'wanted-1',
          url: 'https://wanted.co.kr/wd/3',
          status: 'offer',
        }),
      ],
      new Date('2026-05-27T12:00:00Z')
    )

    const linkedin = insights.sources.find((source) => source.label === 'LinkedIn')
    expect(linkedin?.count).toBe(2)
    expect(linkedin?.responseCount).toBe(1)
    expect(linkedin?.conversionRate).toBe(50)
    expect(insights.bestSource?.label).toBe('Wanted')
  })

  it('surfaces the source with the most stale applications as the risk source', () => {
    const insights = buildApplicationSourceInsights(
      [
        baseApplication({
          id: 'stale-1',
          url: 'https://jobs.lever.co/acme/1',
          status: 'applied',
          updatedAt: '2026-05-01T09:00:00Z',
        }),
        baseApplication({
          id: 'stale-2',
          url: 'https://jobs.lever.co/acme/2',
          status: 'screening',
          updatedAt: '2026-05-05T09:00:00Z',
        }),
        baseApplication({
          id: 'fresh-1',
          url: 'https://www.linkedin.com/jobs/view/1',
          status: 'applied',
          updatedAt: '2026-05-26T09:00:00Z',
        }),
      ],
      new Date('2026-05-27T12:00:00Z')
    )

    expect(insights.riskSource?.label).toBe('Lever')
    expect(insights.riskSource?.staleCount).toBe(2)
    expect(insights.summary).toContain('Lever')
  })
})
