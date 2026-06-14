import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { useApiQuery, useApiMutation } from './useApi'

import type { ReactNode } from 'react'

import { toast } from '@/components/Toast'
import { mockFetchJson, restoreFetch } from '@/test/mocks/fetch'

vi.mock('@/components/Toast', () => ({
  toast: vi.fn(),
}))

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function makeWrapper(client: QueryClient = makeClient()) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('useApiQuery', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })
  afterEach(() => {
    restoreFetch()
    vi.restoreAllMocks()
  })

  it('returns data from successful fetch', async () => {
    mockFetchJson({ name: 'foo' })
    const { result } = renderHook(() => useApiQuery<{ name: string }>(['k1'], '/api/test'), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ name: 'foo' })
  })

  it('reports error when fetch returns non-2xx', async () => {
    mockFetchJson({}, { ok: false, status: 500 })
    const { result } = renderHook(() => useApiQuery<unknown>(['k2'], '/api/fail'), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as Error).message).toBe('500')
  })

  it('adds Authorization header when token in localStorage', async () => {
    window.localStorage.setItem('token', 'tok123')
    const spy = mockFetchJson({ ok: true })
    const { result } = renderHook(() => useApiQuery<unknown>(['k3'], '/api/me'), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // ky 는 fetch(Request, options) 로 호출 — 헤더/메서드/본문은 Request 에 실린다.
    const request = spy.mock.calls[0][0] as Request
    expect(request.headers.get('Authorization')).toBe('Bearer tok123')
  })

  it('respects enabled=false (no fetch)', async () => {
    const spy = mockFetchJson({})
    renderHook(() => useApiQuery<unknown>(['k4'], '/api/skip', { enabled: false }), {
      wrapper: makeWrapper(),
    })
    // 잠시 대기 후에도 호출 0
    await new Promise((r) => setTimeout(r, 50))
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('useApiMutation', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })
  afterEach(() => {
    restoreFetch()
  })

  it('posts payload and returns response', async () => {
    // ky 가 Request 본문을 소비하므로 호출 시점에 본문을 읽어 캡처한다.
    let sentBody = ''
    let sentMethod = ''
    const spy = vi.fn().mockImplementation(async (req: Request) => {
      sentMethod = req.method
      sentBody = await req.clone().text()
      return new Response(JSON.stringify({ id: 'new' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })
    ;(globalThis as { fetch?: unknown }).fetch = spy
    const { result } = renderHook(
      () => useApiMutation<{ id: string }, { name: string }>('/api/new'),
      {
        wrapper: makeWrapper(),
      }
    )
    result.current.mutate({ name: 'x' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ id: 'new' })
    expect(sentMethod).toBe('POST')
    expect(sentBody).toBe('{"name":"x"}')
  })
})

describe('useApiMutation — optimistic update', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })
  afterEach(() => {
    restoreFetch()
    vi.clearAllMocks()
  })

  it('applies updater to cache immediately, before fetch resolves', async () => {
    const client = makeClient()
    client.setQueryData(['items'], [{ id: '1' }])
    // fetch 를 수동 resolve 하는 deferred mock — 낙관 패치가 응답 전에 반영되는지 확인
    let resolveFetch!: (value: unknown) => void
    const spy = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve
        })
    )
    ;(globalThis as { fetch?: unknown }).fetch = spy

    const { result } = renderHook(
      () =>
        useApiMutation<unknown, { id: string }, { id: string }[]>('/api/items', 'POST', undefined, {
          queryKey: ['items'],
          updater: (current, variables) => [...(current ?? []), variables],
        }),
      { wrapper: makeWrapper(client) }
    )
    result.current.mutate({ id: '2' })
    await waitFor(() => expect(client.getQueryData(['items'])).toEqual([{ id: '1' }, { id: '2' }]))
    expect(result.current.isPending).toBe(true)

    resolveFetch(new Response('{}', { status: 200 }))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast).not.toHaveBeenCalled()
  })

  it('rolls back to snapshot and toasts on error', async () => {
    const client = makeClient()
    client.setQueryData(['items'], [{ id: '1' }])
    mockFetchJson({}, { ok: false, status: 500 })

    const { result } = renderHook(
      () =>
        useApiMutation<unknown, { id: string }, { id: string }[]>('/api/items', 'POST', undefined, {
          queryKey: ['items'],
          updater: (current, variables) => [...(current ?? []), variables],
        }),
      { wrapper: makeWrapper(client) }
    )
    result.current.mutate({ id: '2' })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(client.getQueryData(['items'])).toEqual([{ id: '1' }])
    expect(toast).toHaveBeenCalledWith('처리에 실패했습니다', 'error')
  })

  it('uses custom errorMessage on rollback toast', async () => {
    const client = makeClient()
    client.setQueryData(['items'], [])
    mockFetchJson({}, { ok: false, status: 500 })

    const { result } = renderHook(
      () =>
        useApiMutation<unknown, { id: string }, { id: string }[]>('/api/items', 'POST', undefined, {
          queryKey: ['items'],
          updater: (current, variables) => [...(current ?? []), variables],
          errorMessage: '좋아요 처리에 실패했습니다',
        }),
      { wrapper: makeWrapper(client) }
    )
    result.current.mutate({ id: '2' })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast).toHaveBeenCalledWith('좋아요 처리에 실패했습니다', 'error')
  })

  it('invalidates optimistic queryKey on settle (success)', async () => {
    const client = makeClient()
    client.setQueryData(['items'], [])
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    mockFetchJson({ ok: true })

    const { result } = renderHook(
      () =>
        useApiMutation<unknown, { id: string }, { id: string }[]>('/api/items', 'POST', undefined, {
          queryKey: ['items'],
          updater: (current, variables) => [...(current ?? []), variables],
        }),
      { wrapper: makeWrapper(client) }
    )
    result.current.mutate({ id: '2' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['items'] })
  })
})
