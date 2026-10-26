import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderService } from '@/api/services/orders';
import { OrderParties } from '@/components/orders/OrderParties';
import { OrderSummary } from '@/components/orders/OrderSummary';
import { AppBar, Button, ErrorView, LoadingView } from '@/components/ui';
import {
  isFinishedOrderStatus,
  orderEndCountdownTarget,
  orderGameNames,
} from '@/features/orders/status';
import {
  formatCountdown,
  formatDateTimeAmPm,
} from '@/lib/format';
import { useCountdown } from '@/hooks/useCountdown';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, spacing } from '@/theme';

export default function HiringStageScreen() {
  const router = useRouter();
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Đang thuê..." />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <OrderParties left={left} right={right} />

        <OrderSummary
          duration={order.totalTimes}
          priceLabel="Tổng chi phí:"
          price={order.totalPrices}
          endLabel="Dự kiến kết thúc:"
          endValue={formatDateTimeAmPm(order.timeFinish)}
          games={orderGameNames(order)}
        />

        <View style={styles.countdownBlock}>
          <Text style={styles.countdownLabel}>Thời gian còn lại:</Text>
          <Text style={styles.countdownValue}>
            {formatCountdown(remaining)}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Kết thúc"
          variant="danger"
          fullWidth={false}
          style={styles.footerButton}
          onPress={() =>
            router.push({
              pathname: '/end-order-early/[orderId]',
              params: { orderId: order.id },
            })
          }
        />
        <Button
          label="Nhắn tin"
          fullWidth={false}
          style={styles.footerButton}
          onPress={() =>
            router.push({
              pathname: '/chat/[orderId]',
              params: { orderId: order.id },
            })
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingBottom: spacing.xl },
  countdownBlock: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: spacing.md,
  },
  countdownLabel: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textMuted,
  },
  countdownValue: {
    fontFamily: fonts.bold,
    fontSize: 40,
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerButton: { flex: 1 },
});
