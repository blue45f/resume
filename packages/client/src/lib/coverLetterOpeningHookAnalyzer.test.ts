import { describe, expect, it } from 'vitest'

import { analyzeCoverLetterOpeningHook } from './coverLetterOpeningHookAnalyzer'

describe('analyzeCoverLetterOpeningHook', () => {
  it('returns generic for empty text', () => {
    const r = analyzeCoverLetterOpeningHook('')
    expect(r.grade).toBe('generic')
  })

  it('detects greeting_formula generic signal', () => {
    const r = analyzeCoverLetterOpeningHook(
      '안녕하세요. 귀사에 지원하게 된 동기를 말씀드리겠습니다.'
    )
    const signal = r.genericSignals.find((s) => s.type === 'greeting_formula')
    expect(signal).toBeDefined()
  })

  it('detects motivation_cliche generic signal', () => {
    const r = analyzeCoverLetterOpeningHook(
      '지원하게 된 동기는 다음과 같습니다. 성장하고 싶었기 때문입니다.'
    )
    const signal = r.genericSignals.find((s) => s.type === 'motivation_cliche')
    expect(signal).toBeDefined()
  })

  it('detects data_hook positive signal', () => {
    const r = analyzeCoverLetterOpeningHook('30% 개선이라는 성과를 얻었을 때 저는 확신했습니다.')
    const signal = r.hookSignals.find((s) => s.type === 'data_hook')
    expect(signal).toBeDefined()
  })

  it('detects anecdote_hook signal', () => {
    const r = analyzeCoverLetterOpeningHook(
      '3년 전 첫 직장에서의 장애가 발생했을 때, 저는 처음으로 시스템 설계의 중요성을 깨달았습니다.'
    )
    const signal = r.hookSignals.find((s) => s.type === 'anecdote_hook')
    expect(signal).toBeDefined()
  })

  it('detects achievement_hook signal', () => {
    const r = analyzeCoverLetterOpeningHook(
      '팀 내 최초로 MSA 전환을 제안하고 성공적으로 이끌었던 경험이 있습니다.'
    )
    const signal = r.hookSignals.find((s) => s.type === 'achievement_hook')
    expect(signal).toBeDefined()
  })

  it('grades generic for cliche-heavy opening', () => {
    const r = analyzeCoverLetterOpeningHook(
      '안녕하세요. 지원하게 된 동기는 성장하고 싶어서입니다. 어릴 때부터 꿈이었습니다.'
    )
    expect(r.grade).toBe('generic')
  })

  it('provides suggestions for generic opening', () => {
    const r = analyzeCoverLetterOpeningHook('안녕하세요. 귀사에 지원합니다.')
    expect(r.suggestions.length).toBeGreaterThan(0)
  })

  it('summary is non-empty string', () => {
    const r = analyzeCoverLetterOpeningHook('일반적인 자기소개서 내용입니다.')
    expect(r.summary.length).toBeGreaterThan(10)
  })
})
