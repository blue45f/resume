import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import type { ResumeSummary } from '@/types/resume'

import { toast } from '@/components/Toast'
import { API_URL } from '@/lib/config'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string>) || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_URL}${url}`, { ...options, headers })
  if (!res.ok) throw new Error(`${res.status}`)
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

export function useApiQuery<T>(
  key: readonly unknown[],
  url: string,
  options?: { enabled?: boolean; staleTime?: number }
) {
  return useQuery<T>({
    queryKey: [...key],
    queryFn: () => apiFetch<T>(url),
    ...options,
  })
}

/**
 * 낙관적 업데이트 옵션 — onMutate 에서 캐시를 즉시 패치해 토글성 액션(북마크·팔로우·좋아요)에
 * 즉각적인 피드백을 준다. 실패 시 스냅샷으로 롤백 + 에러 토스트, 종료 시 invalidate 로 서버 정합 회복.
 */
export interface OptimisticUpdate<TCache, V> {
  /** 즉시 패치할 쿼리 캐시 키 */
  queryKey: readonly unknown[]
  /** 현재 캐시(없으면 undefined)와 mutation 변수로 다음 캐시를 계산하는 순수 함수 */
  updater: (current: TCache | undefined, variables: V) => TCache | undefined
  /** 롤백 시 보여줄 에러 토스트 문구 (기본: '처리에 실패했습니다') */
  errorMessage?: string
}

export function useApiMutation<T, V = unknown, TCache = unknown>(
  url: string,
  method = 'POST',
  invalidateKeys?: string[][],
  optimistic?: OptimisticUpdate<TCache, V>
) {
  const queryClient = useQueryClient()
  const invalidateAll = () => {
    if (invalidateKeys) {
      invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }))
    }
    if (optimistic) {
      queryClient.invalidateQueries({ queryKey: optimistic.queryKey })
    }
  }
  return useMutation<T, Error, V, { snapshot: TCache | undefined }>({
    mutationFn: (variables) => apiFetch<T>(url, { method, body: JSON.stringify(variables) }),
    onMutate: async (variables) => {
      if (!optimistic) return { snapshot: undefined }
      await queryClient.cancelQueries({ queryKey: optimistic.queryKey })
      const snapshot = queryClient.getQueryData<TCache>(optimistic.queryKey)
      queryClient.setQueryData<TCache>(optimistic.queryKey, (current) =>
        optimistic.updater(current, variables)
      )
      return { snapshot }
    },
    onError: (_error, _variables, context) => {
      if (!optimistic) return
      queryClient.setQueryData(optimistic.queryKey, context?.snapshot)
      toast(optimistic.errorMessage ?? '처리에 실패했습니다', 'error')
    },
    onSuccess: () => {
      // 비낙관 경로 기존 동작 보존: 성공 시에만 invalidate
      if (!optimistic) invalidateAll()
    },
    onSettled: () => {
      // 낙관 경로: 성공/실패 모두 서버 정합 회복
      if (optimistic) invalidateAll()
    },
  })
}

// Backward-compat re-exports. Canonical sources:
//   useNotifications    → @/features/notifications
//   useCommunityPosts   → @/features/community
export { useNotifications } from '@/features/notifications/api/useNotifications'
export { useCommunityPosts } from '@/features/community/api/useCommunityPosts'

interface SiteStats {
  users: { total: number; today?: number; thisWeek?: number }
  resumes: { total: number; public?: number; today?: number }
  activity: { totalViews: number; transforms?: number; applications?: number }
  community: { posts?: number; comments?: number }
  content: { templates: number; comments?: number }
  jobs: { active?: number }
}

interface JobStatsBucket {
  name: string
  count: number
}

interface JobSkillStatsBucket extends JobStatsBucket {
  skill?: string
}

interface JobStats {
  total: number
  byLocation: JobStatsBucket[]
  byType: JobStatsBucket[]
  byCompany: JobStatsBucket[]
  bySkill: JobSkillStatsBucket[]
}

export function useSiteStats() {
  return useApiQuery<SiteStats>(['site-stats'], '/api/health/stats', { staleTime: 60_000 })
}

export function useResumes(enabled = true) {
  return useApiQuery<ResumeSummary[]>(['resumes'], '/api/resumes', {
    enabled,
    staleTime: 30_000,
  })
}

export function useJobStats(location?: string, type?: string, skill?: string) {
  const params = new URLSearchParams()
  if (location) params.set('location', location)
  if (type) params.set('type', type)
  if (skill) params.set('skill', skill)
  return useApiQuery<JobStats>(['job-stats', location, type, skill], `/api/jobs/stats?${params}`, {
    staleTime: 60_000,
  })
}

export { useQueryClient }
