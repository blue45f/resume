import { describe, expect, it } from 'vitest'

import { detectJdResponsibilityVagueness } from './jdResponsibilityVaguenessDetector'

describe('detectJdResponsibilityVagueness', () => {
  it('returns clear for well-defined responsibilities', () => {
    const text = [
      '담당업무',
      '- 결제 API 설계 및 개발',
      '- 데이터베이스 스키마 최적화',
      '- 코드 리뷰 및 배포 자동화',
    ].join('\n')
    const r = detectJdResponsibilityVagueness(text)
    expect(r.clarity).toBe('clear')
    expect(r.count).toBe(0)
  })

  it('detects catch-all phrasing', () => {
    const r = detectJdResponsibilityVagueness('- 기타 등등의 업무 수행')
    expect(r.matches.some((m) => m.type === 'catch_all')).toBe(true)
  })

  it('detects on-demand phrasing', () => {
    const r = detectJdResponsibilityVagueness('- 필요 시 타 부서 업무 지원')
    expect(r.matches.some((m) => m.type === 'on_demand')).toBe(true)
  })

  it('detects broad generic phrasing', () => {
    const r = detectJdResponsibilityVagueness('- 회사 전반의 운영 업무')
    expect(r.matches.some((m) => m.type === 'broad_generic')).toBe(true)
  })

  it('detects undefined misc phrasing', () => {
    const r = detectJdResponsibilityVagueness('- 그때그때 발생하는 업무 처리')
    expect(r.matches.some((m) => m.type === 'undefined_misc')).toBe(true)
  })

  it('grades vague when 3+ matches', () => {
    const text = ['- 기타 업무', '- 필요 시 지원', '- 회사 전반 관리', '- 그때그때 발생 업무'].join(
      '\n'
    )
    const r = detectJdResponsibilityVagueness(text)
    expect(r.clarity).toBe('vague')
  })

  it('grades some when 1-2 matches', () => {
    const r = detectJdResponsibilityVagueness('- 결제 개발\n- 기타 업무')
    expect(r.clarity).toBe('some')
  })

  it('summary and tips present when not clear', () => {
    const r = detectJdResponsibilityVagueness('- 잡무 및 제반 업무')
    expect(r.summary.length).toBeGreaterThan(5)
    expect(r.tips.length).toBeGreaterThan(0)
  })
})
