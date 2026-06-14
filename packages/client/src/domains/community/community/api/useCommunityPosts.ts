import { useApiQuery } from '@/hooks/useApi'

interface CommunityPostListResponse {
  items: unknown[]
  total?: number
  totalPages?: number
}

export function useCommunityPosts(page = 1, category?: string) {
  const params = new URLSearchParams({ page: String(page), limit: '20' })
  if (category && category !== 'all') params.set('category', category)
  return useApiQuery<CommunityPostListResponse>(
    ['community', page, category],
    `/api/community?${params}`,
    {
      staleTime: 30_000,
    }
  )
}
