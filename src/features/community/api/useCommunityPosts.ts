import { useApiQuery } from '@/hooks/useApi';

export function useCommunityPosts(page = 1, category?: string) {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (category && category !== 'all') params.set('category', category);
  return useApiQuery<any>(['community', page, category], `/api/community?${params}`, { staleTime: 30_000 });
}
