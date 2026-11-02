import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { orderService } from '@/api/services/orders';
import { OrderParties } from '@/components/orders/OrderParties';
import { OrderSummary } from '@/components/orders/OrderSummary';
import { AppBar, Button, ErrorView, LoadingView } from '@/components/ui';
import {
  isFinishedOrderStatus,
  orderEndCountdownTarget,
  orderGameNames,
} from '@/features/orders/status';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useCountdown } from '@/hooks/useCountdown';
import { useResponsive } from '@/hooks/useResponsive';
import { formatCountdown, formatDateTime } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, radius, spacing } from '@/theme';

export default function HiringStageScreen() {
  const router = useAppRouter();
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle, type } = useResponsive();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';
  const currentUser = useAuthStore((state) => state.user);
  const navigatedToEnd = useRef(false);

  const orderQuery = useQuery({
    queryKey: queryKeys.order(orderId),
    enabled: Boolean(orderId),
    queryFn: async () => (await orderService.getById(orderId)).content,
    refetchInterval: 5000,
  });

  const order = orderQuery.data;
  const countdownTarget = order ? orderEndCountdownTarget(order) : undefined;
  const remaining = useCountdown(countdownTarget);

  useEffect(() => {
    if (!order) return;
    const shouldEnd =
      isFinishedOrderStatus(order.status) || (order.status === 'Starting' && remaining === 0);
    if (!shouldEnd || navigatedToEnd.current) return;
    navigatedToEnd.current = true;
    router.replace({
      pathname: '/end-order/[orderId]',
      params: { orderId: order.id },
    });
  }, [order, remaining, router]);

  if (!orderId || orderQuery.isError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Đang thuê..." />
        <ErrorView onRetry={() => orderQuery.refetch()} />
      </SafeAreaView>
    );
  }

  if (orderQuery.isLoading || !order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Đang thuê..." />
        <LoadingView />
      </SafeAreaView>
    );
  }

  const isHirer = order.user?.id === currentUser?.id;
  const left = isHirer ? order.user : order.toUser;
  const right = isHirer ? order.toUser : order.user;

  const sessionSeconds = Math.max(
    1,
    (new Date(order.timeFinish).getTime() - new Date(order.timeStart).getTime()) /
      1000,
  );
  const progress = Math.min(1, Math.max(0, 1 - remaining / sessionSeconds));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Đang thuê..." />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.column, contentStyle]}>
          <View style={styles.countdownCard}>
            <Text style={styles.countdownLabel}>Thời gian còn lại</Text>
            <Text style={[styles.countdownValue, type.display]}>
              {formatCountdown(remaining)}
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${progress * 100}%` }]} />
            </View>
            <View style={styles.endsRow}>
              <Ionicons
                name="flag-outline"
                size={14}
                color={colors.textMuted}
              />
              <Text style={styles.endsText}>
                Kết thúc lúc {formatDateTime(order.timeFinish)}
              </Text>
            </View>
          </View>

          <OrderParties left={left} right={right} />

          <OrderSummary
            duration={order.totalTimes}
            priceLabel="Tổng chi phí:"
            price={order.totalPrices}
            endLabel="Dự kiến kết thúc:"
            endValue={formatDateTime(order.timeFinish)}
            games={orderGameNames(order)}
          />
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: gutter,
            paddingBottom: insets.bottom + spacing.sm,
          },
        ]}
      >
        <View style={[styles.footerRow, contentStyle]}>
          <View style={styles.footerButton}>
            <Button
              label="Kết thúc"
              variant="danger"
              size="md"
              onPress={() =>
                router.push({
                  pathname: '/end-order-early/[orderId]',
                  params: { orderId: order.id },
                })
              }
            />
          </View>
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
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingVertical: spacing.sm, gap: spacing.sm },
  column: { gap: spacing.sm },
  countdownCard: {
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryFaint,
  },
  countdownLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.primaryAction,
  },
  countdownValue: {
    fontFamily: fonts.bold,
    color: colors.primaryInk,
    letterSpacing: 0.5,
  },
  track: {
    alignSelf: 'stretch',
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryBorder,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primaryAction,
  },
  endsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xxs,
  },
  endsText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  footer: {
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footerButton: { flex: 1, minWidth: 0 },
});
