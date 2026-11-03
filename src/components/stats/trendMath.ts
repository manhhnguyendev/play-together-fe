import type { SessionBucket } from '@/api/v2/types';
import { formatVnd } from '@/lib/format';

export type TrendMetric = 'earned' | 'sessions' | 'hours' | 'spent';

export const TREND_METRIC_ORDER: TrendMetric[] = ['earned', 'sessions', 'hours', 'spent'];

export const DAY_BUCKETS = 14;
export const MONTH_BUCKETS = 6;

export const BAR_MAX_HEIGHT = 132;
/** A non-zero value never renders as nothing; only a real zero gets the baseline. */
export const BAR_MIN_VISIBLE = 8;
/** What a zero-value column is drawn as: the axis, not a bar. */
export const BAR_BASELINE_HEIGHT = 2;

export interface MetricConfig {
  label: string;
  pick: (bucket: SessionBucket) => number;
  format: (value: number) => string;
  /** Reads as a sentence tail: "9,4 triệu thu về". */
  caption: string;
}

export const METRIC_CONFIG: Record<TrendMetric, MetricConfig> = {
  earned: {
    label: 'Doanh thu',
    pick: (bucket) => bucket.earned,
    format: formatVnd,
    caption: 'thu về',
  },
  sessions: {
    label: 'Phiên đã chơi',
    pick: (bucket) => bucket.playerSessions,
    format: (value) => String(value),
    caption: 'phiên đã chơi',
  },
  hours: {
    label: 'Giờ đã chơi',
    pick: (bucket) => bucket.playerHours,
    format: (value) => `${value}h`,
    caption: 'giờ đã chơi',
  },
  spent: {
    label: 'Chi tiêu',
    pick: (bucket) => bucket.spent,
    format: formatVnd,
    caption: 'đã trả cho người chơi',
  },
};

export interface TrendBar {
  key: string;
  label: string;
  value: number;
  display: string;
  /** 0..1 against the tallest bar, so the picture stays readable at any width. */
  ratio: number;
}

/** `2026-11-03` reads as `03/11`; `2026-11` reads as `11/26`. */
export const shortBucketLabel = (bucket: string): string => {
  const [, month, day] = bucket.split('-');
  return day ? `${day}/${month}` : `${month}/${bucket.slice(2, 4)}`;
};

export function buildTrendBars(
  buckets: readonly SessionBucket[],
  metric: TrendMetric,
): TrendBar[] {
  const config = METRIC_CONFIG[metric];
  const values = buckets.map((bucket) => config.pick(bucket));
  const tallest = Math.max(...values, 0);

  return buckets.map((bucket, index) => {
    const value = values[index];
    return {
      key: bucket.bucket,
      label: shortBucketLabel(bucket.bucket),
      value,
      display: config.format(value),
      ratio: tallest > 0 ? value / tallest : 0,
    };
  });
}

export const barHeight = (bar: TrendBar): number => {
  if (bar.value <= 0) return BAR_BASELINE_HEIGHT;
  return BAR_MIN_VISIBLE + bar.ratio * (BAR_MAX_HEIGHT - BAR_MIN_VISIBLE);
};

/** The busiest period, or null when the whole window is empty. */
export const peakBar = (bars: readonly TrendBar[]): TrendBar | null =>
  bars.reduce<TrendBar | null>(
    (best, bar) => (bar.value > 0 && (!best || bar.value > best.value) ? bar : best),
    null,
  );
