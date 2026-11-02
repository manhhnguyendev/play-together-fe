import type { OrderModel } from '@/api/types';
import { toLegacyOrderStatus, toWireOrderStatus } from '@/api/v2/mappers';
import type { OrderStatus } from '@/api/v2/types';
import { addHours, isEmptyDate } from '@/lib/format';
import { colors } from '@/theme';

const ORDER_STATUS_LABELS: Record<string, string> = {
  Processing: 'Đang thuê',
  Scheduled: 'Đã hẹn',
  Starting: 'Đang xử lý',
  Disputed: 'Chờ đối soát',
  Finish: 'Hoàn thành',
  Complete: 'Hoàn thành',
  Cancel: 'Hủy yêu cầu',
  'Hirer Finish Soon': 'Người thuê kết thúc sớm',
  'Player Finish Soon': 'Người chơi kết thúc sớm',
  OverTime: 'Quá giờ chấp nhận',
  Reject: 'Bị từ chối',
  Interrupt: 'Bị gián đoạn',
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  Processing: colors.danger,
  Scheduled: colors.warning,
  Starting: colors.warning,
  Disputed: colors.warning,
  Finish: colors.success,
  Complete: colors.success,
  'Hirer Finish Soon': colors.success,
  'Player Finish Soon': colors.success,
  Cancel: colors.grey,
  OverTime: colors.grey,
  Reject: colors.grey,
  Interrupt: colors.grey,
};

const normalizeStatus = (status: string): string =>
  toLegacyOrderStatus(status as OrderStatus);

export const orderStatusLabel = (status?: string | null): string => {
  if (!status) return '';
  return ORDER_STATUS_LABELS[normalizeStatus(status)] ?? status;
};

export const endOrderStatusLabel = (status?: string | null): string => {
  if (status === 'Interrupt') return 'Người dùng bị khóa';
  return orderStatusLabel(status);
};

export const orderStatusColor = (status?: string | null): string => {
  if (!status) return colors.text;
  return ORDER_STATUS_COLORS[normalizeStatus(status)] ?? colors.text;
};

const CLOSED_STATUSES = ['Cancel', 'Reject', 'OverTime'];

export const isClosedOrder = (status?: string | null): boolean =>
  CLOSED_STATUSES.includes(status ?? '');

export const isFinishedOrderStatus = (status?: string | null): boolean =>
  [
    'Finish',
    'Complete',
    'Cancel',
    'Reject',
    'OverTime',
    'Interrupt',
    'Hirer Finish Soon',
    'Player Finish Soon',
  ].includes(status ?? '');

/**
 * The session is over but the payout has not been released: a participant can
 * confirm it, object to it, or wait for the objection window to close.
 */
export const isAwaitingReconciliation = (order: Pick<OrderModel, 'status'>): boolean =>
  toLegacyOrderStatus(order.status as OrderStatus) === 'Disputed';

/** Accepted in advance, not started yet: cancellable, and the slot is held. */
export const isBookedSession = (order: Pick<OrderModel, 'status'>): boolean =>
  toLegacyOrderStatus(order.status as OrderStatus) === 'Scheduled';

/** The session is running right now, so the parties belong in the stage screen. */
export const isLiveSession = (order: Pick<OrderModel, 'status'>): boolean =>
  toLegacyOrderStatus(order.status as OrderStatus) === 'Starting';

/**
 * The session actually took place, so a party can report it. A cancelled or
 * rejected booking never gets here — there was nothing to witness.
 */
export const isFeedbackOpenOrder = (order: Pick<OrderModel, 'status'>): boolean =>
  ['DISPUTED', 'SETTLED', 'ENDED_EARLY'].includes(toWireOrderStatus(order.status) ?? '');

export const reconciliationDeadline = (
  order: Pick<OrderModel, 'disputeDeadlineAt'>,
): string | null => (isEmptyDate(order.disputeDeadlineAt) ? null : order.disputeDeadlineAt);

export const orderHirerFinalPrice = (
  order: Pick<OrderModel, 'finalPrices' | 'percentSub'>,
): number => {
  const ratio = 1 - order.percentSub;
  return ratio > 0 ? order.finalPrices / ratio : order.finalPrices;
};

export const orderExpectedEnd = (
  order: Pick<OrderModel, 'timeStart' | 'timeFinish' | 'totalTimes'>,
): string =>
  isEmptyDate(order.timeStart)
    ? addHours(new Date().toISOString(), order.totalTimes)
    : order.timeFinish;

export const orderEndCountdownTarget = (
  order: Pick<OrderModel, 'timeStart' | 'totalTimes'>,
): string => addHours(order.timeStart, order.totalTimes);

export const orderGameNames = (
  order: Pick<OrderModel, 'gameOfOrders'>,
): string[] => (order.gameOfOrders ?? []).map((item) => item.game?.name ?? '');
