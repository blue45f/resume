import { describe, expect, it } from 'vitest'

import { buildApplicationConcentrationRisks } from './applicationConcentrationRisk'

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

describe('buildApplicationConcentrationRisks', () => {
  it('flags severe same-company concentration at 8 or more applications', () => {
    const applications = Array.from({ length: 8 }, (_, index) =>
      baseApplication({
        id: `same-${index}`,
        company: '카카오',
        position: `Backend Engineer ${index}`,
      })
    )

    const result = buildApplicationConcentrationRisks(applications)

    expect(result.risks[0]).toMatchObject({
      company: '카카오',
      count: 8,
      level: 'severe',
    })
    expect(result.summary).toContain('카카오')
  })

  it('detects duplicate applications for the same company and role', () => {
    const result = buildApplicationConcentrationRisks([
      baseApplication({ id: 'first', company: '라인', position: 'Data Analyst' }),
      baseApplication({ id: 'second', company: '라인 ', position: 'data analyst' }),
      baseApplication({ id: 'third', company: '네이버', position: 'Data Analyst' }),
    ])

    expect(result.duplicates).toHaveLength(1)
    expect(result.duplicates[0]).toMatchObject({
      company: '라인',
      position: 'Data Analyst',
      count: 2,
    })
  })

  it('does not flag normal spread across different companies', () => {
    const result = buildApplicationConcentrationRisks([
      baseApplication({ id: 'a', company: '토스', position: 'Frontend Engineer' }),
      baseApplication({ id: 'b', company: '라인', position: 'Data Analyst' }),
      baseApplication({ id: 'c', company: '네이버', position: 'Product Manager' }),
    ])

    expect(result.risks).toEqual([])
    expect(result.duplicates).toEqual([])
    expect(result.summary).toContain('분산')
  })
})
