import { vi } from 'vitest'

interface JsonResponse<T = unknown> {
  ok?: boolean
  status?: number
  body: T
}

type FetchGlobal = { fetch?: unknown }

/**
 * Replace globalThis.fetch with a vi.fn() that returns the given JSON body.
 * Returns the spy so tests can assert call args.
 *
 * Default response: ok=true, status=200.
 */
export function mockFetchJson<T = unknown>(
  body: T,
  { ok = true, status = 200 }: Omit<JsonResponse, 'body'> = {}
): ReturnType<typeof vi.fn> {
  const spy = vi.fn().mockResolvedValue({
    ok,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
    text: async () => JSON.stringify(body),
    clone() {
      return this
    },
  } as unknown as Response)
  ;(globalThis as unknown as FetchGlobal).fetch = spy
  return spy
}

/**
 * Stack of responses; first call gets responses[0], etc. After exhaustion, repeats last.
 */
export function mockFetchSequence(responses: JsonResponse[]): ReturnType<typeof vi.fn> {
  let i = 0
  const spy = vi.fn().mockImplementation(async () => {
    const r = responses[Math.min(i, responses.length - 1)]
    i += 1
    return {
      ok: r.ok ?? true,
      status: r.status ?? 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => r.body,
      text: async () => JSON.stringify(r.body),
      clone() {
        return this
      },
    } as unknown as Response
  })
  ;(globalThis as unknown as FetchGlobal).fetch = spy
  return spy
}

/**
 * Restore fetch to undefined so subsequent tests get a fresh mock (or use the real one).
 */
export function restoreFetch(): void {
  delete (globalThis as unknown as FetchGlobal).fetch
}
