import { describe, expect, it, vi } from 'vitest'

import { memoizeByText } from './memoize'

describe('memoizeByText', () => {
  it('returns the same result for repeated identical inputs without recomputing', () => {
    const spy = vi.fn((s: string) => s.length)
    const fn = memoizeByText(spy)
    expect(fn('hello')).toBe(5)
    expect(fn('hello')).toBe(5)
    expect(fn('hello')).toBe(5)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('recomputes when input changes', () => {
    const spy = vi.fn((s: string) => s.toUpperCase())
    const fn = memoizeByText(spy)
    expect(fn('a')).toBe('A')
    expect(fn('b')).toBe('B')
    expect(fn('a')).toBe('A') // 이전 entry 가 버려졌으므로 재계산
    expect(spy).toHaveBeenCalledTimes(3)
  })

  it('handles empty string', () => {
    const spy = vi.fn(() => 'ok')
    const fn = memoizeByText(spy)
    fn('')
    fn('')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('각 인스턴스는 독립된 캐시를 가짐', () => {
    const a = vi.fn(() => 1)
    const b = vi.fn(() => 2)
    const fa = memoizeByText(a)
    const fb = memoizeByText(b)
    fa('x')
    fb('x')
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
  })
})
