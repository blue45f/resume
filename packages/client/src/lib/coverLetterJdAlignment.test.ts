import { describe, expect, it } from 'vitest'

import { buildCoverLetterJdAlignmentReport } from './coverLetterJdAlignment'

const JD = `
시니어 백엔드 개발자 모집 (네이버)
자격요건: Java, Spring Boot, MySQL, Redis 3년 이상 경력
`

const GOOD_CL = `
저는 Java와 Spring Boot로 3년간 백엔드 서비스를 개발해왔습니다.
MySQL과 Redis를 활용한 대규모 시스템 운영 경험이 있습니다.
귀사의 백엔드 인프라에 기여하고 싶습니다.
시니어 개발자로서 팀에 가치를 더할 수 있다고 확신합니다.
`

const GENERIC_CL = `
저는 열정적인 개발자입니다. 성실하게 일하며 팀워크를 중요시합니다.
언제나 최선을 다하겠습니다. 기회를 주신다면 열심히 하겠습니다.
`

describe('buildCoverLetterJdAlignmentReport', () => {
  it('returns warning on empty inputs', () => {
    const r = buildCoverLetterJdAlignmentReport('', '')
    expect(r.tone).toBe('warning')
    expect(r.alignmentScore).toBe(0)
  })

  it('good cover letter scores higher than generic', () => {
    const good = buildCoverLetterJdAlignmentReport(GOOD_CL, JD)
    const generic = buildCoverLetterJdAlignmentReport(GENERIC_CL, JD)
    expect(good.alignmentScore).toBeGreaterThan(generic.alignmentScore)
  })

  it('good cover letter has good tone', () => {
    const r = buildCoverLetterJdAlignmentReport(GOOD_CL, JD)
    expect(r.tone).toBe('good')
  })

  it('detects tech stack check', () => {
    const r = buildCoverLetterJdAlignmentReport(GOOD_CL, JD)
    const techCheck = r.checks.find((c) => c.label === '기술 스택 언급')
    expect(techCheck).toBeDefined()
    expect(techCheck?.addressed).toBe(true)
  })

  it('flags missing tech keywords in generic letter', () => {
    const r = buildCoverLetterJdAlignmentReport(GENERIC_CL, JD)
    expect(r.missingKeywords.length).toBeGreaterThan(0)
  })

  it('detects seniority check when JD mentions seniority', () => {
    const r = buildCoverLetterJdAlignmentReport(GOOD_CL, JD)
    const seniorityCheck = r.checks.find((c) => c.label === '경력 수준 표현')
    expect(seniorityCheck).toBeDefined()
  })

  it('detects company reference check', () => {
    const r = buildCoverLetterJdAlignmentReport(GOOD_CL, JD)
    const companyCheck = r.checks.find((c) => c.label === '회사·서비스 맞춤화')
    expect(companyCheck).toBeDefined()
    expect(companyCheck?.addressed).toBe(true)
  })

  it('alignment score is 0-100', () => {
    const r = buildCoverLetterJdAlignmentReport(GOOD_CL, JD)
    expect(r.alignmentScore).toBeGreaterThanOrEqual(0)
    expect(r.alignmentScore).toBeLessThanOrEqual(100)
  })

  it('provides non-empty summary', () => {
    const r = buildCoverLetterJdAlignmentReport(GOOD_CL, JD)
    expect(r.summary.length).toBeGreaterThan(10)
  })

  it('label includes score', () => {
    const r = buildCoverLetterJdAlignmentReport(GOOD_CL, JD)
    expect(r.label).toContain(String(r.alignmentScore))
  })
})
