/**
 * Lightweight global fetch mock for Storybook — 컴포넌트가 마운트 시 API 호출하는 경우
 * 네트워크 실패 대신 정상 응답을 반환. 데코레이터 내부에서 wrap/restore.
 *
 * 사용:
 *   parameters: { mockFetch: { '/api/resumes/.../viewers': [...] } }
 */

type MockMap = Record<string, unknown>

let original: typeof fetch | null = null
let activeMap: MockMap = {}

export function installFetchMock(map: MockMap) {
  if (typeof window === 'undefined') return
  activeMap = map
  if (original) return // already installed
  original = window.fetch
  window.fetch = (async (input: RequestInfo | URL) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    for (const key of Object.keys(activeMap)) {
      if (url.includes(key)) {
        const body = activeMap[key]
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }
    // fallthrough — return empty 200 to keep stories silent (no console noise).
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as typeof fetch
}

export function uninstallFetchMock() {
  if (typeof window === 'undefined' || !original) return
  window.fetch = original
  original = null
  activeMap = {}
}
