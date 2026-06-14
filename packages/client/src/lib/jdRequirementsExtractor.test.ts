import { describe, expect, it } from 'vitest'

import { buildJdRequirementsReport } from './jdRequirementsExtractor'

const SAMPLE_JD = `
시니어 백엔드 엔지니어

자격요건
- Java 또는 Kotlin 3년 이상 경력
- Spring Boot 기반 REST API 개발 경험
- MySQL 또는 PostgreSQL 실무 경험
- 대규모 서비스 운영 경험

우대사항
- AWS 클라우드 인프라 경험
- 마이크로서비스 아키텍처(MSA) 경험
- 리더십 및 팀 협업 능력
- 영어로 기술 문서 작성 가능

복리후생
- 4대보험
- 식대 지원
`

describe('buildJdRequirementsReport', () => {
  it('detects sections and extracts bullets', () => {
    const r = buildJdRequirementsReport(SAMPLE_JD)
    expect(r.hasSections).toBe(true)
    expect(r.requiredCount).toBeGreaterThan(0)
    expect(r.preferredCount).toBeGreaterThan(0)
  })

  it('classifies tech requirements correctly', () => {
    const r = buildJdRequirementsReport(SAMPLE_JD)
    const techReqs = r.required.filter((req) => req.category === 'tech')
    expect(techReqs.length).toBeGreaterThan(0)
  })

  it('classifies experience requirement', () => {
    const r = buildJdRequirementsReport(SAMPLE_JD)
    const expReqs = r.required.filter((req) => req.category === 'experience')
    expect(expReqs.length).toBeGreaterThan(0)
  })

  it('classifies soft skill in preferred', () => {
    const r = buildJdRequirementsReport(SAMPLE_JD)
    const softPrefs = r.preferred.filter((req) => req.category === 'soft')
    expect(softPrefs.length).toBeGreaterThan(0)
  })

  it('returns empty on empty input', () => {
    const r = buildJdRequirementsReport('')
    expect(r.required).toHaveLength(0)
    expect(r.preferred).toHaveLength(0)
    expect(r.hasSections).toBe(false)
  })

  it('does not include 복리후생 in required/preferred', () => {
    const r = buildJdRequirementsReport(SAMPLE_JD)
    const allTexts = [...r.required, ...r.preferred].map((x) => x.text)
    expect(allTexts.some((t) => t.includes('4대보험'))).toBe(false)
  })

  it('handles 지원자격 section header variant', () => {
    const jd = `지원자격\n- React 개발 경험 2년 이상\n- TypeScript 사용 경험`
    const r = buildJdRequirementsReport(jd)
    expect(r.hasSections).toBe(true)
    expect(r.requiredCount).toBeGreaterThan(0)
  })

  it('handles 우대하는 section header variant', () => {
    const jd = `자격요건\n- Python 경험\n\n우대하는 분\n- 오픈소스 기여 경험`
    const r = buildJdRequirementsReport(jd)
    expect(r.hasSections).toBe(true)
    expect(r.preferredCount).toBeGreaterThan(0)
  })

  it('provides summary string', () => {
    const r = buildJdRequirementsReport(SAMPLE_JD)
    expect(r.summary.length).toBeGreaterThan(10)
  })

  it('marks all required items with type required', () => {
    const r = buildJdRequirementsReport(SAMPLE_JD)
    expect(r.required.every((req) => req.type === 'required')).toBe(true)
  })

  it('marks all preferred items with type preferred', () => {
    const r = buildJdRequirementsReport(SAMPLE_JD)
    expect(r.preferred.every((req) => req.type === 'preferred')).toBe(true)
  })
})
