import { describe, expect, it } from 'vitest'

import { buildApplicationWeeklyPlan } from './applicationWeeklyPlan'

import type { JobApplication } from './api'

const baseApplication = (overrides: Partial<JobApplication>): JobApplication => ({
  id: overrides.id ?? 'app-1',
  company: overrides.company ?? '토스',
  position: overrides.position ?? 'Frontend Engineer',
  status: overrides.status ?? 'applied',
  createdAt: overrides.createdAt ?? '2026-05-20T09:00:00Z',
  updatedAt: overrides.updatedAt ?? '2026-05-20T09:00:00Z',
  ...overrides,
})

describe('buildApplicationWeeklyPlan', () => {
  it('prioritizes upcoming interviews as the weekly focus', () => {
    const plan = buildApplicationWeeklyPlan(
      [
        baseApplication({
          id: 'interview',
          status: 'interview',
          interviewDate: '2026-05-29',
        }),
      ],
      new Date('2026-05-27T12:00:00Z')
    )

    expect(plan.focus).toContain('면접')
    expect(plan.cards.find((card) => card.id === 'interviews')?.current).toBe(1)
  })

  it('separates stale follow-ups from no-response close-outs', () => {
    const plan = buildApplicationWeeklyPlan(
      [
        baseApplication({
          id: 'follow-up',
          updatedAt: '2026-05-15T09:00:00Z',
        }),
        baseApplication({
          id: 'close-out',
          status: 'screening',
          updatedAt: '2026-04-30T09:00:00Z',
        }),
      ],
      new Date('2026-05-27T12:00:00Z')
    )

    expect(plan.cards.find((card) => card.id === 'followUps')?.current).toBe(1)
    expect(plan.cards.find((card) => card.id === 'closeOuts')?.current).toBe(1)
  })

  it('recommends quality applications when weekly application cadence is low', () => {
    const plan = buildApplicationWeeklyPlan(
      [
        baseApplication({
          id: 'old',
          appliedDate: '2026-05-01',
          createdAt: '2026-05-01T09:00:00Z',
          updatedAt: '2026-05-25T09:00:00Z', // 2 days ago — not stale, not in followUps
        }),
      ],
      new Date('2026-05-27T12:00:00Z')
    )

    expect(plan.cards.find((card) => card.id === 'qualityApplications')?.remaining).toBe(3)
    expect(plan.focus).toContain('맞춤 지원')
  })

  it('surfaces networking when active priority applications have no contact hints', () => {
    const plan = buildApplicationWeeklyPlan(
      [
        baseApplication({
          id: 'priority',
          priority: 'high',
          notes: 'JD 키워드만 정리',
        }),
      ],
      new Date('2026-05-27T12:00:00Z')
    )

    expect(plan.cards.find((card) => card.id === 'networking')?.current).toBe(1)
  })
})
