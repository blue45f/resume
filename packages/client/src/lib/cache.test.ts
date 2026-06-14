import { describe, expect, it, beforeEach } from 'vitest'

import { getCached, setCache, clearCache } from './cache'

describe('cache (in-memory ttl)', () => {
  beforeEach(() => {
    clearCache()
  })

  it('returns null for missing key', () => {
    expect(getCached('missing', 1000)).toBeNull()
  })

  it('stores and retrieves value within TTL', () => {
    setCache('foo', { v: 42 })
    expect(getCached<{ v: number }>('foo', 10_000)).toEqual({ v: 42 })
  })

  it('returns null and evicts when entry exceeds TTL', async () => {
    setCache('stale', 'value')
    // maxAgeMs=0 — 즉시 만료
    await new Promise((r) => setTimeout(r, 5))
    expect(getCached('stale', 1)).toBeNull()
    // 두 번째 호출도 null (이미 제거)
    expect(getCached('stale', 100_000)).toBeNull()
  })

  it('clearCache() drops everything when called without prefix', () => {
    setCache('a', 1)
    setCache('b', 2)
    clearCache()
    expect(getCached('a', 10_000)).toBeNull()
    expect(getCached('b', 10_000)).toBeNull()
  })

  it('clearCache(prefix) drops only matching keys', () => {
    setCache('user:1', 'a')
    setCache('user:2', 'b')
    setCache('job:1', 'c')
    clearCache('user:')
    expect(getCached('user:1', 10_000)).toBeNull()
    expect(getCached('user:2', 10_000)).toBeNull()
    expect(getCached('job:1', 10_000)).toBe('c')
  })
})
