import { describe, expect, it } from 'vitest'

import {
  analyzeParallelism,
  analyzeBulletMarkerConsistency,
  analyzePunctuationBalance,
} from './bulletStructure'

describe('analyzeParallelism', () => {
  it('reports insufficient when too few bullet lines', () => {
    const r = analyzeParallelism('- one\n- two')
    expect(r.suggestion).toMatch(/부족|제한적/)
  })

  it('marks consistency high when all bullets use 합니다체', () => {
    const text = ['- 설계했습니다.', '- 구현했습니다.', '- 배포했습니다.', '- 운영했습니다.'].join(
      '\n'
    )
    const r = analyzeParallelism(text)
    expect(r.consistency).toBeGreaterThanOrEqual(85)
  })

  it('lowers consistency when bullets mix styles', () => {
    const text = ['- 설계함', '- 구현했습니다.', '- 배포했다.', '- 운영하기'].join('\n')
    const r = analyzeParallelism(text)
    expect(r.consistency).toBeLessThan(85)
  })
})

describe('analyzeBulletMarkerConsistency', () => {
  it('returns empty when no bullets', () => {
    const r = analyzeBulletMarkerConsistency('일반 텍스트입니다.')
    expect(r.markers).toHaveLength(0)
    expect(r.suggestion).toContain('감지되지')
  })

  it('marks consistent when only one marker used', () => {
    const r = analyzeBulletMarkerConsistency('- one\n- two\n- three')
    expect(r.consistent).toBe(true)
    expect(r.dominant).toBe('-')
  })

  it('marks inconsistent when markers mixed', () => {
    const r = analyzeBulletMarkerConsistency('- one\n• two\n* three')
    expect(r.consistent).toBe(false)
    expect(r.distinct).toBeGreaterThanOrEqual(3)
  })
})

describe('analyzePunctuationBalance', () => {
  it('returns no signals for empty text', () => {
    const r = analyzePunctuationBalance('')
    expect(r.total).toBe(0)
  })

  it('flags excessive exclamations', () => {
    const r = analyzePunctuationBalance('대단하다! 멋지다! 최고! 굉장하다!')
    expect(r.exclamations).toBeGreaterThanOrEqual(4)
    expect(r.suggestion).toMatch(/느낌표/)
  })

  it('counts periods and commas', () => {
    const r = analyzePunctuationBalance('첫 번째 문장입니다, 그리고 두 번째 문장입니다.')
    expect(r.periods).toBeGreaterThanOrEqual(1)
    expect(r.commas).toBeGreaterThanOrEqual(1)
  })
})
