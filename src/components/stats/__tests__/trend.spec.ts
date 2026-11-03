import type { SessionBucket } from '@/api/v2/types';
import {
  BAR_MAX_HEIGHT,
  barHeight,
  buildTrendBars,
  peakBar,
  shortBucketLabel,
  type TrendMetric,
} from '@/components/stats/trendMath';

const bucket = (overrides: Partial<SessionBucket> = {}): SessionBucket => ({
  bucket: '2026-11-03',
  startsAt: '2026-11-02T17:00:00.000Z',
  playerSessions: 0,
  playerHours: 0,
  earned: 0,
  hirerSessions: 0,
  spent: 0,
  ...overrides,
});

const series = [
  bucket({ bucket: '2026-11-01', earned: 100_000, playerSessions: 1, playerHours: 2 }),
  bucket({ bucket: '2026-11-02', earned: 300_000, playerSessions: 3, playerHours: 5, spent: 400_000 }),
  bucket({ bucket: '2026-11-03', earned: 200_000, playerSessions: 2, playerHours: 3 }),
];

describe('shortBucketLabel', () => {
  it('reads a day bucket as dd/MM', () => {
    expect(shortBucketLabel('2026-11-03')).toBe('03/11');
    expect(shortBucketLabel('2026-01-01')).toBe('01/01');
  });

  it('reads a month bucket as MM/yy', () => {
    expect(shortBucketLabel('2026-11')).toBe('11/26');
    expect(shortBucketLabel('2027-01')).toBe('01/27');
  });
});

describe('buildTrendBars', () => {
  it('keeps the period order and normalises heights against the tallest bar', () => {
    const bars = buildTrendBars(series, 'earned');
    expect(bars.map((bar) => bar.key)).toEqual(['2026-11-01', '2026-11-02', '2026-11-03']);
    expect(bars.map((bar) => bar.ratio)).toEqual([1 / 3, 1, 2 / 3]);
  });

  it('picks the column the metric asked for, not always the money one', () => {
    expect(buildTrendBars(series, 'sessions').map((bar) => bar.value)).toEqual([1, 3, 2]);
    expect(buildTrendBars(series, 'hours').map((bar) => bar.value)).toEqual([2, 5, 3]);
    expect(buildTrendBars(series, 'spent').map((bar) => bar.value)).toEqual([0, 400_000, 0]);

    (['earned', 'sessions', 'hours', 'spent'] as TrendMetric[]).forEach((metric) => {
      buildTrendBars(series, metric).forEach((bar) => {
        expect(Number.isFinite(bar.value)).toBe(true);
        expect(bar.display).not.toBe('');
      });
    });
  });

  it('formats money with the app currency helper', () => {
    expect(buildTrendBars(series, 'earned')[1].display).toBe('300.000 đ');
    expect(buildTrendBars(series, 'hours')[1].display).toBe('5h');
  });

  it('survives a window with no activity instead of dividing by zero', () => {
    const empty = [bucket({ bucket: '2026-11-01', earned: 0 }), bucket({ bucket: '2026-11-02', earned: 0 })];
    const bars = buildTrendBars(empty, 'earned');
    expect(bars.map((bar) => bar.ratio)).toEqual([0, 0]);
    bars.forEach((bar) => expect(barHeight(bar)).toBe(2));
  });

  it('returns nothing for nothing, rather than a chart with a phantom bar', () => {
    expect(buildTrendBars([], 'earned')).toEqual([]);
    expect(peakBar([])).toBeNull();
  });
});

describe('barHeight', () => {
  const two = buildTrendBars(
    [bucket({ bucket: '2026-11-01', earned: 100_000 }), bucket({ bucket: '2026-11-02', earned: 1_000_000 })],
    'earned',
  );

  it('gives the tallest bar the full chart height', () => {
    expect(barHeight(two[1])).toBe(BAR_MAX_HEIGHT);
  });

  it('keeps a small non-zero value visible', () => {
    // A tenth of the tallest bar would otherwise collapse into an empty column.
    expect(barHeight(two[0])).toBeGreaterThanOrEqual(8);
    expect(barHeight(two[0])).toBeLessThan(BAR_MAX_HEIGHT);
  });

  it('draws a zero value as the baseline, not as a bar', () => {
    const withZero = buildTrendBars(
      [bucket({ bucket: '2026-11-01', earned: 0 }), bucket({ bucket: '2026-11-02', earned: 5 })],
      'earned',
    );
    expect(barHeight(withZero[0])).toBe(2);
  });
});

describe('peakBar', () => {
  it('names the busiest period, in the metric currently on screen', () => {
    const earned = buildTrendBars(series, 'earned');
    expect(peakBar(earned)?.key).toBe('2026-11-02');

    const spent = buildTrendBars(series, 'spent');
    expect(peakBar(spent)?.key).toBe('2026-11-02');
    expect(peakBar(spent)?.display).toBe('400.000 đ');
  });

  it('is null when nothing happened, so the card says so instead of pointing at a bar', () => {
    const quiet = [bucket({ earned: 0 }), bucket({ bucket: '2026-11-02', earned: 0 })];
    expect(peakBar(buildTrendBars(quiet, 'earned'))).toBeNull();
  });
});
