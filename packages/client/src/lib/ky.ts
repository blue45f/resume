/**
 * 공유 HTTP 클라이언트 — ky 기반.
 *
 * resume 의 모든 HTTP 호출은 이 모듈을 거친다:
 *   - `api`        : JSON 응답을 바로 파싱하는 타입드 클라이언트(중앙 래퍼 `lib/api` · `hooks/useApi` 용)
 *   - `httpClient` : `fetch` 시그니처 호환 래퍼. `throwHttpErrors:false` 라서 호출부의
 *                    `res.ok` / `res.json()` 패턴을 그대로 보존하면서도 auth 헤더·타임아웃을
 *                    ky 훅으로 일관 처리한다. 직접 `fetch(` 호출부의 drop-in 교체용.
 *
 * 인증: 토큰은 `localStorage['token']`(zustand `useAuthStore` 와 동일 소스). beforeRequest 훅이
 * Authorization 헤더가 없을 때만 자동 주입하므로 호출부의 수동 헤더와 충돌하지 않는다.
 * 401 응답 시 토큰/유저를 비운다(기존 `request()` 동작 보존).
 */
import ky, { type Options, type KyResponse } from 'ky'

import { API_URL } from './config'

/**
 * ky baseUrl — 상대 입력(`/api/...`)을 절대 URL 로 해소하는 기준.
 *  - API_URL 지정 시(개발/운영): 그 절대 URL 기준. `${API_URL}/api/...`(이미 절대)는 그대로,
 *    `/api/...`(상대)는 API_URL origin 으로 해소된다.
 *  - 비었을 때(로컬 Vite proxy / 테스트): document origin 기준으로 `/api/...` 해소.
 * 절대 URL 입력은 baseUrl 과 무관하게 그대로 사용된다.
 */
function resolveBaseUrl(): string | undefined {
  if (API_URL) return API_URL
  if (typeof window !== 'undefined' && globalThis.location?.origin)
    return globalThis.location.origin
  return undefined
}

export type ApiRecord = Record<string, unknown>

function isApiRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function getApiMessage(value: unknown): string | undefined {
  if (!isApiRecord(value)) return undefined
  const msg = value.message
  if (Array.isArray(msg)) return msg.filter((m) => typeof m === 'string').join(', ') || undefined
  return typeof msg === 'string' ? msg : undefined
}

function readToken(): string | null {
  try {
    return localStorage.getItem('token')
  } catch {
    return null
  }
}

function clearAuthOn401(): void {
  try {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  } catch {
    /* localStorage 접근 불가(SSR/프라이버시 모드) — 무시 */
  }
}

/**
 * 기본 ky 인스턴스 — Authorization 자동 주입 + 401 토큰 정리.
 * 절대/상대 URL 모두 받기 위해 호출부에서 전체 URL 을 넘기는 경우 prefix 는 무시된다
 * (ky 는 `http(s)://` 또는 `/` 로 시작하는 input 을 절대 취급).
 */
const base = ky.create({
  baseUrl: resolveBaseUrl(),
  timeout: 30_000,
  retry: 0,
  hooks: {
    beforeRequest: [
      ({ request }) => {
        if (!request.headers.has('Authorization')) {
          const token = readToken()
          if (token) request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
    afterResponse: [
      ({ response }) => {
        if (response.status === 401) clearAuthOn401()
      },
    ],
  },
})

/**
 * `fetch` 호환 래퍼 — 직접 `fetch(` 호출부의 drop-in 교체.
 * `throwHttpErrors:false` 라서 항상 `Response` 를 반환한다(호출부의 `res.ok`/`res.json()` 보존).
 * input 은 절대 URL(`http...`) 또는 절대 경로(`/api/...`) 를 그대로 넘기면 된다.
 *
 * 반환 타입은 표준 `Response` 로 노출한다 — 런타임은 실제 Response 이고, 기존 raw `fetch`
 * 호출부의 `res.json(): Promise<any>` 추론을 보존해 마이그레이션이 타입-무중단이 되도록 한다
 * (ky 의 `KyResponse.json()` 은 `Promise<unknown>` 이라 호출부 setState/구조분해를 깬다).
 */
export function httpClient(input: string, init?: RequestInit): Promise<Response> {
  const { method, ...rest } = init ?? {}
  return base(input, {
    ...(rest as Options),
    method: method ?? 'get',
    throwHttpErrors: false,
  }) as Promise<Response>
}

/** axios 시절 `{ params }` 호환 — ky 의 searchParams 로 변환. */
type ApiOptions = Omit<Options, 'method' | 'json' | 'searchParams'> & {
  params?: Record<string, string | number | boolean | null | undefined>
}

function toOptions(opts?: ApiOptions): Options {
  if (!opts) return {}
  const { params, ...rest } = opts
  if (!params) return rest
  const searchParams = Object.fromEntries(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)])
  )
  return { ...rest, searchParams }
}

async function toJson<T>(promise: Promise<KyResponse>): Promise<T> {
  const res = await promise
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

/** JSON 응답을 바로 파싱하는 타입드 클라이언트. 비-2xx 는 ky `HTTPError` 로 throw 된다. */
export const api = {
  get: <T>(url: string, options?: ApiOptions) => toJson<T>(base.get(url, toOptions(options))),
  post: <T>(url: string, body?: unknown, options?: ApiOptions) =>
    toJson<T>(base.post(url, { json: body, ...toOptions(options) })),
  patch: <T>(url: string, body?: unknown, options?: ApiOptions) =>
    toJson<T>(base.patch(url, { json: body, ...toOptions(options) })),
  put: <T>(url: string, body?: unknown, options?: ApiOptions) =>
    toJson<T>(base.put(url, { json: body, ...toOptions(options) })),
  delete: <T>(url: string, options?: ApiOptions) => toJson<T>(base.delete(url, toOptions(options))),
}

/**
 * ky `HTTPError` 에서 서버 `{ message }` 를 추출한다(NestJS GlobalExceptionFilter 형식).
 * 사용자 대상 에러 토스트가 모두 거치는 추출 로직.
 */
export function getErrorMessage(err: unknown, fallback = '문제가 발생했어요'): string {
  const data = (err as { data?: unknown } | null)?.data
  const msg = getApiMessage(data)
  if (msg) return msg
  if (err instanceof Error) return err.message || fallback
  return fallback
}

export { base as kyClient }
