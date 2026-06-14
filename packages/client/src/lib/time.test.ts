import { describe, expect, it } from 'vitest'

import { formatDate } from './time'

describe('formatDate', () => {
  it('matches Date#toLocaleDateString("ko-KR") under the default ko locale', () => {
    const samples = [
      '2026-06-02T03:00:00Z',
      '2026-12-25T15:00:00Z',
      '2026-01-09T23:30:00Z',
      '2026-11-30T01:05:00Z',
    ]
    for (const iso of samples) {
      expect(formatDate(iso)).toBe(new Date(iso).toLocaleDateString('ko-KR'))
    }
  })

  it('accepts Date and epoch inputs', () => {
    const d = new Date('2026-06-02T03:00:00Z')
    expect(formatDate(d)).toBe(d.toLocaleDateString('ko-KR'))
    expect(formatDate(d.getTime())).toBe(d.toLocaleDateString('ko-KR'))
  })

  it('returns empty string for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('')
  })
})
