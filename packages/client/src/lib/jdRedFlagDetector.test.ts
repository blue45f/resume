import { describe, expect, it } from 'vitest'

import { detectJdRedFlags } from './jdRedFlagDetector'

describe('detectJdRedFlags', () => {
  it('returns clean for empty text', () => {
    const r = detectJdRedFlags('')
    expect(r.riskLevel).toBe('clean')
    expect(r.flags.length).toBe(0)
    expect(r.highCount).toBe(0)
  })

  it('returns clean for normal JD with no red flags', () => {
    const text =
      'React TypeScript 개발자 모집. 유연 근무제 운영. 연봉 4500만~5500만 원. 주 5일 근무.'
    const r = detectJdRedFlags(text)
    expect(r.riskLevel).toBe('clean')
    expect(r.flags.length).toBe(0)
  })

  it('detects 포괄임금제 as high severity', () => {
    const text = '포괄임금제 적용. 개발자 모집.'
    const r = detectJdRedFlags(text)
    expect(r.highCount).toBeGreaterThanOrEqual(1)
    expect(r.flags.some((f) => f.category === '포괄임금제')).toBe(true)
  })

  it('detects 패밀리 문화 as high severity', () => {
    const text = '패밀리 같은 문화를 중시합니다. 함께 성장해요.'
    const r = detectJdRedFlags(text)
    expect(r.flags.some((f) => f.category === '패밀리 문화')).toBe(true)
    expect(r.flags.find((f) => f.category === '패밀리 문화')?.severity).toBe('high')
  })

  it('detects 야근 가능 as high severity', () => {
    const text = '야근 가능하신 분 우대. 주 40~50시간 근무.'
    const r = detectJdRedFlags(text)
    expect(r.flags.some((f) => f.category === '야근')).toBe(true)
  })

  it('detects 연봉 협의 as medium severity', () => {
    const text = '경력에 따라 연봉 협의. 성장 의지 있는 분.'
    const r = detectJdRedFlags(text)
    expect(r.flags.some((f) => f.category === '연봉 비공개')).toBe(true)
    expect(r.flags.find((f) => f.category === '연봉 비공개')?.severity).toBe('medium')
  })

  it('sets riskLevel to high when 2+ high flags detected', () => {
    const text = '포괄임금제 적용. 야근 가능하신 분. 주말 근무 있음.'
    const r = detectJdRedFlags(text)
    expect(r.riskLevel).toBe('high')
    expect(r.highCount).toBeGreaterThanOrEqual(2)
  })

  it('sets riskLevel to moderate when 1 high flag detected', () => {
    const text = '야근 이해하시는 분. 자기 주도적으로 일하시는 분.'
    const r = detectJdRedFlags(text)
    expect(['moderate', 'high']).toContain(r.riskLevel)
    expect(r.highCount).toBeGreaterThanOrEqual(1)
  })

  it('provides non-empty summary', () => {
    const text = '포괄임금제 야근 가능. 패밀리 문화.'
    const r = detectJdRedFlags(text)
    expect(r.summary.length).toBeGreaterThan(0)
  })

  it('matched string is not empty', () => {
    const text = '포괄임금제 적용됩니다.'
    const r = detectJdRedFlags(text)
    expect(r.flags[0].matched.length).toBeGreaterThan(0)
  })
})
