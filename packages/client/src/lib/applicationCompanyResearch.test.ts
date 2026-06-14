import { describe, expect, it } from 'vitest'

import { buildCompanyResearchBrief } from './applicationCompanyResearch'

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

describe('buildCompanyResearchBrief', () => {
  it('builds search links scoped to the company and role', () => {
    const brief = buildCompanyResearchBrief(
      baseApplication({
        company: '라인 플러스',
        position: 'Data Analyst',
      })
    )

    expect(brief.links.map((link) => link.label)).toEqual([
      '회사 뉴스',
      '채용/팀 정보',
      '면접 후기',
    ])
    expect(decodeURIComponent(brief.links[0].url)).toContain('라인 플러스 최근 뉴스')
    expect(decodeURIComponent(brief.links[1].url)).toContain('라인 플러스 Data Analyst 채용 팀')
  })

  it('scores company research higher when notes include company signals and saved posting context', () => {
    const brief = buildCompanyResearchBrief(
      baseApplication({
        url: 'https://jobs.example.com/line/data',
        location: '서울',
        notes:
          'JD 저장 완료. 회사 제품, 최근 투자 뉴스, 조직 문화, 경쟁사, 팀 목표, 면접 질문까지 정리했습니다.',
      })
    )

    expect(brief.score).toBeGreaterThanOrEqual(80)
    expect(brief.grade).toBe('strong')
    expect(brief.checks.every((check) => check.complete)).toBe(true)
  })

  it('surfaces missing research actions when notes are empty', () => {
    const brief = buildCompanyResearchBrief(baseApplication({ notes: '', url: '' }))

    expect(brief.grade).toBe('thin')
    expect(brief.nextAction).toContain('공고 원문')
    expect(brief.checks.filter((check) => !check.complete).map((check) => check.id)).toEqual(
      expect.arrayContaining(['posting-context', 'company-signals', 'interview-angles'])
    )
  })
})
