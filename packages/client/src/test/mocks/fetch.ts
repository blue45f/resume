import { vi } from 'vitest'

interface JsonResponse<T = unknown> {
  ok?: boolean
  status?: number
  body: T
}

type FetchGlobal = { fetch?: unknown }

function makeResponse<T>(body: T, ok: boolean, status: number): Response {
  // 네이티브 Response 사용 — ky 가 Response 를 clone()/decorate 하므로 plain object 대신 실제 Response 필요.
  // status 0 이나 1xx 는 Response 생성자가 거부하므로 ok 플래그로만 분기되는 케이스는 200/500 으로 정규화.
  const safeStatus = status >= 200 && status <= 599 ? status : ok ? 200 : 500
  return new Response(JSON.stringify(body), {
    status: safeStatus,
    headers: { 'content-type': 'application/json' },
  })
}

/**
 * globalThis.fetch 를 주어진 JSON 본문을 반환하는 vi.fn() 으로 교체.
 * 호출 인자 검증용 spy 를 반환한다. 기본 응답: ok=true, status=200.
 *
 * ky 는 fetch 를 `fetch(Request, options)` 형태로 호출하므로, 호출 인자 검증은
 * `spy.mock.calls[0][0]`(Request) 에서 method/headers/body 를 읽어야 한다.
 */
export function mockFetchJson<T = unknown>(
  body: T,
  { ok = true, status = 200 }: Omit<JsonResponse, 'body'> = {}
): ReturnType<typeof vi.fn> {
  const spy = vi.fn().mockImplementation(async () => makeResponse(body, ok, status))
  ;(globalThis as unknown as FetchGlobal).fetch = spy
  return spy
}

/**
 * 응답 스택 — 첫 호출은 responses[0], 이후 순서대로. 소진되면 마지막을 반복.
 */
export function mockFetchSequence(responses: JsonResponse[]): ReturnType<typeof vi.fn> {
  let i = 0
  const spy = vi.fn().mockImplementation(async () => {
    const r = responses[Math.min(i, responses.length - 1)]
    i += 1
    return makeResponse(r.body, r.ok ?? true, r.status ?? 200)
  })
  ;(globalThis as unknown as FetchGlobal).fetch = spy
  return spy
}

/**
 * fetch 를 undefined 로 복원해 다음 테스트가 새 mock(또는 실제 fetch)을 쓰도록 한다.
 */
export function restoreFetch(): void {
  delete (globalThis as unknown as FetchGlobal).fetch
}
