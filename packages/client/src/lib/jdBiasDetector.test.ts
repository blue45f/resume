import { describe, expect, it } from 'vitest'

import { buildJdBiasReport, detectJdBias } from './jdBiasDetector'

describe('detectJdBias', () => {
  it('returns empty when text is blank', () => {
    expect(detectJdBias('')).toEqual([])
    expect(detectJdBias('   ')).toEqual([])
  })

  it('returns empty for a neutral, well-written JD', () => {
    const text = `
      백엔드 엔지니어를 모십니다.
      • 5년 이상 분산 시스템 개발 경험
      • Java/Kotlin/Go 중 하나 이상 능숙
      • 협업과 코드 리뷰를 즐기시는 분
    `
    expect(detectJdBias(text)).toEqual([])
  })

  it('flags explicit age requirement', () => {
    const findings = detectJdBias('만 35세 이하 지원 가능합니다.')
    expect(findings.length).toBeGreaterThan(0)
    expect(findings[0].category).toBe('age')
    expect(findings[0].severity).toBe('high')
  })

  it('flags "청년" + "젊은" as age signals', () => {
    const findings = detectJdBias('밝고 젊은 인재를 찾습니다. 청년 채용.')
    const ageHits = findings.filter((f) => f.category === 'age')
    expect(ageHits.length).toBeGreaterThanOrEqual(2)
  })

  it('flags gendered job titles', () => {
    const findings = detectJdBias('여직원 채용. 미혼 여성 우대.')
    const genderHits = findings.filter((f) => f.category === 'gender')
    expect(genderHits.length).toBeGreaterThan(0)
    expect(findings.some((f) => f.category === 'family')).toBe(true)
  })

  it('flags height requirement as physical bias', () => {
    const findings = detectJdBias('키 170cm 이상의 단정한 용모 우대')
    const physicalHits = findings.filter((f) => f.category === 'physical')
    expect(physicalHits.length).toBeGreaterThanOrEqual(1)
    expect(physicalHits[0].severity).toBe('high')
  })

  it('flags school-based preferences', () => {
    const findings = detectJdBias('SKY 출신 우대, 4년제 이상 졸업자')
    expect(findings.some((f) => f.category === 'education' && f.severity === 'high')).toBe(true)
    expect(findings.some((f) => f.category === 'education' && f.severity === 'low')).toBe(true)
  })

  it('sorts high severity findings first', () => {
    const findings = detectJdBias(
      '4년제 이상 학사. SKY 출신 우대. 30대 미혼 여성 우대. 키 170cm 이상.'
    )
    expect(findings.length).toBeGreaterThan(2)
    expect(findings[0].severity).toBe('high')
  })

  it('returns an excerpt with context around the match', () => {
    const findings = detectJdBias('지원 자격: 만 35세 이하 신규 인재를 모집합니다.')
    expect(findings.length).toBeGreaterThan(0)
    expect(findings[0].excerpt).toContain('35세')
  })
})

describe('buildJdBiasReport', () => {
  it('returns "good" tone with reassuring summary when nothing is flagged', () => {
    const report = buildJdBiasReport('5년 이상 경력, 협업 능숙자를 우대합니다.')
    expect(report.tone).toBe('good')
    expect(report.findings).toHaveLength(0)
  })

  it('promotes tone to danger when any high-severity bias is present', () => {
    const report = buildJdBiasReport('키 170cm 이상 남직원 채용. 30대 미혼 여성 우대.')
    expect(report.tone).toBe('danger')
    expect(report.highCount).toBeGreaterThan(0)
    expect(report.summary).toContain('법적 위반 소지')
  })

  it('lists categories in the summary', () => {
    const report = buildJdBiasReport('서울 거주자만 가능. 4년제 이상 졸업자.')
    expect(report.findings.length).toBeGreaterThan(0)
    expect(report.summary).toMatch(/지역|학력/)
  })
})
