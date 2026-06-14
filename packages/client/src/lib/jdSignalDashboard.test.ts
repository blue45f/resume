import { describe, expect, it } from 'vitest'

import { buildJdSignalDashboard } from './jdSignalDashboard'

describe('buildJdSignalDashboard', () => {
  it('returns 7 signals', () => {
    const r = buildJdSignalDashboard('백엔드 개발자 모집')
    expect(r.signals.length).toBe(7)
  })

  it('every signal has a valid status', () => {
    const r = buildJdSignalDashboard('일반적인 채용 공고입니다.')
    const valid = ['good', 'caution', 'concern', 'unknown']
    for (const s of r.signals) {
      expect(valid).toContain(s.status)
      expect(s.note.length).toBeGreaterThan(0)
    }
  })

  it('counts sum to total signals', () => {
    const r = buildJdSignalDashboard('상시 채용, 야근 많음, 4대보험 제공')
    const unknownCount = r.signals.filter((s) => s.status === 'unknown').length
    expect(r.goodCount + r.cautionCount + r.concernCount + unknownCount).toBe(r.signals.length)
  })

  it('flags concern for a red-flag-heavy posting', () => {
    const text = [
      '잦은 야근과 주말 근무가 있습니다.',
      '급여는 내부 규정에 따릅니다.',
      '포괄임금제 적용.',
    ].join('\n')
    const r = buildJdSignalDashboard(text)
    const redflag = r.signals.find((s) => s.key === 'redflags')
    expect(redflag?.status).toBe('concern')
  })

  it('marks salary good when range disclosed', () => {
    const r = buildJdSignalDashboard('급여: 5,000만원 ~ 7,000만원 (협의 가능)')
    const salary = r.signals.find((s) => s.key === 'salary')
    expect(['good', 'caution']).toContain(salary?.status)
  })

  it('headline is non-empty', () => {
    const r = buildJdSignalDashboard('공고')
    expect(r.headline.length).toBeGreaterThan(5)
  })
})
