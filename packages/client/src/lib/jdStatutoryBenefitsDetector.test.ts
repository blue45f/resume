import { describe, expect, it } from 'vitest'

import { detectJdStatutoryBenefits } from './jdStatutoryBenefitsDetector'

describe('detectJdStatutoryBenefits', () => {
  it('returns none for text without benefits', () => {
    const r = detectJdStatutoryBenefits('백엔드 개발자를 모집합니다. 경력 3년 이상.')
    expect(r.padding).toBe('none')
  })

  it('flags padded when only statutory items listed as perks', () => {
    const text = ['복리후생', '- 4대보험 가입', '- 연차 제공', '- 퇴직금 지급'].join('\n')
    const r = detectJdStatutoryBenefits(text)
    expect(r.padding).toBe('padded')
    expect(r.statutoryCount).toBeGreaterThanOrEqual(2)
  })

  it('grades genuine when real perks abound', () => {
    const text = [
      '복리후생',
      '- 식대 지원 월 20만원',
      '- 자기계발비 연 100만원',
      '- 유연근무 및 재택근무',
      '- 종합 건강검진',
    ].join('\n')
    const r = detectJdStatutoryBenefits(text)
    expect(r.padding).toBe('genuine')
    expect(r.genuineCount).toBeGreaterThanOrEqual(3)
  })

  it('grades mixed when both present', () => {
    const text = ['복리후생', '- 4대보험', '- 식대 지원'].join('\n')
    const r = detectJdStatutoryBenefits(text)
    expect(r.padding).toBe('mixed')
  })

  it('detects four insurances as statutory', () => {
    const r = detectJdStatutoryBenefits('4대보험 완비')
    expect(r.statutoryItems.some((i) => i.type === 'four_insurances')).toBe(true)
  })

  it('detects equity as genuine', () => {
    const r = detectJdStatutoryBenefits('스톡옵션 부여 및 인센티브 지급')
    expect(r.genuineItems.some((i) => i.type === 'equity')).toBe(true)
  })

  it('deduplicates repeated benefit types', () => {
    const text = ['4대보험 가입', '4대보험 완비', '국민연금 지원'].join('\n')
    const r = detectJdStatutoryBenefits(text)
    const fourIns = r.statutoryItems.filter((i) => i.type === 'four_insurances')
    expect(fourIns.length).toBeLessThanOrEqual(1)
  })

  it('summary and tips are non-empty', () => {
    const r = detectJdStatutoryBenefits('4대보험 제공')
    expect(r.summary.length).toBeGreaterThan(5)
    expect(r.tips.length).toBeGreaterThan(0)
  })
})
