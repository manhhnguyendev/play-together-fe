import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderService } from '@/api/services/orders';
import { OrderParties } from '@/components/orders/OrderParties';
import { AppBar, ErrorView, LoadingView } from '@/components/ui';
import {
  isClosedOrder,
  orderGameNames,
  orderHirerFinalPrice,
  orderStatusColor,
  orderStatusLabel,
} from '@/features/orders/status';
import { useResponsive } from '@/hooks/useResponsive';
import {
  formatDateTime,
  formatVnd,
  isEmptyDate,
} from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, radius, spacing, touchTarget } from '@/theme';

export default function HistoryDetailScreen() {
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';
  const currentUser = useAuthStore((state) => state.user);
  const { gutter, contentStyle } = useResponsive();

  const detailQuery = useQuery({
    queryKey: queryKeys.orderDetail(orderId),
    enabled: Boolean(orderId),
    queryFn: async () => (await orderService.getDetailById(orderId)).content,
  });

  const historyQuery = useQuery({
    queryKey: queryKeys.orderHistory(orderId),
    enabled: Boolean(orderId),
    queryFn: () => orderService.getHistory(orderId),
  });

  if (!orderId || detailQuery.isError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Chi tiết lượt thuê" />
        <ErrorView onRetry={() => detailQuery.refetch()} />
      </SafeAreaView>
    );
  }

  if (detailQuery.isLoading || !detailQuery.data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Chi tiết lượt thuê" />
        <LoadingView />
      </SafeAreaView>
    );
  }

  const order = detailQuery.data;
  const isHirer = order.userId === currentUser?.id;
  const isPlayer = order.toUserId === currentUser?.id;
  const left = isHirer ? order.user : order.toUser;
  const right = isHirer ? order.toUser : order.user;
  const games = orderGameNames(order);
  const rating = isClosedOrder(order.status)
    ? null
    : (order.ratings?.[0] ?? null);
  const showFinalPrice = isHirer && !isClosedOrder(order.status);
  const hasReason = Boolean(order.reason && order.reason.trim().length > 0);
  const timeline = historyQuery.data ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Chi tiết lượt thuê" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.column, contentStyle]}>
          <View style={styles.statusCard}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: orderStatusColor(order.status) },
              ]}
            />
            <Text
              style={[styles.status, { color: orderStatusColor(order.status) }]}
            >
              {orderStatusLabel(order.status)}
            </Text>
          </View>

          <OrderParties left={left} right={right} />

          <View style={styles.card}>
            <Row label="Thời lượng thuê" value={`${order.totalTimes} giờ`} />
            {isHirer ? (
              <Row label="Chi phí dự kiến" value={formatVnd(order.totalPrices)} />
            ) : null}
            {isPlayer ? (
              <Row
                label="Số tiền dự kiến"
                value={formatVnd(order.totalPrices)}
              />
            ) : null}
            {showFinalPrice ? (
              <Row
                label="Chi phí cuối cùng"
                value={formatVnd(orderHirerFinalPrice(order))}
                emphasis
              />
            ) : null}
            {isPlayer ? (
              <Row
                label="Số tiền nhận được"
                value={formatVnd(order.finalPrices)}
                emphasis
              />
            ) : null}
            <View style={styles.divider} />
            {isEmptyDate(order.timeStart) ? (
              <Row
                label="Thời gian"
                value={formatDateTime(order.processExpired)}
              />
            ) : (
              <>
                <Row
                  label="Thời gian bắt đầu"
                  value={formatDateTime(order.timeStart)}
                />
                <Row
                  label="Thời gian kết thúc"
                  value={formatDateTime(order.timeFinish)}
                />
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tựa game đã chọn</Text>
            {games.map((name, index) => (
              <View key={`${name}-${index}`} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bullet}>{name}</Text>
              </View>
            ))}
          </View>

          {hasReason ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Lý do</Text>
              <Text style={styles.reasonText}>{order.reason}</Text>
            </View>
          ) : null}

          {timeline.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Tiến trình</Text>
              {timeline.map((entry, index) => (
                <View key={entry.id} style={styles.timelineRow}>
                  <View style={styles.timelineMarker}>
                    <View
                      style={[
                        styles.timelineDot,
                        { backgroundColor: orderStatusColor(entry.toStatus) },
                      ]}
                    />
                    {index < timeline.length - 1 ? (
                      <View style={styles.timelineLine} />
                    ) : null}
                  </View>
                  <View style={styles.timelineBody}>
                    <Text style={styles.timelineTitle}>
                      {orderStatusLabel(entry.toStatus)}
                    </Text>
                    <Text style={styles.timelineTime}>
                      {formatDateTime(entry.createdAt)}
                    </Text>
                    {entry.reason ? (
                      <Text style={styles.timelineReason}>{entry.reason}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {rating ? (
            <View style={styles.card}>
              <View style={styles.ratingRow}>
                <Text style={styles.sectionTitle}>Đánh giá</Text>
                <View style={styles.ratingValue}>
                  <Ionicons name="star" size={14} color={colors.gold} />
                  <Text style={styles.ratingNumber}>{rating.rate}</Text>
                </View>
              </View>
              <View style={styles.commentBox}>
                <Text style={styles.commentText}>{rating.comment}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, emphasis && styles.rowEmphasis]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingVertical: spacing.sm, gap: spacing.sm },
  column: { gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 2,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: touchTarget,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  statusDot: { width: 9, height: 9, borderRadius: radius.pill },
  status: {
    fontFamily: fonts.bold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xxs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: 8,
  },
  rowLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  rowValue: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
    textAlign: 'right',
  },
  rowEmphasis: { fontFamily: fonts.bold, color: colors.primaryInk },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: spacing.xxs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 3,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryMuted,
  },
  bullet: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  reasonText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  ratingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingNumber: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  commentBox: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
  },
  commentText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  timelineRow: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.xs },
  timelineMarker: { alignItems: 'center', width: 12 },
  timelineDot: { width: 10, height: 10, borderRadius: radius.pill, marginTop: 5 },
  timelineLine: {
    flex: 1,
    width: 2,
    marginTop: 4,
    backgroundColor: colors.border,
  },
  timelineBody: { flex: 1, paddingBottom: spacing.md, gap: 2 },
  timelineTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  timelineTime: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  timelineReason: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
});
