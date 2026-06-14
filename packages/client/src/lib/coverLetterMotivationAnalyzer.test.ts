import { describe, expect, it } from 'vitest'

import { analyzeCoverLetterMotivation } from './coverLetterMotivationAnalyzer'

describe('analyzeCoverLetterMotivation', () => {
  it('returns missing for empty text', () => {
    const r = analyzeCoverLetterMotivation('')
    expect(r.clarity).toBe('missing')
    expect(r.specificCount).toBe(0)
  })

  it('returns missing when no motivation found', () => {
    const r = analyzeCoverLetterMotivation(
      '저는 성실하고 책임감 있는 개발자입니다. 최선을 다하겠습니다.'
    )
    expect(r.clarity).toBe('missing')
  })

  it('detects generic motivation', () => {
    const r = analyzeCoverLetterMotivation(
      '귀사에 지원하게 되었습니다. 평소에 관심이 많았고 성장하고 싶어서 지원했습니다.'
    )
    expect(r.clarity).toBe('generic')
    expect(r.genericCount).toBeGreaterThanOrEqual(1)
  })

  it('detects company-specific motivation', () => {
    const text =
      '귀사의 결제 플랫폼 서비스를 직접 사용하며 UX에 감명받았습니다. 또한 귀사에서 데이터 분석 역량을 통해 기여하고 싶습니다.'
    const r = analyzeCoverLetterMotivation(text)
    expect(r.specificCount).toBeGreaterThanOrEqual(1)
  })

  it('returns specific when 2+ specific signals present', () => {
    const text = `
      귀사의 실시간 배송 추적 서비스를 사용하면서 기술력에 감명받았습니다.
      5년간 쌓아온 백엔드 엔지니어로서의 경험이 이 포지션에서 필요한 역량과 정확히 맞닿습니다.
      귀사의 플랫폼 기술이 해결하려는 문제가 제가 경험한 물류 최적화 과제와 일치합니다.
    `
    const r = analyzeCoverLetterMotivation(text)
    expect(r.specificCount).toBeGreaterThanOrEqual(2)
    expect(r.clarity).toBe('specific')
  })

  it('detects problem-driven motivation', () => {
    const text = '현재 귀사가 겪고 있는 대규모 트래픽 문제를 해결하는 데 기여하고 싶습니다.'
    const r = analyzeCoverLetterMotivation(text)
    expect(r.signals.some((s) => s.type === 'problem_driven')).toBe(true)
  })

  it('provides non-empty suggestion and tip', () => {
    const r = analyzeCoverLetterMotivation('React TypeScript 개발자로 지원합니다.')
    expect(r.suggestion.length).toBeGreaterThan(0)
    expect(r.tip.length).toBeGreaterThan(0)
  })
})
