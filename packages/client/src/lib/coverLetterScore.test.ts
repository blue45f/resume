import { describe, expect, it } from 'vitest'

import { buildCoverLetterScore } from './coverLetterScore'

const STRONG = [
  '귀사의 결제 서비스에 매력을 느껴 지원하게 되었습니다.',
  '저의 강점은 대규모 트래픽을 다루는 백엔드 설계 역량입니다.',
  '이전 프로젝트에서 결제 시스템을 단독으로 개발해 응답 시간을 40% 단축했습니다.',
  '입사 후 결제 안정성을 높이는 데 기여하고 싶습니다. 면접 기회를 주시면 자세히 말씀드리겠습니다.',
].join('\n\n')

describe('buildCoverLetterScore', () => {
  it('returns 4 axes', () => {
    const r = buildCoverLetterScore('내용')
    expect(r.axes.map((a) => a.key)).toEqual(['coverage', 'structure', 'closing', 'tone'])
  })

  it('clamps overall and axes to 0-100', () => {
    const r = buildCoverLetterScore(STRONG)
    expect(r.overall).toBeGreaterThanOrEqual(0)
    expect(r.overall).toBeLessThanOrEqual(100)
    for (const a of r.axes) {
      expect(a.score).toBeGreaterThanOrEqual(0)
      expect(a.score).toBeLessThanOrEqual(100)
    }
  })

  it('scores a strong letter higher than an empty one', () => {
    expect(buildCoverLetterScore(STRONG).overall).toBeGreaterThan(
      buildCoverLetterScore('안녕하세요.').overall
    )
  })

  it('penalizes tone for ex-employer badmouthing', () => {
    const negative = [
      '이전 회사는 비전이 없고 박봉이어서 퇴사했습니다.',
      '상사와도 소통이 안 됐습니다.',
    ].join('\n\n')
    const toneAxis = buildCoverLetterScore(negative).axes.find((a) => a.key === 'tone')
    expect(toneAxis?.score).toBeLessThan(70)
  })

  it('assigns grade consistent with overall', () => {
    const r = buildCoverLetterScore(STRONG)
    const expected =
      r.overall >= 80 ? 'excellent' : r.overall >= 62 ? 'good' : r.overall >= 45 ? 'fair' : 'weak'
    expect(r.grade).toBe(expected)
  })

  it('headline is non-empty', () => {
    expect(buildCoverLetterScore(STRONG).headline.length).toBeGreaterThan(5)
  })
})
