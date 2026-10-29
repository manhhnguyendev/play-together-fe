import type { OrderModel } from '@/api/types';
import { toLegacyOrderStatus } from '@/api/v2/mappers';
import type { OrderStatus } from '@/api/v2/types';
import { addHours, isEmptyDate } from '@/lib/format';
import { colors } from '@/theme';

const ORDER_STATUS_LABELS: Record<string, string> = {
  Processing: 'Đang thuê',
  Starting: 'Đang xử lý',
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
  Starting: colors.warning,
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
