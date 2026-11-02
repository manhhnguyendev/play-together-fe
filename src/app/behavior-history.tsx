import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { behaviorService } from '@/api/services/users';
import type { BehaviorEvent, BehaviorHistoryItem } from '@/api/v2/types';
import { AppBar, Button, EmptyState, ErrorView, LoadingView, SectionHeader } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { formatDateTime } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, radius, spacing } from '@/theme';

const EVENT_LABELS: Record<BehaviorEvent, string> = {
  RATING_RECEIVED: 'Đánh giá nhận được',
  RATING_REVOKED: 'Đánh giá bị thu hồi',
  ORDER_REJECTED: 'Từ chối lượt thuê',
  ORDER_EXPIRED: 'Yêu cầu thuê hết hạn',
  ORDER_EARLY_END: 'Kết thúc lượt thuê sớm',
  REPORT_APPROVED: 'Báo cáo được chấp thuận',
  MANUAL_ADJUSTMENT: 'Quản trị viên điều chỉnh',
};

const POINT_TYPE_LABELS: Record<BehaviorHistoryItem['pointType'], string> = {
  POINTS: 'Điểm hành vi',
  SATISFACTION: 'Điểm hài lòng',
};

export default function BehaviorHistoryScreen() {
  const [pageSize, setPageSize] = useState(20);
  const { gutter, contentStyle } = useResponsive();

  const behaviorQuery = useQuery({
    queryKey: queryKeys.behavior,
    queryFn: () => behaviorService.getMine(),
  });

  const historyQuery = useQuery({
    queryKey: queryKeys.behaviorHistory(pageSize),
    queryFn: () => behaviorService.getHistory(pageSize),
  });

  const items = historyQuery.data?.items ?? [];
  const meta = historyQuery.data?.meta;
  const hasMore = meta ? meta.page * meta.pageSize < meta.total : false;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Điểm hành vi" />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        style={contentStyle}
        contentContainerStyle={[styles.list, { paddingHorizontal: gutter }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.scoreCard}>
              <ScoreBar
                label="Điểm hành vi"
                value={behaviorQuery.data?.points ?? 100}
                color={colors.primaryAction}
              />
              <ScoreBar
                label="Điểm hài lòng"
                value={behaviorQuery.data?.satisfaction ?? 100}
                color={colors.gold}
              />
            </View>
            <SectionHeader title="Lịch sử thay đổi" icon="time-outline" />
            {historyQuery.isLoading ? <LoadingView /> : null}
            {historyQuery.isError ? (
              <ErrorView onRetry={() => historyQuery.refetch()} />
            ) : null}
          </View>
        }
        renderItem={({ item }) => <HistoryRow item={item} />}
        ListEmptyComponent={
          historyQuery.isLoading || historyQuery.isError ? undefined : (
            <EmptyState
              icon="analytics-outline"
              title="Chưa có thay đổi"
              description="Điểm hành vi của bạn chưa bị thay đổi lần nào."
            />
          )
        }
        ListFooterComponent={
          hasMore ? (
            <View style={styles.footer}>
              <Button
                label="Tải thêm"
                variant="secondary"
                loading={historyQuery.isFetching}
                onPress={() => setPageSize((value) => value + 20)}
              />
            </View>
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

function ScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.scoreRow}>
      <View style={styles.scoreHeader}>
        <Text style={styles.scoreLabel}>{label}</Text>
        <Text style={styles.scoreValue}>{value}/100</Text>
      </View>
      <View style={styles.scoreTrack}>
        <View
          style={[
            styles.scoreFill,
            { width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

function HistoryRow({ item }: { item: BehaviorHistoryItem }) {
  const added = item.operation === 'ADD';
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: added ? colors.primaryFaint : colors.dangerSoft },
        ]}
      >
        <Ionicons
          name={added ? 'arrow-up' : 'arrow-down'}
          size={16}
          color={added ? colors.primaryAction : colors.danger}
        />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{EVENT_LABELS[item.event]}</Text>
        <Text style={styles.rowMeta}>
          {POINT_TYPE_LABELS[item.pointType]} ·{' '}
          {formatDateTime(item.createdAt)}
        </Text>
        {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
      </View>
      <Text
        style={[
          styles.delta,
          { color: added ? colors.primaryAction : colors.danger },
        ]}
      >
        {added ? '+' : '−'}
        {item.amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { paddingVertical: spacing.sm, gap: spacing.sm, paddingBottom: spacing.xxl },
  headerBlock: { gap: spacing.sm },
  scoreCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  scoreRow: { gap: 6 },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoreLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
    flexShrink: 1,
  },
  scoreValue: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.textStrong,
  },
  scoreTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  scoreFill: { height: '100%', borderRadius: radius.pill },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2, minWidth: 0 },
  rowTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  rowMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  rowNote: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  delta: {
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  footer: { paddingTop: spacing.md },
});
