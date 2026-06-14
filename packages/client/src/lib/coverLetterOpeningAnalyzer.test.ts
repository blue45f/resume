import { describe, expect, it } from 'vitest'

import { analyzeCoverLetterOpening } from './coverLetterOpeningAnalyzer'

describe('analyzeCoverLetterOpening', () => {
  it('returns moderate for empty text', () => {
    const r = analyzeCoverLetterOpening('')
    expect(r.firstSentence).toBe('')
  })

  it('detects weak opening starting with 안녕하세요', () => {
    const text = '안녕하세요. 귀사에 지원하게 된 김철수입니다. 열심히 하겠습니다.'
    const r = analyzeCoverLetterOpening(text)
    expect(r.strength).toBe('weak')
    expect(r.hasGenericGreeting).toBe(true)
  })

  it('detects weak opening with multiple clichés', () => {
    const text =
      '안녕하세요. 저는 열정을 다해 귀사에 지원하고 싶은 지원자입니다. 어릴 때부터 꿈꿔왔습니다.'
    const r = analyzeCoverLetterOpening(text)
    expect(r.genericPhrases.length).toBeGreaterThanOrEqual(1)
    expect(['weak', 'moderate']).toContain(r.strength)
    expect(r.hasGenericGreeting).toBe(true)
  })

  it('detects strong opening with metric', () => {
    const text = '5년간 Spring Boot로 DAU 50만 서비스를 개발한 백엔드 개발자입니다.'
    const r = analyzeCoverLetterOpening(text)
    expect(r.hasMetric).toBe(true)
    expect(r.hasSpecificRole).toBe(true)
    expect(r.strength).toBe('strong')
  })

  it('detects strong opening with role but no metric as moderate', () => {
    const text = '프론트엔드 개발자로 다양한 서비스를 개발해왔습니다.'
    const r = analyzeCoverLetterOpening(text)
    expect(r.hasSpecificRole).toBe(true)
    expect(r.hasMetric).toBe(false)
    expect(['moderate', 'strong']).toContain(r.strength)
  })

  it('generic phrases array contains descriptions', () => {
    const text = '안녕하세요. 귀사에 지원하고 싶은 홍길동입니다.'
    const r = analyzeCoverLetterOpening(text)
    expect(r.genericPhrases.length).toBeGreaterThan(0)
    expect(r.genericPhrases[0]).toBeTruthy()
  })

  it('provides non-empty suggestion', () => {
    const text = '어릴 때부터 개발에 관심이 많았습니다.'
    const r = analyzeCoverLetterOpening(text)
    expect(r.suggestion.length).toBeGreaterThan(0)
  })

  it('firstSentence is at most 100 chars', () => {
    const text =
      '저는 항상 성실하게 최선을 다해왔으며 책임감 있는 사람입니다. 여러 프로젝트를 진행했습니다.'
    const r = analyzeCoverLetterOpening(text)
    expect(r.firstSentence.length).toBeLessThanOrEqual(100)
  })
})
