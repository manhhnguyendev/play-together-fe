import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { orderService } from '@/api/services/orders';
import type { OrderModel } from '@/api/types';
import { orderEndCountdownTarget } from '@/features/orders/status';
import { secondsBetween } from '@/lib/format';
import { useAuthStore } from '@/store/auth';

export function useOngoingOrderGuard() {
  const router = useRouter();
  const userId = useAuthStore((state) => state.user?.id);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const signOut = useAuthStore((state) => state.signOut);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const resumeStarting = async (order: OrderModel) => {
      const remaining = secondsBetween(
        new Date().toISOString(),
        orderEndCountdownTarget(order),
      );
      if (remaining <= 0) {
        await orderService.finish(order.id).catch(() => undefined);
      } else if (remaining > 1) {
        router.push(`/hiring-stage/${order.id}`);
      }
    };

    const run = async () => {
      let profile;
      try {
        profile = await refreshUser();
      } catch {
        return;
      }
      if (!profile || cancelled) return;

      const status = profile.status ?? '';
      if (status.includes('Maintain')) {
        await signOut({ callApi: false });
        return;
      }
      if (!status.includes('Hiring') && !status.includes('Processing')) return;

      try {
        if (status.includes('Hiring')) {
          const own = await orderService.getOrdersOfUser('Starting');
          if (cancelled) return;
          const ownOrder = own.content[0];
          if (ownOrder && ownOrder.userId === profile.id) {
            await resumeStarting(ownOrder);
            return;
          }

          const requests = await orderService.getRequestsOfPlayer('Starting');
          if (cancelled) return;
          const request = requests.content[0];
          if (request && request.toUserId === profile.id) {
            await resumeStarting(request);
          }
          return;
        }

        const own = await orderService.getOrdersOfUser('Processing');
        if (cancelled) return;
        const ownOrder = own.content[0];
        if (ownOrder && ownOrder.userId === profile.id) {
          const expiredIn = secondsBetween(
            new Date().toISOString(),
            ownOrder.processExpired,
          );
          if (expiredIn <= 0) {
            await orderService
              .cancel(ownOrder.id, { reason: 'Quá thời gian gửi yêu cầu' })
              .catch(() => undefined);
          } else if (expiredIn > 1) {
            router.push(`/hiring-negotiating/${ownOrder.id}`);
          }
          return;
        }

        const requests = await orderService.getRequestsOfPlayer('Processing');
        if (cancelled) return;
        const request = requests.content[0];
        if (request && request.toUserId === profile.id) {
          const expiredIn = secondsBetween(
            new Date().toISOString(),
            request.processExpired,
          );
          if (expiredIn < 0) {
            await orderService
              .reject(request.id, {
                isAccept: false,
                reason: 'Quá thời gian chấp thuận',
              })
              .catch(() => undefined);
          } else if (expiredIn > 1) {
            router.push(`/receive-request/${request.id}`);
          }
        }
      } catch {
        // Resuming an order is best-effort; a failed check should not block home.
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [refreshUser, router, signOut, userId]);
}
