import { describe, expect, it } from 'vitest'

import {
  detectMissingResumeSections,
  scoreResumeCompleteness,
  scoreSpecificity,
  estimateJobLevel,
  analyzeActivityChronology,
} from './resumeScoring'

const FULL_RESUME = `
자기소개
5년차 백엔드 개발자입니다.

경력 사항
2020.01 ~ 현재  A사  백엔드 개발자
- Spring Boot, MySQL 활용
- 응답시간 40% 단축

학력
2015.03 ~ 2019.02  OO대학교 컴퓨터공학과

기술 스택
Java, Spring Boot, MySQL, AWS

프로젝트
추천 서비스 구현 — 정확도 30% 향상
`

describe('detectMissingResumeSections', () => {
  it('detects present sections', () => {
    const r = detectMissingResumeSections(FULL_RESUME)
    expect(r.present.length).toBeGreaterThan(0)
    expect(r.missing).not.toContain('경력')
    expect(r.missing).not.toContain('학력')
  })

  it('coverageRatio is 0-1', () => {
    const r = detectMissingResumeSections(FULL_RESUME)
    expect(r.coverageRatio).toBeGreaterThanOrEqual(0)
    expect(r.coverageRatio).toBeLessThanOrEqual(1)
  })

  it('empty text has low coverage', () => {
    const r = detectMissingResumeSections('')
    expect(r.coverageRatio).toBeLessThanOrEqual(0.2)
  })
})

describe('scoreResumeCompleteness', () => {
  it('overall is 0-100', () => {
    const r = scoreResumeCompleteness(FULL_RESUME)
    expect(r.overall).toBeGreaterThanOrEqual(0)
    expect(r.overall).toBeLessThanOrEqual(100)
  })

  it('full resume scores higher than empty', () => {
    const full = scoreResumeCompleteness(FULL_RESUME)
    const empty = scoreResumeCompleteness('')
    expect(full.overall).toBeGreaterThan(empty.overall)
  })

  it('has suggestion string', () => {
    const r = scoreResumeCompleteness(FULL_RESUME)
    expect(typeof r.suggestion).toBe('string')
    expect(r.suggestion.length).toBeGreaterThan(0)
  })
})

describe('scoreSpecificity', () => {
  it('returns score 0-100', () => {
    const r = scoreSpecificity(FULL_RESUME)
    expect(r.overall).toBeGreaterThanOrEqual(0)
    expect(r.overall).toBeLessThanOrEqual(100)
  })

  it('quantified text scores higher than vague text', () => {
    const quantified = scoreSpecificity('응답시간 40% 단축, DAU 300만 달성, 처리량 3배 향상')
    const vague = scoreSpecificity('업무를 열심히 담당했습니다')
    expect(quantified.overall).toBeGreaterThanOrEqual(vague.overall)
  })
})

describe('estimateJobLevel', () => {
  it('returns valid level', () => {
    const r = estimateJobLevel(FULL_RESUME)
    expect(['junior', 'mid', 'senior', 'lead']).toContain(r.level)
  })

  it('detects lead from long career + lead keywords', () => {
    // lead requires years >= 10 AND hasLeadKeyword
    const r = estimateJobLevel(
      '2010.01 ~ 현재  테크팀 리드  팀원 10명 관리, 아키텍처 설계 주도, 테크 리드'
    )
    expect(r.hasLeadKeyword).toBe(true)
  })

  it('returns suggestion string', () => {
    const r = estimateJobLevel(FULL_RESUME)
    expect(typeof r.suggestion).toBe('string')
  })
})

describe('analyzeActivityChronology', () => {
  it('returns object with ranges array', () => {
    const r = analyzeActivityChronology(FULL_RESUME)
    expect(Array.isArray(r.ranges)).toBe(true)
  })

  it('returns isConsistent boolean', () => {
    const r = analyzeActivityChronology(FULL_RESUME)
    expect(typeof r.isConsistent).toBe('boolean')
  })
})
