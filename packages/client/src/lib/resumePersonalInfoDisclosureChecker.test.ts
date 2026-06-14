import { describe, expect, it } from 'vitest'

import { checkResumePersonalInfoDisclosure } from './resumePersonalInfoDisclosureChecker'

describe('checkResumePersonalInfoDisclosure', () => {
  it('returns clean for a normal resume', () => {
    const r = checkResumePersonalInfoDisclosure(
      '백엔드 개발자입니다. Java와 Spring으로 결제 시스템을 구축했습니다.'
    )
    expect(r.grade).toBe('clean')
    expect(r.findings.length).toBe(0)
  })

  it('flags resident registration number as risky', () => {
    const r = checkResumePersonalInfoDisclosure('주민등록번호: 900101-1234567')
    expect(r.grade).toBe('risky')
    expect(r.findings.some((f) => f.category === 'resident_id')).toBe(true)
  })

  it('flags family info as high severity', () => {
    const r = checkResumePersonalInfoDisclosure('가족관계: 부 홍길동, 모 김영희')
    expect(r.findings.some((f) => f.category === 'family_info' && f.severity === 'high')).toBe(true)
  })

  it('flags physical info as caution', () => {
    const r = checkResumePersonalInfoDisclosure('키: 175cm, 몸무게: 70kg, 혈액형: A형')
    expect(r.findings.some((f) => f.category === 'physical')).toBe(true)
  })

  it('flags marital status', () => {
    const r = checkResumePersonalInfoDisclosure('결혼 여부: 미혼')
    expect(r.findings.some((f) => f.category === 'marital')).toBe(true)
  })

  it('does not false-positive on common word 키워드/스킬', () => {
    const r = checkResumePersonalInfoDisclosure('핵심 키워드 분석과 다양한 스킬을 보유했습니다.')
    expect(r.findings.some((f) => f.category === 'physical')).toBe(false)
  })

  it('does not flag religion volunteer work without field format', () => {
    const r = checkResumePersonalInfoDisclosure('종교 단체에서 봉사활동을 했습니다.')
    expect(r.findings.some((f) => f.category === 'religion')).toBe(false)
  })

  it('grades caution when only medium/low findings', () => {
    const r = checkResumePersonalInfoDisclosure('본적: 서울특별시')
    expect(r.grade).toBe('caution')
  })

  it('deduplicates same category', () => {
    const r = checkResumePersonalInfoDisclosure('미혼\n결혼 여부: 미혼')
    expect(r.findings.filter((f) => f.category === 'marital').length).toBe(1)
  })

  it('summary and recommendations non-empty when not clean', () => {
    const r = checkResumePersonalInfoDisclosure('주민번호 기재')
    expect(r.summary.length).toBeGreaterThan(5)
    expect(r.recommendations.length).toBeGreaterThan(0)
  })
})
