import { useApiQuery } from '@/hooks/useApi'

interface NotificationSummary {
  id: string
  [key: string]: unknown
}

export function useNotifications() {
  return useApiQuery<NotificationSummary[]>(['notifications'], '/api/notifications', {
    staleTime: 30_000,
  })
}
