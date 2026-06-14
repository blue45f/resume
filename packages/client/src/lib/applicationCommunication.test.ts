import { describe, expect, it } from 'vitest'

import { buildStageCommunicationTemplates } from './applicationCommunication'

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

describe('buildStageCommunicationTemplates', () => {
  it('returns application follow-up and withdrawal templates for early active stages', () => {
    // now 미고정 시 실행 시점에 따라 3주 경과 분기(no-response-final-check)가 끼어드는 date-rot — 고정
    const templates = buildStageCommunicationTemplates(
      baseApplication({
        status: 'screening',
        appliedDate: '2026-05-20',
      }),
      new Date('2026-05-27T12:00:00Z')
    )

    expect(templates.map((template) => template.id)).toEqual([
      'application-follow-up',
      'withdrawal',
    ])
    expect(templates[0].subject).toContain('Frontend Engineer 지원 건')
    expect(templates[0].body).toContain('2026.05.20')
  })

  it('prioritizes a final no-response check for applications stale longer than 3 weeks', () => {
    const templates = buildStageCommunicationTemplates(
      baseApplication({
        status: 'screening',
        updatedAt: '2026-04-30T09:00:00Z',
      }),
      new Date('2026-05-27T12:00:00Z')
    )

    expect(templates[0].id).toBe('no-response-final-check')
    expect(templates[0].body).toContain('마지막으로 진행 여부를 확인')
  })

  it('prioritizes thank-you and extra-material templates for interview stages', () => {
    const templates = buildStageCommunicationTemplates(
      baseApplication({
        company: '카카오',
        position: 'Backend Engineer',
        status: 'interview',
        interviewDate: '2026-05-27',
      })
    )

    expect(templates.map((template) => template.id).slice(0, 2)).toEqual([
      'interview-thank-you',
      'interview-materials',
    ])
    expect(templates[0].subject).toContain('Backend Engineer 면접 감사')
    expect(templates[0].body).toContain('카카오')
  })

  it('returns offer discussion templates for offer stage', () => {
    const templates = buildStageCommunicationTemplates(
      baseApplication({
        status: 'offer',
        salary: '7,000만원',
      })
    )

    expect(templates.map((template) => template.id)).toContain('offer-questions')
    expect(templates.find((template) => template.id === 'offer-questions')?.body).toContain(
      '처우와 입사 일정'
    )
  })

  it('returns a relationship-preserving reply for rejected applications', () => {
    const templates = buildStageCommunicationTemplates(baseApplication({ status: 'rejected' }))

    expect(templates).toHaveLength(1)
    expect(templates[0]).toMatchObject({
      id: 'rejection-thank-you',
      tone: 'neutral',
    })
  })
})
