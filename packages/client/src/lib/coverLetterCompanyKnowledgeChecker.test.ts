import { describe, expect, it } from 'vitest'

import { checkCoverLetterCompanyKnowledge } from './coverLetterCompanyKnowledgeChecker'

describe('checkCoverLetterCompanyKnowledge', () => {
  it('returns none for empty text', () => {
    const r = checkCoverLetterCompanyKnowledge('')
    expect(r.depth).toBe('none')
    expect(r.knowledgeSignals.length).toBe(0)
  })

  it('detects product_mention signal', () => {
    const r = checkCoverLetterCompanyKnowledge('귀사의 서비스를 직접 사용해 보며 느꼈습니다.')
    const signal = r.knowledgeSignals.find((s) => s.type === 'product_mention')
    expect(signal).toBeDefined()
  })

  it('detects tech_stack_match from tech blog mention', () => {
    const r = checkCoverLetterCompanyKnowledge(
      '귀사 기술 블로그를 읽으며 MSA 전환 전략에 공감했습니다.'
    )
    const signal = r.knowledgeSignals.find((s) => s.type === 'tech_stack_match')
    expect(signal).toBeDefined()
  })

  it('detects business_context signal', () => {
    const r = checkCoverLetterCompanyKnowledge(
      '귀사의 B2B SaaS 모델은 국내 시장에서 독보적인 포지셔닝입니다.'
    )
    const signal = r.knowledgeSignals.find((s) => s.type === 'business_context')
    expect(signal).toBeDefined()
  })

  it('detects vague generic_best praise', () => {
    const r = checkCoverLetterCompanyKnowledge('귀사는 업계 최고 기업으로 알고 있습니다.')
    const vague = r.vaguePraiseSignals.find((s) => s.type === 'generic_best')
    expect(vague).toBeDefined()
  })

  it('detects hollow_aspiration vague praise', () => {
    const r = checkCoverLetterCompanyKnowledge('귀사의 비전에 공감하며 함께 성장하고 싶습니다.')
    expect(r.vaguePraiseSignals.length).toBeGreaterThan(0)
  })

  it('rates specific for rich knowledge signals', () => {
    const r = checkCoverLetterCompanyKnowledge(
      '귀사 기술 블로그를 읽으며 MSA 도입기를 공부했습니다. 귀사의 서비스를 직접 사용해 보며 느꼈습니다. 경쟁사 대비 차별화 전략을 분석했습니다.'
    )
    expect(r.depth).toBe('specific')
  })

  it('rates generic for many vague signals with no knowledge', () => {
    const r = checkCoverLetterCompanyKnowledge(
      '귀사의 비전에 공감합니다. 최고의 기업이라고 생각합니다. 함께 성장하고 싶습니다.'
    )
    expect(r.depth).toBe('generic')
  })

  it('suggestion is non-empty string', () => {
    const r = checkCoverLetterCompanyKnowledge('평범한 자기소개서 내용입니다.')
    expect(r.suggestion.length).toBeGreaterThan(10)
  })
})
