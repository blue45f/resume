import { describe, expect, it } from 'vitest'

import {
  suggestVerbReplacements,
  suggestSynonyms,
  suggestSynonymsForOveruse,
} from './wordSuggestions'

describe('suggestVerbReplacements', () => {
  it('returns empty for text with no weak verbs', () => {
    const r = suggestVerbReplacements('기술 스택: Java, Spring Boot')
    expect(r).toHaveLength(0)
  })

  it('detects weak verb 담당', () => {
    const r = suggestVerbReplacements('백엔드 API 개발을 담당했습니다.')
    expect(r.some((s) => s.weak === '담당')).toBe(true)
  })

  it('provides alternatives for each hit', () => {
    const r = suggestVerbReplacements('업무를 담당하고 프로젝트에 참여했습니다.')
    for (const hit of r) {
      expect(hit.alternatives.length).toBeGreaterThan(0)
    }
  })

  it('results are sorted by index', () => {
    const r = suggestVerbReplacements('참여하고 담당하였습니다.')
    for (let i = 1; i < r.length; i++) {
      expect(r[i].index).toBeGreaterThanOrEqual(r[i - 1].index)
    }
  })

  it('caps at 40 results', () => {
    const text = Array(50).fill('담당 참여 수행').join(' ')
    const r = suggestVerbReplacements(text)
    expect(r.length).toBeLessThanOrEqual(40)
  })
})

describe('suggestSynonyms', () => {
  it('returns word with alternatives for known word 개발', () => {
    const r = suggestSynonyms('개발')
    expect(r.word).toBe('개발')
    expect(r.alternatives.length).toBeGreaterThan(0)
  })

  it('returns empty alternatives for unknown word', () => {
    const r = suggestSynonyms('알수없는단어xyz')
    expect(r.alternatives).toHaveLength(0)
  })
})

describe('suggestSynonymsForOveruse', () => {
  it('returns empty when no words reach minCount', () => {
    const r = suggestSynonymsForOveruse('개발 구현 설계', 3)
    expect(r).toHaveLength(0)
  })

  it('detects overuse of 개발 when repeated 3+ times', () => {
    const r = suggestSynonymsForOveruse('개발 개발 개발 구현', 3)
    expect(r.some((s) => s.word === '개발')).toBe(true)
  })

  it('includes alternatives for overused words', () => {
    const r = suggestSynonymsForOveruse('개발 개발 개발 협업 협업 협업', 3)
    for (const item of r) {
      expect(item.alternatives.length).toBeGreaterThan(0)
    }
  })

  it('sorted by count descending', () => {
    const r = suggestSynonymsForOveruse('개발 개발 개발 개발 협업 협업 협업', 3)
    for (let i = 1; i < r.length; i++) {
      expect(r[i].count).toBeLessThanOrEqual(r[i - 1].count)
    }
  })
})
