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
import {
  formatDateTimeAmPm,
  formatVnd,
  isEmptyDate,
} from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, radius, spacing } from '@/theme';

export default function HistoryDetailScreen() {
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';
  const currentUser = useAuthStore((state) => state.user);

  const detailQuery = useQuery({
    queryKey: queryKeys.orderDetail(orderId),
    enabled: Boolean(orderId),
    queryFn: async () => (await orderService.getDetailById(orderId)).content,
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Chi tiết lượt thuê" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[styles.status, { color: orderStatusColor(order.status) }]}
        >
          {orderStatusLabel(order.status)}
        </Text>

        <OrderParties left={left} right={right} />

        <View style={styles.rows}>
          <Row label="Thời lượng thuê:" value={`${order.totalTimes} giờ`} />
          {isHirer ? (
            <Row
              label="Chi phí dự kiến:"
              value={formatVnd(order.totalPrices)}
            />
          ) : null}
          {isPlayer ? (
            <Row
              label="Số tiền dự kiến:"
              value={formatVnd(order.totalPrices)}
            />
          ) : null}
          {showFinalPrice ? (
            <Row
              label="Chi phí cuối cùng:"
              value={formatVnd(orderHirerFinalPrice(order))}
              emphasis
            />
          ) : null}
          {isPlayer ? (
            <Row
              label="Số tiền nhận được:"
              value={formatVnd(order.finalPrices)}
              emphasis
            />
          ) : null}
          {isEmptyDate(order.timeStart) ? (
            <Row
              label="Thời gian:"
              value={formatDateTimeAmPm(order.processExpired)}
            />
          ) : (
            <>
              <Row
                label="Thời gian bắt đầu:"
                value={formatDateTimeAmPm(order.timeStart)}
              />
              <Row
                label="Thời gian kết thúc:"
                value={formatDateTimeAmPm(order.timeFinish)}
              />
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tựa game đã chọn:</Text>
          {games.map((name, index) => (
            <Text key={`${name}-${index}`} style={styles.bullet}>
              • {name}
            </Text>
          ))}
        </View>

        {hasReason ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lý do :</Text>
            <Text style={styles.reasonText}>{order.reason}</Text>
          </View>
        ) : null}

        {rating ? (
          <View style={styles.section}>
            <View style={styles.ratingRow}>
              <Text style={styles.sectionTitle}>Đánh giá: </Text>
              <Text style={styles.ratingValue}>★ {rating.rate}</Text>
            </View>
            <View style={styles.commentBox}>
              <Text style={styles.commentText}>{rating.comment}</Text>
            </View>
          </View>
        ) : null}
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
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingBottom: spacing.xxl },
  status: {
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 16,
    paddingTop: spacing.md,
  },
  rows: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: 8,
  },
  rowLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  rowValue: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
    textAlign: 'right',
  },
  rowEmphasis: { fontFamily: fonts.bold, color: colors.primaryDark },
  section: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: 4,
  },
  sectionTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  bullet: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    paddingLeft: spacing.xs,
  },
  reasonText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingValue: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.warning,
  },
  commentBox: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  commentText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
});
