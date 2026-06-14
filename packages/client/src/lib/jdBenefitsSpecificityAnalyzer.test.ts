import { describe, expect, it } from 'vitest'

import { analyzeJdBenefitsSpecificity } from './jdBenefitsSpecificityAnalyzer'

describe('analyzeJdBenefitsSpecificity', () => {
  it('returns absent for empty text', () => {
    const r = analyzeJdBenefitsSpecificity('')
    expect(r.clarity).toBe('absent')
    expect(r.specificCount).toBe(0)
    expect(r.vagueCount).toBe(0)
  })

  it('detects benefit_points', () => {
    const r = analyzeJdBenefitsSpecificity('복지 포인트 연 120만 원 지급.')
    expect(r.specificSignals.some((s) => s.type === 'benefit_points')).toBe(true)
  })

  it('detects remote_days — 주 N일 재택', () => {
    const r = analyzeJdBenefitsSpecificity('주 3일 재택근무 가능합니다.')
    expect(r.specificSignals.some((s) => s.type === 'remote_days')).toBe(true)
  })

  it('detects flex_hours — 코어타임 없음', () => {
    const r = analyzeJdBenefitsSpecificity('코어타임 없는 완전 자율 출퇴근.')
    expect(r.specificSignals.some((s) => s.type === 'flex_hours')).toBe(true)
  })

  it('detects education_budget', () => {
    const r = analyzeJdBenefitsSpecificity('교육비 연 100만 원 지원합니다.')
    expect(r.specificSignals.some((s) => s.type === 'education_budget')).toBe(true)
  })

  it('detects health_checkup', () => {
    const r = analyzeJdBenefitsSpecificity('종합 건강검진 지원 (연 1회).')
    expect(r.specificSignals.some((s) => s.type === 'health_checkup')).toBe(true)
  })

  it('detects vacation_days', () => {
    const r = analyzeJdBenefitsSpecificity('연차 15일, 자유롭게 사용 가능.')
    expect(r.specificSignals.some((s) => s.type === 'vacation_days')).toBe(true)
  })

  it('detects meal_support', () => {
    const r = analyzeJdBenefitsSpecificity('사내 식당 운영 (무료).')
    expect(r.specificSignals.some((s) => s.type === 'meal_support')).toBe(true)
  })

  it('detects generic_welfare vague signal', () => {
    const r = analyzeJdBenefitsSpecificity('다양한 복지 혜택을 제공합니다.')
    expect(r.vagueSignals.some((s) => s.type === 'generic_welfare')).toBe(true)
    expect(r.clarity).toBe('vague')
  })

  it('detects best_in_class vague signal', () => {
    const r = analyzeJdBenefitsSpecificity('업계 최고 수준 복지를 자랑합니다.')
    expect(r.vagueSignals.some((s) => s.type === 'best_in_class')).toBe(true)
  })

  it('grades detailed for 2+ specific signals with no vague', () => {
    const text = '복지 포인트 연 120만 원. 주 3일 재택근무. 교육비 연 50만 원.'
    const r = analyzeJdBenefitsSpecificity(text)
    expect(r.clarity).toBe('detailed')
  })

  it('grades partial for 1 specific signal', () => {
    const r = analyzeJdBenefitsSpecificity('복지 포인트 연 120만 원. 다양한 복지 제공.')
    expect(['partial']).toContain(r.clarity)
  })

  it('specific overrides vague for detailed grade', () => {
    const text = '복지 포인트 연 120만 원. 주 3일 재택. 교육비 100만 원. 다양한 복지 혜택도 있어요.'
    const r = analyzeJdBenefitsSpecificity(text)
    expect(['partial', 'detailed']).toContain(r.clarity)
  })

  it('provides interview questions for missing areas', () => {
    const r = analyzeJdBenefitsSpecificity('복지 포인트 연 120만 원.')
    expect(r.interviewQuestions.length).toBeGreaterThan(0)
    expect(r.interviewQuestions.some((q) => q.includes('재택'))).toBe(true)
  })

  it('summary is non-empty', () => {
    const r = analyzeJdBenefitsSpecificity('일반 공고 내용.')
    expect(r.summary.length).toBeGreaterThan(5)
  })
})
