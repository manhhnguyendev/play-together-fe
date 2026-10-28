import type { OnlineHourModel } from '@/api/types';

export const WEEK_DAYS: { day: number; label: string }[] = [
  { day: 2, label: 'Thứ 2' },
  { day: 3, label: 'Thứ 3' },
  { day: 4, label: 'Thứ 4' },
  { day: 5, label: 'Thứ 5' },
  { day: 6, label: 'Thứ 6' },
  { day: 7, label: 'Thứ 7' },
  { day: 8, label: 'Chủ Nhật' },
];

const pad = (value: number) => value.toString().padStart(2, '0');

export const formatMinuteOfDay = (value: number): string => {
  const minutes = Math.max(0, Math.min(24 * 60, Math.floor(value)));
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
};

export const toMinuteOfDay = (hour: number, minute: number): number =>
  hour * 60 + minute;

export const groupByDay = (
  hours: OnlineHourModel[],
): Record<number, OnlineHourModel[]> => {
  const result: Record<number, OnlineHourModel[]> = {};
  for (const day of WEEK_DAYS) result[day.day] = [];
  for (const item of hours) {
    if (result[item.dayInWeek]) result[item.dayInWeek].push(item);
  }
  return result;
};

export const isValidTimeRange = (
  fromHour: number,
  fromMinute: number,
  toHour: number,
  toMinute: number,
): boolean => {
  if (fromHour > toHour) return false;
  if (fromHour === toHour && fromMinute > toMinute) return false;
  return true;
};
