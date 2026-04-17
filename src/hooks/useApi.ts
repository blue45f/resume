import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/config';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...((options?.headers as Record<string, string>) || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${url}`, { ...options, headers });
  if (!res.ok) throw new Error(`${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export function useApiQuery<T>(key: string[], url: string, options?: { enabled?: boolean; staleTime?: number }) {
  return useQuery<T>({
    queryKey: key,
    queryFn: () => apiFetch<T>(url),
    ...options,
  });
}

export function useApiMutation<T, V = any>(url: string, method = 'POST') {
  const queryClient = useQueryClient();
  return useMutation<T, Error, V>({
    mutationFn: (variables) => apiFetch<T>(url, { method, body: JSON.stringify(variables) }),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

export function useNotifications() {
  return useApiQuery<any[]>(['notifications'], '/api/notifications', { staleTime: 30_000 });
}

export function useSiteStats() {
  return useApiQuery<any>(['site-stats'], '/api/health/stats', { staleTime: 60_000 });
}

export function useResumes() {
  return useApiQuery<any>(['resumes'], '/api/resumes', { staleTime: 30_000 });
}

export function useCommunityPosts(page = 1, category?: string) {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (category && category !== 'all') params.set('category', category);
  return useApiQuery<any>(['community', page, category], `/api/community?${params}`, { staleTime: 30_000 });
}

export function useJobStats(location?: string, type?: string, skill?: string) {
  const params = new URLSearchParams();
  if (location) params.set('location', location);
  if (type) params.set('type', type);
  if (skill) params.set('skill', skill);
  return useApiQuery<any>(['job-stats', location, type, skill], `/api/jobs/stats?${params}`, { staleTime: 60_000 });
}

export { useQueryClient };
