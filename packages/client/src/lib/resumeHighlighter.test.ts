import { describe, expect, it } from 'vitest'

import { highlightResume } from './resumeHighlighter'

describe('highlightResume', () => {
  it('returns a single plain token for plain text', () => {
    const r = highlightResume('평범한 문장입니다')
    expect(r.tokens.every((t) => t.category === null)).toBe(true)
    expect(r.counts.metric).toBe(0)
  })

  it('highlights metrics', () => {
    const r = highlightResume('매출을 40% 증가시켰습니다.')
    expect(r.counts.metric).toBeGreaterThanOrEqual(1)
    expect(r.tokens.some((t) => t.category === 'metric' && t.text.includes('40%'))).toBe(true)
  })

  it('highlights strong verbs', () => {
    const r = highlightResume('결제 시스템을 구축하고 성능을 개선했습니다.')
    expect(r.counts.strongVerb).toBeGreaterThanOrEqual(1)
  })

  it('highlights filler phrases', () => {
    const r = highlightResume('다양한 업무를 열심히 수행했습니다.')
    expect(r.counts.filler).toBeGreaterThanOrEqual(1)
  })

  it('reconstructs the original text from tokens', () => {
    const text = '제가 결제 모듈을 구축하여 응답시간을 30% 단축했습니다. 다양한 경험.'
    const r = highlightResume(text)
    expect(r.tokens.map((t) => t.text).join('')).toBe(text)
  })

  it('produces non-overlapping tokens in order', () => {
    const text = '주도적으로 2억 원 규모 프로젝트를 개선했습니다.'
    const r = highlightResume(text)
    // Joined tokens equal source → implies no overlap/gap.
    expect(r.tokens.map((t) => t.text).join('')).toBe(text)
  })

  it('truncates very long text', () => {
    const long = '가'.repeat(2000)
    const r = highlightResume(long)
    expect(r.truncated).toBe(true)
    expect(r.tokens.map((t) => t.text).join('').length).toBeLessThanOrEqual(1500)
  })
})
