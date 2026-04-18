import { useApiQuery } from '@/hooks/useApi';

export function useNotifications() {
  return useApiQuery<any[]>(['notifications'], '/api/notifications', { staleTime: 30_000 });
}
