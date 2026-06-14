import { describe, expect, it } from 'vitest'

import { checkCoverLetterStarPattern } from './coverLetterStarPatternChecker'

describe('checkCoverLetterStarPattern', () => {
  it('returns absent for empty text', () => {
    const r = checkCoverLetterStarPattern('')
    expect(r.grade).toBe('absent')
    expect(r.foundElements).toHaveLength(0)
    expect(r.missingElements).toHaveLength(4)
  })

  it('detects situation — 당시 배경', () => {
    const r = checkCoverLetterStarPattern(
      '당시 팀 내에서 신규 기능 개발이 지연되는 문제가 있었습니다.'
    )
    expect(r.foundElements).toContain('situation')
  })

  it('detects task — 저는 담당', () => {
    const r = checkCoverLetterStarPattern('저는 백엔드 API 개발을 담당하게 되었습니다.')
    expect(r.foundElements).toContain('task')
  })

  it('detects action — 이를 위해 직접 구현', () => {
    const r = checkCoverLetterStarPattern(
      '이를 위해 저는 캐싱 레이어를 직접 설계하고 구현했습니다.'
    )
    expect(r.foundElements).toContain('action')
  })

  it('detects result — percentage improvement', () => {
    const r = checkCoverLetterStarPattern('그 결과 응답 속도 40% 향상을 달성했습니다.')
    expect(r.foundElements).toContain('result')
  })

  it('detects result — numeric metric', () => {
    const r = checkCoverLetterStarPattern('매출 3,000만 원 증가를 달성했습니다.')
    expect(r.foundElements).toContain('result')
  })

  it('grades strong for full STAR', () => {
    const text = [
      '당시 팀 내에서 성능 이슈가 있었습니다.',
      '저는 백엔드 최적화 업무를 담당했습니다.',
      '이를 위해 저는 캐시 도입을 직접 진행했습니다.',
      '그 결과 응답 속도 40% 향상을 달성했습니다.',
    ].join(' ')
    const r = checkCoverLetterStarPattern(text)
    expect(r.grade).toBe('strong')
    expect(r.foundElements).toHaveLength(4)
    expect(r.missingElements).toHaveLength(0)
  })

  it('grades partial for 2-3 elements', () => {
    const text = '이를 위해 저는 직접 설계했습니다. 결과적으로 비용 30% 절감을 달성했습니다.'
    const r = checkCoverLetterStarPattern(text)
    expect(['partial']).toContain(r.grade)
  })

  it('grades weak for 1 element', () => {
    const r = checkCoverLetterStarPattern('저는 API 개발을 담당했습니다.')
    expect(r.grade).toBe('weak')
  })

  it('missing elements are identified correctly', () => {
    const r = checkCoverLetterStarPattern('당시 상황에서 저는 역할을 담당했습니다.')
    expect(r.missingElements).toContain('action')
    expect(r.missingElements).toContain('result')
  })

  it('tips cover missing elements', () => {
    const r = checkCoverLetterStarPattern('저는 API 개발을 담당했습니다.')
    expect(r.tips.some((t) => t.includes('배경'))).toBe(true)
    expect(r.tips.some((t) => t.includes('결과'))).toBe(true)
  })

  it('summary is non-empty', () => {
    const r = checkCoverLetterStarPattern('일반 텍스트')
    expect(r.summary.length).toBeGreaterThan(5)
  })
})
