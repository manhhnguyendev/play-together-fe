import type { Href } from 'expo-router';
import { orderService } from '@/api/services/orders';
import { secondsBetween } from '@/lib/format';

type Navigator = { push: (href: Href) => void };

/** An order still in session needs the live screen; everything else the read-only detail. */
const THREE_HOURS = 3 * 60 * 60;

const ORDER_PATH = /^\/orders\/([\da-f-]+)$/i;
const CHARITY_PATH = /^\/charities\/([\da-f-]+)$/i;

/** The order a `referenceUrl` points at, when it points at an order at all. */
export function orderIdOfReference(referenceUrl: string | null | undefined): string | null {
  return referenceUrl?.match(ORDER_PATH)?.[1] ?? null;
}

/**
 * The API writes `referenceUrl` as a resource path (`/orders/:id`), which is not
 * an Expo route, so every notification would otherwise be a dead end. Screens
 * that exist in the app get mapped; anything else stays a read-marker.
 */
export function routeOfReference(referenceUrl: string | null | undefined): Href | null {
  if (!referenceUrl) return null;

  const charity = referenceUrl.match(CHARITY_PATH);
  if (charity) return { pathname: '/charity/[charityId]', params: { charityId: charity[1] } };

  const statics: Record<string, Href> = {
    '/feedback/me': '/feedback',
    '/users/me': '/personal',
    '/notifications': '/notifications',
    '/charity': '/charity',
    '/history': '/history',
  };
  return statics[referenceUrl] ?? null;
}

/**
 * Shared by the history list and a notification tap so the two entries cannot
 * drift apart on which screen an order should open.
 */
export async function openOrderById(orderId: string, router: Navigator): Promise<void> {
  try {
    const detail = (await orderService.getDetailById(orderId)).content;
    const hasFeedback = (detail.ratings ?? []).length > 0 || (detail.reports ?? []).length > 0;
    if (!hasFeedback) {
      const fullOrder = (await orderService.getById(orderId)).content;
      const secondsToFinish = secondsBetween(new Date().toISOString(), fullOrder.timeFinish);
      if (secondsToFinish >= -THREE_HOURS) {
        router.push({ pathname: '/end-order/[orderId]', params: { orderId } });
        return;
      }
    }
  } catch {
    // Fall through to the read-only detail screen.
  }
  router.push({ pathname: '/history/[orderId]', params: { orderId } });
}
