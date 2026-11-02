import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { orderService } from '@/api/services/orders';
import { OrderParties } from '@/components/orders/OrderParties';
import { CancelOrderDialog } from '@/components/orders/CancelOrderDialog';
import { AppBar, Button, ErrorView, LoadingView, useToast } from '@/components/ui';
import {
  endOrderStatusLabel,
  isAwaitingReconciliation,
  isBookedSession,
  isFeedbackOpenOrder,
  isLiveSession,
  orderGameNames,
  orderHirerFinalPrice,
  orderStatusColor,
  reconciliationDeadline,
} from '@/features/orders/status';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useCountdown } from '@/hooks/useCountdown';
import { useResponsive } from '@/hooks/useResponsive';
import {
  formatCountdown,
  formatDateTime,
  formatVnd,
  isEmptyDate,
} from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, hitSlop, radius, spacing, touchTarget } from '@/theme';

export default function EndOrderScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle } = useResponsive();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';
  const currentUser = useAuthStore((state) => state.user);

  const orderQuery = useQuery({
    queryKey: queryKeys.order(orderId),
    enabled: Boolean(orderId),
    queryFn: async () => (await orderService.getById(orderId)).content,
    // The scheduler moves a finished session into reconciliation on its own
    // tick, so this screen has to notice without the user re-opening it.
    refetchInterval: 10_000,
  });

  const order = orderQuery.data;
  const confirmable = order ? isAwaitingReconciliation(order) : false;
  const booked = order ? isBookedSession(order) : false;
  const live = order ? isLiveSession(order) : false;
  const deadline = order ? reconciliationDeadline(order) : null;
  const secondsToPayout = useCountdown(confirmable ? deadline : null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const confirmMutation = useMutation({
    mutationFn: () => orderService.finish(order!.id),
    onSuccess: () => orderQuery.refetch(),
    onError: () => toast.show('Chưa xác nhận được đơn này', 'error'),
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => orderService.cancel(order!.id, { reason }),
    onSuccess: () => {
      setCancelOpen(false);
      return orderQuery.refetch();
    },
    onError: () => toast.show('Chưa hủy được lịch hẹn này', 'error'),
  });

  if (!orderId || orderQuery.isError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Chi tiết thuê" />
        <ErrorView onRetry={() => orderQuery.refetch()} />
      </SafeAreaView>
    );
  }

  if (orderQuery.isLoading || !order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Chi tiết thuê" />
        <LoadingView />
      </SafeAreaView>
    );
  }

  const isHirer = order.userId === currentUser?.id;
  const isPlayer = order.toUserId === currentUser?.id;
  const participant = isHirer || isPlayer;
  // The rating form is written from the hirer's side ("đánh giá người chơi"),
  // so only they get the shortcut here; `canRate` is the server's rule.
  const canGiveRating = isHirer && order.canRate;
  const reportable = isFeedbackOpenOrder(order);
  const left = isHirer ? order.user : order.toUser;
  const right = isHirer ? order.toUser : order.user;
  const games = orderGameNames(order);
  const hasStarted = !isEmptyDate(order.timeStart);

  // Each handler is only reachable from the button that renders for its state.
  const openRating = () => {
    router.replace({
      pathname: '/rating/[orderId]',
      params: { orderId: order.id },
    });
  };

  const openStage = () => {
    router.push({
      pathname: '/hiring-stage/[orderId]',
      params: { orderId: order.id },
    });
  };

  const reportAction = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Báo cáo đơn này"
      hitSlop={hitSlop.sm}
      onPress={() =>
        router.push({
          pathname: '/report/[orderId]',
          params: { orderId: order.id },
        })
      }
      style={({ pressed }) => [styles.reportButton, pressed && styles.pressed]}
    >
      <Ionicons name="warning-outline" size={20} color={colors.textSecondary} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Chi tiết thuê" right={reportable ? reportAction : undefined} />
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
              style={[
                styles.status,
                { color: orderStatusColor(order.status) },
              ]}
            >
              {endOrderStatusLabel(order.status)}
            </Text>
          </View>

          {confirmable ? (
            <View style={styles.reconcileCard}>
              <Text style={styles.sectionTitle}>Chờ xác nhận hoàn thành</Text>
              <Text style={styles.reconcileText}>
                {isHirer
                  ? 'Phiên thuê đã kết thúc và tiền của bạn vẫn đang được giữ. Xác nhận để giải ngân cho người chơi, hoặc báo cáo nếu có vấn đề.'
                  : 'Người thuê đang xác nhận phiên vừa kết thúc. Thu nhập của bạn sẽ được giải ngân khi họ xác nhận hoặc khi hết hạn đối soát.'}
              </Text>
              {deadline ? (
                <View style={styles.reconcileTimer}>
                  <Ionicons
                    name="time-outline"
                    size={15}
                    color={colors.warning}
                  />
                  <Text style={styles.reconcileCountdown}>
                    Tự động thanh toán sau {formatCountdown(secondsToPayout)}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {booked ? (
            <View style={styles.reconcileCard}>
              <Text style={styles.sectionTitle}>Lịch hẹn đã được giữ</Text>
              <Text style={styles.reconcileText}>
                Phiên thuê sẽ tự bắt đầu lúc{' '}
                {formatDateTime(order.timeStart)} và kéo dài{' '}
                {order.totalTimes} giờ. Hủy trước giờ bắt đầu sẽ hoàn lại đầy đủ
                và không ảnh hưởng đến người chơi.
              </Text>
            </View>
          ) : null}

          <OrderParties left={left} right={right} />

          <View style={styles.card}>
            <Row label="Thời lượng thuê" value={`${order.totalTimes} giờ`} />
            {isHirer ? (
              <>
                <Divider />
                <Row label="Chi phí dự kiến" value={formatVnd(order.totalPrices)} />
                <Row
                  label="Chi phí cuối cùng"
                  value={formatVnd(orderHirerFinalPrice(order))}
                  emphasis
                />
              </>
            ) : null}
            {isPlayer ? (
              <>
                <Divider />
                <Row label="Số tiền dự kiến" value={formatVnd(order.totalPrices)} />
                <Row
                  label="Số tiền nhận được"
                  value={formatVnd(order.finalPrices)}
                  emphasis
                />
              </>
            ) : null}
            <Divider />
            {hasStarted ? (
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
            ) : (
              <Row
                label="Thời gian"
                value={formatDateTime(order.processExpired)}
              />
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

          {order.reason && order.reason.trim().length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Lý do kết thúc</Text>
              <View style={styles.reasonBox}>
                <Text style={styles.reasonText}>{order.reason}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {participant && (confirmable || booked || live || canGiveRating) ? (
        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: gutter,
              paddingBottom: insets.bottom + spacing.sm,
            },
          ]}
        >
          <View style={confirmable || booked ? styles.footerPair : styles.footerRow}>
            {confirmable ? (
              <>
                <View style={styles.footerButton}>
                  <Button
                    label="Có vấn đề"
                    variant="secondary"
                    size="md"
                    onPress={() =>
                      router.push({
                        pathname: '/report/[orderId]',
                        params: { orderId: order.id },
                      })
                    }
                  />
                </View>
                <View style={styles.footerButton}>
                  <Button
                    label="Xác nhận hoàn thành"
                    size="md"
                    loading={confirmMutation.isPending}
                    disabled={confirmMutation.isPending}
                    onPress={() => confirmMutation.mutate()}
                  />
                </View>
              </>
            ) : booked ? (
              <>
                {isHirer ? (
                  <View style={styles.footerButton}>
                    <Button
                      label="Hủy lịch hẹn"
                      variant="danger"
                      size="md"
                      onPress={() => setCancelOpen(true)}
                    />
                  </View>
                ) : null}
                <View style={styles.footerButton}>
                  <Button
                    label="Nhắn tin"
                    variant="secondary"
                    size="md"
                    onPress={() =>
                      router.push({
                        pathname: '/chat/[orderId]',
                        params: { orderId: order.id },
                      })
                    }
                  />
                </View>
              </>
            ) : live ? (
              <Button label="Vào phiên đang thuê" size="md" onPress={openStage} />
            ) : canGiveRating ? (
              <Button label="Đánh giá" size="md" onPress={openRating} />
            ) : null}
          </View>
        </View>
      ) : null}

      <CancelOrderDialog
        visible={cancelOpen}
        title="Hủy lịch hẹn này?"
        placeholder="Lý do (không bắt buộc)"
        loading={cancelMutation.isPending}
        onDismiss={() => setCancelOpen(false)}
        onConfirm={(reason) => cancelMutation.mutate(reason)}
      />
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

function Divider() {
  return <View style={styles.divider} />;
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
  reportButton: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
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
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  reconcileCard: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryFaint,
  },
  reconcileText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  reconcileTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xxs,
  },
  reconcileCountdown: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
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
  rowEmphasis: {
    fontFamily: fonts.bold,
    color: colors.primaryInk,
    fontSize: 15,
  },
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
    borderRadius: 3,
    backgroundColor: colors.primaryMuted,
  },
  bullet: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  reasonBox: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
  },
  reasonText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  footer: {
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerRow: { maxWidth: 420, width: '100%', alignSelf: 'center' },
  footerPair: {
    flexDirection: 'row',
    gap: spacing.sm,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  footerButton: { flex: 1, minWidth: 0 },
});
