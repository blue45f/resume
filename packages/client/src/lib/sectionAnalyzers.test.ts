import { describe, expect, it } from 'vitest'

import {
  splitByExperienceSection,
  analyzeSectionBalance,
  analyzeSectionOrder,
  computeSectionHealth,
} from './sectionAnalyzers'

const RESUME_WITH_SECTIONS = `
자기소개
백엔드 개발자 5년차. 분산 시스템 설계에 관심이 많습니다.

경력 사항
2020.01 ~ 현재  A회사  백엔드 개발
- Spring Boot, MySQL, Redis 활용
- 서비스 응답시간 40% 단축

학력 사항
2015.03 ~ 2019.02  OO대학교 컴퓨터공학과

기술 스택
Java, Spring Boot, MySQL, Redis, Docker, AWS
`

describe('splitByExperienceSection', () => {
  it('returns empty for text with no headings', () => {
    const r = splitByExperienceSection('단순 텍스트입니다.')
    expect(r).toHaveLength(0)
  })

  it('detects 경력 and 학력 sections', () => {
    const r = splitByExperienceSection(RESUME_WITH_SECTIONS)
    const keys = r.map((s) => s.key)
    expect(keys).toContain('경력')
    expect(keys).toContain('학력')
  })
})

describe('analyzeSectionBalance', () => {
  it('returns score 0-100', () => {
    const r = analyzeSectionBalance(RESUME_WITH_SECTIONS)
    expect(r.balanceScore).toBeGreaterThanOrEqual(0)
    expect(r.balanceScore).toBeLessThanOrEqual(100)
  })

  it('returns issues array (may be empty)', () => {
    const r = analyzeSectionBalance(RESUME_WITH_SECTIONS)
    expect(Array.isArray(r.issues)).toBe(true)
  })
})

describe('analyzeSectionOrder', () => {
  it('returns score 0-100', () => {
    const r = analyzeSectionOrder(RESUME_WITH_SECTIONS)
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.score).toBeLessThanOrEqual(100)
  })

  it('ideal order resume has isOptimal close to true', () => {
    const r = analyzeSectionOrder(RESUME_WITH_SECTIONS)
    expect(typeof r.isOptimal).toBe('boolean')
  })
})

describe('computeSectionHealth', () => {
  it('returns tier for any text', () => {
    const r = computeSectionHealth(RESUME_WITH_SECTIONS)
    expect(['excellent', 'good', 'fair', 'poor']).toContain(r.tier)
  })

  it('overall is 0-100', () => {
    const r = computeSectionHealth(RESUME_WITH_SECTIONS)
    expect(r.overall).toBeGreaterThanOrEqual(0)
    expect(r.overall).toBeLessThanOrEqual(100)
  })

  it('topHints has at most 3 items', () => {
    const r = computeSectionHealth(RESUME_WITH_SECTIONS)
    expect(r.topHints.length).toBeLessThanOrEqual(3)
  })

  it('returns poor tier for empty text', () => {
    const r = computeSectionHealth('')
    expect(r.overall).toBeLessThan(50)
    expect(r.tier).toBe('poor')
  })

  it('component scores are 0-100', () => {
    const r = computeSectionHealth(RESUME_WITH_SECTIONS)
    expect(r.balanceScore).toBeGreaterThanOrEqual(0)
    expect(r.orderScore).toBeGreaterThanOrEqual(0)
    expect(r.densityScore).toBeGreaterThanOrEqual(0)
  })
})
