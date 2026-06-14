import { describe, expect, it } from 'vitest'

import { buildSalaryBenchmarkReport } from './jdSalaryBenchmark'

describe('buildSalaryBenchmarkReport', () => {
  it('defaults to mid seniority and unknown company for empty JD', () => {
    const r = buildSalaryBenchmarkReport('')
    expect(r.seniority).toBe('mid')
    expect(r.companyType).toBe('unknown')
    expect(r.jdRange).toBeNull()
  })

  it('detects junior seniority from "신입"', () => {
    const r = buildSalaryBenchmarkReport('신입 개발자 모집 / 경력 0~2년')
    expect(r.seniority).toBe('junior')
    expect(r.marketRange.min).toBeLessThan(r.marketRange.max)
  })

  it('detects senior seniority from "시니어"', () => {
    const r = buildSalaryBenchmarkReport('시니어 백엔드 개발자 채용, 경력 5년 이상')
    expect(r.seniority).toBe('senior')
  })

  it('detects lead seniority from "팀장"', () => {
    const r = buildSalaryBenchmarkReport('팀장급 엔지니어링 리드 채용')
    expect(r.seniority).toBe('lead')
  })

  it('detects bigtech company from "네이버"', () => {
    const r = buildSalaryBenchmarkReport('네이버 클라우드 플랫폼 개발자 채용')
    expect(r.companyType).toBe('bigtech')
    // Bigtech multiplier (1.25) raises market range
    const base = buildSalaryBenchmarkReport('일반 회사 개발자 채용')
    expect(r.marketRange.max).toBeGreaterThan(base.marketRange.max)
  })

  it('extracts JD salary range from Korean format', () => {
    const r = buildSalaryBenchmarkReport('연봉 6000만원~8000만원 협상 가능')
    expect(r.jdRange).not.toBeNull()
    expect(r.jdRange?.min).toBe(6000)
    expect(r.jdRange?.max).toBe(8000)
  })

  it('marks isBelowMarket when JD max is below market min', () => {
    // Senior role with very low JD range
    const r = buildSalaryBenchmarkReport('시니어 개발자, 연봉 4000만원~5000만원')
    // Senior market min ~7000, so 5000 max is way below
    expect(r.isBelowMarket).toBe(true)
    expect(r.assessment).toMatch(/낮|하단|협상/)
  })

  it('negotiationAnchor is between market min and max', () => {
    const r = buildSalaryBenchmarkReport('미드레벨 개발자 3~5년')
    expect(r.negotiationAnchor).toBeGreaterThanOrEqual(r.marketRange.min)
    expect(r.negotiationAnchor).toBeLessThanOrEqual(r.marketRange.max)
  })

  it('provides exactly 4 negotiation tips', () => {
    const r = buildSalaryBenchmarkReport('백엔드 개발자 모집')
    expect(r.tips).toHaveLength(4)
    expect(r.tips[0]).toMatch(/만원/)
  })

  it('detects chaebol company', () => {
    const r = buildSalaryBenchmarkReport('삼성전자 소프트웨어 직군 채용')
    expect(r.companyType).toBe('chaebol')
  })

  it('label reflects JD range when present', () => {
    const r = buildSalaryBenchmarkReport('연봉 5000만원~7000만원 제공')
    expect(r.label).toContain('5,000')
    expect(r.label).toContain('7,000')
  })
})
