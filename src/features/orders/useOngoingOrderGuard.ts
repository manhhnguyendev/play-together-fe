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

    const resumeProcessing = async (order: OrderModel, asPlayer: boolean) => {
      const expiredIn = secondsBetween(
        new Date().toISOString(),
        order.processExpired,
      );
      if (expiredIn <= 0) {
        if (asPlayer) {
          await orderService
            .reject(order.id, {
              isAccept: false,
              reason: 'Quá thời gian chấp thuận',
            })
            .catch(() => undefined);
        } else {
          await orderService
            .cancel(order.id, { reason: 'Quá thời gian gửi yêu cầu' })
            .catch(() => undefined);
        }
        return;
      }
      if (expiredIn > 1) {
        router.push(
          asPlayer
            ? `/receive-request/${order.id}`
            : `/hiring-negotiating/${order.id}`,
        );
      }
    };

    const run = async () => {
      try {
        const profile = await refreshUser();
        if (!profile || cancelled) return;
        if ((profile.status ?? '').includes('Maintain')) {
          await signOut({ callApi: false });
          return;
        }
      } catch {
        return;
      }

      try {
        const [ownStarting, ownProcessing, requestStarting, requestProcessing] =
          await Promise.all([
            orderService.getOrdersOfUser('Starting'),
            orderService.getOrdersOfUser('Processing'),
            orderService.getRequestsOfPlayer('Starting'),
            orderService.getRequestsOfPlayer('Processing'),
          ]);
        if (cancelled) return;

        const started = ownStarting.content[0] ?? requestStarting.content[0];
        if (started) {
          await resumeStarting(started);
          return;
        }

        const pendingOwn = ownProcessing.content[0];
        if (pendingOwn) {
          await resumeProcessing(pendingOwn, false);
          return;
        }

        const pendingRequest = requestProcessing.content[0];
        if (pendingRequest) {
          await resumeProcessing(pendingRequest, true);
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
