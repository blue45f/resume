import { describe, expect, it } from 'vitest'

import { checkResumeContributionClarity } from './resumeContributionClarityChecker'

describe('checkResumeContributionClarity', () => {
  it('returns clear for action-verb resume without collective pronouns', () => {
    const text = '결제 API 설계 및 개발. 데이터베이스 스키마 최적화. 배포 자동화 구축.'
    const r = checkResumeContributionClarity(text)
    expect(r.clarity).toBe('clear')
  })

  it('flags unclear when collective dominates', () => {
    const text = [
      '우리 팀이 결제 시스템을 개발했습니다.',
      '저희가 함께 성능을 개선했습니다.',
      '팀에서 다같이 배포를 자동화했습니다.',
    ].join('\n')
    const r = checkResumeContributionClarity(text)
    expect(r.clarity).toBe('unclear')
    expect(r.collectiveCount).toBeGreaterThanOrEqual(3)
  })

  it('returns clear when individual ownership is explicit', () => {
    const text = [
      '제가 결제 모듈을 단독으로 개발했습니다.',
      '직접 성능을 개선했고 주도적으로 배포를 자동화했습니다.',
      '우리 팀과 협업하여 출시했습니다.',
    ].join('\n')
    const r = checkResumeContributionClarity(text)
    expect(r.ownershipRatio).toBeGreaterThanOrEqual(50)
    expect(r.clarity).toBe('clear')
  })

  it('grades mixed for partial individual ownership', () => {
    const text = [
      '우리 팀이 결제 시스템을 만들었고, 저희가 함께 개선했습니다.',
      '팀에서 운영했으며, 제가 일부 모듈을 담당했습니다.',
    ].join('\n')
    const r = checkResumeContributionClarity(text)
    expect(['mixed', 'unclear']).toContain(r.clarity)
  })

  it('counts individual markers', () => {
    const r = checkResumeContributionClarity('제가 직접 주도적으로 개발했습니다.')
    expect(r.individualCount).toBeGreaterThanOrEqual(3)
  })

  it('collects collective examples', () => {
    const text = '우리 팀이 개발했습니다.\n저희가 운영했습니다.'
    const r = checkResumeContributionClarity(text)
    expect(r.collectiveExamples.length).toBeGreaterThan(0)
  })

  it('treats single collective mention as clear (low ambiguity)', () => {
    const text = '결제 시스템을 설계했습니다. 팀과 협업하여 출시했습니다.'
    const r = checkResumeContributionClarity(text)
    expect(r.clarity).toBe('clear')
  })

  it('summary and suggestions present when not clear', () => {
    const text = ['우리 팀이 개발', '저희가 운영', '팀에서 함께 배포', '다같이 개선'].join('\n')
    const r = checkResumeContributionClarity(text)
    expect(r.summary.length).toBeGreaterThan(5)
    expect(r.suggestions.length).toBeGreaterThan(0)
  })
})
