import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { handlers } from './handlers'

const server = setupServer(...handlers)

describe('mock api handlers', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it.each([
    ['/api/system-config/public', 'object'],
    ['/api/health/announcement', 'object'],
    ['/api/health/stats', 'object'],
    ['/api/system-config/content/whats_new', 'object'],
    ['/api/system-config/content/pricing_faq', 'array'],
    ['/api/notices/popup', 'array'],
    ['/api/banners/active', 'array'],
    ['/api/system-config/permissions', 'object'],
    ['/api/jobs/curated/list?excludeExpired=1&page=1&limit=20', 'object'],
    ['/api/jobs', 'array'],
    ['/api/study-groups?', 'object'],
    ['/api/community?page=1&limit=20&sort=recent', 'object'],
    ['/api/coaching/coaches', 'array'],
    ['/api/system-config/feature-toggles', 'object'],
  ])('handles %s for frontend mock mode', async (path, expectedShape) => {
    const response = await fetch(`http://localhost${path}`)

    expect(response.ok).toBe(true)
    const json = await response.json()
    if (expectedShape === 'array') {
      expect(Array.isArray(json)).toBe(true)
    } else {
      expect(json).not.toBeNull()
      expect(typeof json).toBe('object')
      expect(Array.isArray(json)).toBe(false)
    }
  })

  it('returns curated jobs with string fields consumed by the jobs page', async () => {
    const response = await fetch(
      'http://localhost/api/jobs/curated/list?excludeExpired=1&page=1&limit=20'
    )

    expect(response.ok).toBe(true)
    const json = await response.json()
    expect(json.items.length).toBeGreaterThan(0)
    for (const job of json.items) {
      expect(job.skills).toEqual(expect.any(String))
      expect(job.requirements).toEqual(expect.any(String))
      expect(job.benefits).toEqual(expect.any(String))
      expect(job.summary).toEqual(expect.any(String))
    }
  })
})
