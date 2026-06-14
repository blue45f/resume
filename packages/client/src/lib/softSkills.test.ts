import { describe, expect, it } from 'vitest'

import { detectSoftSkills, detectAbbreviations } from './softSkills'

describe('detectSoftSkills', () => {
  it('returns 0 distinct for unrelated text', () => {
    const r = detectSoftSkills('맛있는 점심을 먹었습니다.')
    expect(r.distinctCount).toBe(0)
    expect(r.total).toBe(0)
  })

  it('detects collaboration + communication', () => {
    const r = detectSoftSkills('팀 협업 능력과 의사소통 능력이 뛰어납니다.')
    expect(r.distinctCount).toBeGreaterThanOrEqual(2)
    expect(r.hits.some((h) => h.skill === '협업')).toBe(true)
    expect(r.hits.some((h) => h.skill === '커뮤니케이션')).toBe(true)
  })

  it('counts repeated mentions of the same skill', () => {
    const r = detectSoftSkills('협업, 협업, 협업')
    const teamwork = r.hits.find((h) => h.skill === '협업')
    expect(teamwork?.count).toBeGreaterThanOrEqual(3)
  })
})

describe('detectAbbreviations', () => {
  it('returns no hits for plain Korean text', () => {
    const r = detectAbbreviations('이력서 본문 텍스트입니다.')
    expect(r.hits).toHaveLength(0)
  })

  it('ignores common acronyms in the whitelist', () => {
    const r = detectAbbreviations('AWS / API / DB 사용 경험')
    expect(r.unexplained).toHaveLength(0)
  })

  it('flags unexplained acronyms', () => {
    const r = detectAbbreviations('XYZ 시스템과 ABCD 프로토콜을 도입했습니다.')
    expect(r.unexplained.length).toBeGreaterThan(0)
    const flagged = r.unexplained.map((h) => h.acronym)
    expect(flagged).toContain('XYZ')
  })

  it('marks acronym with parenthetical expansion as explained', () => {
    const r = detectAbbreviations('PWA(Progressive Web App) 도입')
    // PWA 가 unexplained 에 없어야 함
    expect(r.unexplained.find((h) => h.acronym === 'PWA')).toBeUndefined()
  })

  it('suggestion is non-empty', () => {
    const r = detectAbbreviations('XYZ 시스템')
    expect(r.suggestion.length).toBeGreaterThan(0)
  })
})

describe('detectSoftSkills - suggestion', () => {
  it('mentions 역량 다양화 when few skills detected', () => {
    const r = detectSoftSkills('소통을 잘합니다.')
    expect(r.suggestion).toContain('다양화')
  })

  it('hits sorted by count descending', () => {
    const r = detectSoftSkills('협업 협업 협업. 소통. 분석. 문제해결.')
    if (r.hits.length >= 2) {
      expect(r.hits[0].count).toBeGreaterThanOrEqual(r.hits[1].count)
    }
  })
})
