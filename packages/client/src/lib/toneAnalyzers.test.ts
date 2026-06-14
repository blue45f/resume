import { describe, expect, it } from 'vitest'

import {
  analyzeParagraphs,
  analyzeFirstPersonUsage,
  analyzeEnglishMix,
  analyzeSentiment,
} from './toneAnalyzers'

describe('analyzeParagraphs', () => {
  it('returns count=0 for empty', () => {
    const r = analyzeParagraphs('')
    expect(r.count).toBe(0)
    expect(r.suggestion).toContain('비어')
  })

  it('counts paragraphs split by blank lines', () => {
    const text = 'first para 입니다.\n\nsecond para 입니다.\n\nthird para 입니다.'
    const r = analyzeParagraphs(text)
    expect(r.count).toBe(3)
  })

  it('flags long single paragraph', () => {
    const r = analyzeParagraphs('가'.repeat(800))
    expect(r.count).toBe(1)
    expect(r.suggestion).toMatch(/한 문단|분리|긴 문단/)
  })
})

describe('analyzeFirstPersonUsage', () => {
  it('returns no count for empty', () => {
    const r = analyzeFirstPersonUsage('')
    expect(r.total).toBe(0)
    expect(r.level).toBe('low')
  })

  it('counts 1인칭 occurrences', () => {
    const r = analyzeFirstPersonUsage(
      '저는 5년차 개발자입니다. 제가 담당했습니다. 저를 소개합니다.'
    )
    expect(r.counts['저는']).toBe(1)
    expect(r.counts['제가']).toBe(1)
    expect(r.counts['저를']).toBe(1)
    expect(r.total).toBeGreaterThanOrEqual(3)
  })

  it('marks high level for overuse', () => {
    const text = '저는 '.repeat(30) + '개발자입니다.'
    const r = analyzeFirstPersonUsage(text)
    expect(r.level).toBe('high')
  })
})

describe('analyzeEnglishMix', () => {
  it('reports low for Korean-only', () => {
    const r = analyzeEnglishMix('한국어 본문입니다.')
    expect(r.level).toBe('low')
    expect(r.englishRatio).toBe(0)
  })

  it('reports high for English-dominant', () => {
    const r = analyzeEnglishMix('Hello World 한')
    expect(r.level).toBe('high')
  })

  it('returns 0 ratio for empty', () => {
    const r = analyzeEnglishMix('')
    expect(r.englishRatio).toBe(0)
  })
})

describe('analyzeSentiment', () => {
  it('returns none when no sentiment vocab present', () => {
    const r = analyzeSentiment('단어 단어 단어.')
    expect(r.tone).toBe('none')
  })

  it('detects positive tone', () => {
    const r = analyzeSentiment('성장하고 성공했으며 달성한 경험.')
    expect(r.positiveCount).toBeGreaterThan(0)
    expect(['positive', 'balanced']).toContain(r.tone)
  })

  it('detects negative tone', () => {
    const r = analyzeSentiment('실패와 좌절, 어려움과 한계를 겪었습니다.')
    expect(r.negativeCount).toBeGreaterThan(0)
    expect(['negative', 'balanced']).toContain(r.tone)
  })
})
