import { useEffect } from 'react';
import { AppState } from 'react-native';
import { orderService } from '@/api/services/orders';
import type { OrderModel } from '@/api/types';
import { orderEndCountdownTarget } from '@/features/orders/status';
import { useAppRouter } from '@/hooks/useAppRouter';
import { secondsBetween } from '@/lib/format';
import { useAuthStore } from '@/store/auth';

/**
 * Puts the user back into a session that is already under way when the app
 * opens. Mounted once for the whole tab group: it used to be mounted by all
 * four tabs, so switching tabs re-ran four profile refreshes plus four order
 * queries each time, and the pushes raced each other.
 */
export function useOngoingOrderGuard() {
  const router = useAppRouter();
  const userId = useAuthStore((state) => state.user?.id);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const signOut = useAuthStore((state) => state.signOut);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let running = false;
    let pushedFor: string | null = null;

    const pushOnce = (route: string, orderId: string): void => {
      if (pushedFor === orderId) return;
      pushedFor = orderId;
      router.push(route);
    };

    const resumeStarting = (order: OrderModel) => {
      const remaining = secondsBetween(
        new Date().toISOString(),
        orderEndCountdownTarget(order),
      );
      if (remaining <= 0) {
        // The session clock ran out. Settling used to be posted here on the
        // hirer's behalf, which released the whole payment without them ever
        // confirming the session took place. They decide that from the order
        // screen instead.
        pushOnce(`/end-order/${order.id}`, order.id);
      } else if (remaining > 1) {
        pushOnce(`/hiring-stage/${order.id}`, order.id);
      }
    };

    const resumeProcessing = async (order: OrderModel, asPlayer: boolean) => {
      const expiredIn = secondsBetween(
        new Date().toISOString(),
        order.processExpired,
      );
      if (expiredIn <= 0) {
        // The deadline decides the outcome, not whichever device happened to be
        // open when it passed, so these are still explicit calls.
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
        pushOnce(
          asPlayer
            ? `/receive-request/${order.id}`
            : `/hiring-negotiating/${order.id}`,
          order.id,
        );
      }
    };

    const run = async (): Promise<void> => {
      if (running || cancelled) return;
      running = true;
      try {
        const profile = await refreshUser();
        if (!profile || cancelled) return;
        if ((profile.status ?? '').includes('Maintain')) {
          await signOut({ callApi: false });
          return;
        }

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
          resumeStarting(started);
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
      } finally {
        running = false;
      }
    };

    void run();

    // Coming back to the app is the moment a session may have started, ended or
    // been accepted by the other side, so the guard runs again — and lets one
    // fresh push through, since the previous screen may be long gone.
    const subscription = AppState.addEventListener('change', (status) => {
      if (status !== 'active') return;
      pushedFor = null;
      void run();
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [refreshUser, router, signOut, userId]);
}
