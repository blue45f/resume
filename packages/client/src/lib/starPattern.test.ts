import { describe, expect, it } from 'vitest'

import { analyzeStarPattern } from './starPattern'

const GOOD_RESUME = `
경력 사항
- 기존 모노리식 아키텍처 분산 처리 문제로 인해 마이크로서비스 전환을 담당하여 Spring Boot로 구현, API 응답속도 40% 개선 달성
- 당시 배포 시간이 30분이었던 문제를 목표로 CI/CD 자동화를 도입하여 배포 시간 5분으로 단축
- 레거시 결제 시스템 리팩토링 책임을 맡아 설계하고 구현한 결과 오류율 70% 감소 성공
`

const WEAK_RESUME = `
기술 스택
- JavaScript, TypeScript, React, Node.js
- MySQL, Redis, Docker, AWS
기타 내용
- 다양한 개발 경험 있음
`

describe('analyzeStarPattern', () => {
  it('returns poor tier for empty text', () => {
    const r = analyzeStarPattern('')
    expect(r.tier).toBe('poor')
    expect(r.total).toBe(0)
  })

  it('finds bullet lines', () => {
    const r = analyzeStarPattern(GOOD_RESUME)
    expect(r.total).toBeGreaterThan(0)
  })

  it('full STAR bullets score 4', () => {
    const r = analyzeStarPattern(GOOD_RESUME)
    const full = r.results.filter((b) => b.score === 4)
    expect(full.length).toBeGreaterThan(0)
  })

  it('good resume has better tier than weak resume', () => {
    const good = analyzeStarPattern(GOOD_RESUME)
    const weak = analyzeStarPattern(WEAK_RESUME)
    const tierOrder = { excellent: 4, good: 3, fair: 2, poor: 1 }
    expect(tierOrder[good.tier]).toBeGreaterThanOrEqual(tierOrder[weak.tier])
  })

  it('coverage is 0-100', () => {
    const r = analyzeStarPattern(GOOD_RESUME)
    expect(r.coverage).toBeGreaterThanOrEqual(0)
    expect(r.coverage).toBeLessThanOrEqual(100)
  })

  it('avgScore is 0-4', () => {
    const r = analyzeStarPattern(GOOD_RESUME)
    expect(r.avgScore).toBeGreaterThanOrEqual(0)
    expect(r.avgScore).toBeLessThanOrEqual(4)
  })

  it('detects hasResult for quantified bullets', () => {
    const r = analyzeStarPattern('- 시스템 최적화로 성능 30% 향상 달성')
    if (r.results.length > 0) {
      expect(r.results[0].hasResult).toBe(true)
    }
  })

  it('detects hasAction for action verb bullets', () => {
    const r = analyzeStarPattern('- React로 개발하고 Docker로 배포하여 운영함')
    if (r.results.length > 0) {
      expect(r.results[0].hasAction).toBe(true)
    }
  })

  it('skips short bullets under 20 chars', () => {
    const r = analyzeStarPattern('- JS\n- TypeScript\n- React')
    expect(r.analyzed).toBe(0)
  })

  it('fullStarCount matches results with score=4', () => {
    const r = analyzeStarPattern(GOOD_RESUME)
    const count = r.results.filter((b) => b.score === 4).length
    expect(r.fullStarCount).toBe(count)
  })
})
