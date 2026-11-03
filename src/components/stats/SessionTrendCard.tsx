import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { userService } from '@/api/services/users';
import type { SessionGranularity } from '@/api/v2/types';
import { Chip, ErrorView, LoadingView, SectionHeader } from '@/components/ui';
import {
  BAR_MAX_HEIGHT,
  DAY_BUCKETS,
  METRIC_CONFIG,
  MONTH_BUCKETS,
  TREND_METRIC_ORDER,
  barHeight,
  buildTrendBars,
  peakBar,
  type TrendMetric,
} from '@/components/stats/trendMath';
import { useResponsive } from '@/hooks/useResponsive';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, radius, spacing } from '@/theme';

/**
 * Finished sessions over time. One window answers with two series — what I played
 * and earned as a player, and what I paid as a hirer — and a user can hold both
 * roles, so the card offers both instead of guessing which one this screen is for.
 */
export function SessionTrendCard() {
  const { type } = useResponsive();
  const [granularity, setGranularity] = useState<SessionGranularity>('day');
  const [metric, setMetric] = useState<TrendMetric>('earned');

  const bucketCount = granularity === 'day' ? DAY_BUCKETS : MONTH_BUCKETS;
  const statsQuery = useQuery({
    queryKey: queryKeys.sessionStats(granularity, bucketCount),
    queryFn: () => userService.getSessionStats(granularity, bucketCount),
  });

  const config = METRIC_CONFIG[metric];
  const bars = buildTrendBars(statsQuery.data?.buckets ?? [], metric);
  const total = bars.reduce((sum, bar) => sum + bar.value, 0);
  const peak = peakBar(bars);
  const windowWords =
    granularity === 'day'
      ? `${DAY_BUCKETS} ngày gần nhất`
      : `${MONTH_BUCKETS} tháng gần nhất`;

  return (
    <View style={styles.card}>
      <SectionHeader title="Diễn biến phiên" icon="bar-chart-outline" />

      <View style={styles.chipRow}>
        <Chip
          label="Theo ngày"
          selected={granularity === 'day'}
          onPress={() => setGranularity('day')}
        />
        <Chip
          label="Theo tháng"
          selected={granularity === 'month'}
          onPress={() => setGranularity('month')}
        />
      </View>

      {statsQuery.isLoading ? (
        <LoadingView />
      ) : statsQuery.isError ? (
        <ErrorView onRetry={() => void statsQuery.refetch()} />
      ) : (
        <>
          <View style={styles.chipRow}>
            {TREND_METRIC_ORDER.map((key) => (
              <Chip
                key={key}
                label={METRIC_CONFIG[key].label}
                selected={metric === key}
                onPress={() => setMetric(key)}
              />
            ))}
          </View>

          <View
            accessibilityRole="image"
            accessibilityLabel={`${config.label} trong ${windowWords}: ${config.format(total)} ${config.caption}${
              peak ? `, cao nhất ${peak.display} vào ${peak.label}` : ''
            }`}
          >
            <View style={styles.chart}>
              {bars.map((bar) => (
                <View key={bar.key} style={styles.column}>
                  {bar.key === peak?.key ? (
                    <Text style={[styles.peakLabel, type.bodySmall]} numberOfLines={1}>
                      {bar.display}
                    </Text>
                  ) : (
                    <View style={styles.peakSpacer} />
                  )}
                  <View
                    style={[
                      styles.bar,
                      { height: barHeight(bar) },
                      bar.key === peak?.key && styles.barPeak,
                    ]}
                  />
                </View>
              ))}
            </View>
            <View style={styles.axis}>
              <Text style={[styles.axisText, type.bodySmall]} numberOfLines={1}>
                {bars[0]?.label ?? ''}
              </Text>
              <Text style={[styles.axisText, type.bodySmall]} numberOfLines={1}>
                {bars[bars.length - 1]?.label ?? ''}
              </Text>
            </View>
          </View>

          <Text style={[styles.caption, type.bodySmall]}>
            {total > 0
              ? `${config.format(total)} ${config.caption} trong ${windowWords}${
                  peak ? ` · Cao nhất ${peak.display} (${peak.label})` : ''
                }`
              : `Chưa có ${config.label.toLowerCase()} nào trong ${windowWords}.`}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingTop: spacing.xs,
    minHeight: BAR_MAX_HEIGHT,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  bar: {
    width: '100%',
    maxWidth: 26,
    borderRadius: radius.xs,
    backgroundColor: colors.primaryAction,
  },
  barPeak: { backgroundColor: colors.gold },
  peakLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
  },
  peakSpacer: { height: 13 },
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 4,
    gap: spacing.sm,
  },
  axisText: { color: colors.textMuted, flexShrink: 1 },
  caption: { color: colors.textSecondary, lineHeight: 18 },
});
