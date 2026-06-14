import { describe, expect, it } from 'vitest'

import { analyzeJdTeamStructure } from './jdTeamStructureAnalyzer'

describe('analyzeJdTeamStructure', () => {
  it('returns opaque for text without team info', () => {
    const r = analyzeJdTeamStructure('백엔드 개발자를 모집합니다. Java 경력 3년 이상.')
    expect(r.clarity).toBe('opaque')
    expect(r.questions.length).toBeGreaterThan(0)
  })

  it('detects team size', () => {
    const r = analyzeJdTeamStructure('총 8명 규모의 개발팀에서 함께 일합니다.')
    expect(r.presentTypes).toContain('team_size')
  })

  it('detects reporting line', () => {
    const r = analyzeJdTeamStructure('이 포지션은 CTO 직속으로 보고합니다.')
    expect(r.presentTypes).toContain('reporting_line')
  })

  it('detects collaboration', () => {
    const r = analyzeJdTeamStructure('기획, 디자인 등 유관 부서와 협업합니다.')
    expect(r.presentTypes).toContain('collaboration')
  })

  it('grades detailed when 3+ signals present', () => {
    const text = [
      '팀 규모: 10명 내외',
      '직속 상사: 엔지니어링 리드에게 보고',
      '팀 구성: 백엔드 4명, 프론트 3명',
      '협업 부서: 프로덕트, 디자인',
    ].join('\n')
    const r = analyzeJdTeamStructure(text)
    expect(r.clarity).toBe('detailed')
  })

  it('grades partial when 1-2 signals', () => {
    const r = analyzeJdTeamStructure('5명 규모 팀입니다.')
    expect(r.clarity).toBe('partial')
  })

  it('suggests questions only for missing pieces', () => {
    const r = analyzeJdTeamStructure('총 8명 규모의 팀입니다.')
    expect(r.questions.some((q) => q.includes('보고'))).toBe(true)
    expect(r.questions.some((q) => q.includes('규모'))).toBe(false)
  })

  it('summary is non-empty', () => {
    const r = analyzeJdTeamStructure('일반 공고')
    expect(r.summary.length).toBeGreaterThan(5)
  })
})
