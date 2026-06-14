import { describe, expect, it } from 'vitest'

import { checkResumeChronology } from './resumeChronologyChecker'

describe('checkResumeChronology', () => {
  it('returns ordered for empty text', () => {
    const r = checkResumeChronology('')
    expect(r.grade).toBe('ordered')
    expect(r.rangeCount).toBe(0)
  })

  it('treats single range as ordered (insufficient data)', () => {
    const r = checkResumeChronology('ABC회사 2020 ~ 2023 재직')
    expect(r.grade).toBe('ordered')
  })

  it('detects correct reverse-chronological order', () => {
    const text = ['B회사 2022 ~ 2024', 'A회사 2019 ~ 2021'].join('\n')
    const r = checkResumeChronology(text)
    expect(r.grade).toBe('ordered')
    expect(r.rangeCount).toBe(2)
    expect(r.inversions).toBe(0)
  })

  it('flags oldest-first ordering as reversed', () => {
    const text = ['A회사 2016 ~ 2018', 'B회사 2019 ~ 2021', 'C회사 2022 ~ 2024'].join('\n')
    const r = checkResumeChronology(text)
    expect(r.grade).toBe('reversed')
    expect(r.inversions).toBeGreaterThanOrEqual(2)
  })

  it('flags partial disorder as mixed', () => {
    const text = ['C회사 2022 ~ 2024', 'A회사 2016 ~ 2018', 'B회사 2019 ~ 2021'].join('\n')
    const r = checkResumeChronology(text)
    expect(r.grade).toBe('mixed')
  })

  it('parses ranges with months', () => {
    const text = ['2022.03 ~ 2024.05', '2019.01 ~ 2021.12'].join('\n')
    const r = checkResumeChronology(text)
    expect(r.rangeCount).toBe(2)
    expect(r.ranges[0].startYear).toBe(2022)
  })

  it('handles ongoing end keyword (현재)', () => {
    const text = ['2023 ~ 현재', '2020 ~ 2022'].join('\n')
    const r = checkResumeChronology(text)
    expect(r.rangeCount).toBe(2)
    expect(r.grade).toBe('ordered')
  })

  it('ignores implausible years', () => {
    const r = checkResumeChronology('버전 1234 ~ 5678 호환')
    expect(r.rangeCount).toBe(0)
  })

  it('summary and suggestions present when reversed', () => {
    const text = ['2015 ~ 2017', '2018 ~ 2020', '2021 ~ 2023'].join('\n')
    const r = checkResumeChronology(text)
    expect(r.summary.length).toBeGreaterThan(5)
    expect(r.suggestions.length).toBeGreaterThan(0)
  })
})
