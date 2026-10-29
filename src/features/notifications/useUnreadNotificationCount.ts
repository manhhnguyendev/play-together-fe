import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/api/services/content';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';

export function useUnreadNotificationCount() {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: queryKeys.notificationsUnread,
    enabled: Boolean(userId),
    queryFn: () => notificationService.getUnreadCount(),
  });
}
