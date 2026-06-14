import { describe, expect, it } from 'vitest'

import { extractJdHiringProcess } from './jdHiringProcessExtractor'

describe('extractJdHiringProcess', () => {
  it('returns none when no process described', () => {
    const r = extractJdHiringProcess('백엔드 개발자를 모집합니다. Java 경력 3년 이상.')
    expect(r.clarity).toBe('none')
    expect(r.stages.length).toBe(0)
  })

  it('extracts a full pipeline in canonical order', () => {
    const text = '전형절차: 서류 전형 → 코딩 테스트 → 1차 면접 → 2차 면접 → 처우 협의'
    const r = extractJdHiringProcess(text)
    expect(r.clarity).toBe('detailed')
    expect(r.stages[0]).toBe('document')
    expect(r.stages[r.stages.length - 1]).toBe('offer')
    expect(r.pipeline).toContain('서류 전형')
    expect(r.pipeline).toContain('처우 협의')
  })

  it('detects coding test flag', () => {
    const r = extractJdHiringProcess('서류 검토 후 온라인 코딩 테스트를 진행합니다.')
    expect(r.hasCodingTest).toBe(true)
    expect(r.tips.some((t) => t.includes('알고리즘'))).toBe(true)
  })

  it('detects assignment flag', () => {
    const r = extractJdHiringProcess('사전 과제 제출 후 면접을 진행합니다.')
    expect(r.hasAssignment).toBe(true)
  })

  it('detects reference check flag', () => {
    const r = extractJdHiringProcess('최종 면접 후 평판 조회를 진행합니다.')
    expect(r.hasReferenceCheck).toBe(true)
  })

  it('counts interview rounds', () => {
    const text = '1차 면접, 2차 면접, 최종 면접으로 진행됩니다.'
    const r = extractJdHiringProcess(text)
    expect(r.roundCount).toBeGreaterThanOrEqual(3)
  })

  it('orders stages canonically regardless of mention order', () => {
    const text = '2차 면접과 1차 면접, 그리고 서류 전형이 있습니다.'
    const r = extractJdHiringProcess(text)
    const docIdx = r.stages.indexOf('document')
    const firstIdx = r.stages.indexOf('first')
    const secondIdx = r.stages.indexOf('second')
    expect(docIdx).toBeLessThan(firstIdx)
    expect(firstIdx).toBeLessThan(secondIdx)
  })

  it('summary is non-empty', () => {
    const r = extractJdHiringProcess('일반 공고')
    expect(r.summary.length).toBeGreaterThan(5)
  })
})
