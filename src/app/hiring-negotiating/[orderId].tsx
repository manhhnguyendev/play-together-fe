import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { orderService } from '@/api/services/orders';
import { CancelOrderDialog } from '@/components/orders/CancelOrderDialog';
import { OrderParties } from '@/components/orders/OrderParties';
import { OrderSummary } from '@/components/orders/OrderSummary';
import {
  AppBar,
  Button,
  ErrorView,
  LoadingView,
  useToast,
} from '@/components/ui';
import {
  isFinishedOrderStatus,
  orderExpectedEnd,
  orderGameNames,
} from '@/features/orders/status';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useCountdown } from '@/hooks/useCountdown';
import { useResponsive } from '@/hooks/useResponsive';
import {
  formatCountdownShort,
  formatDateTime,
} from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, radius, spacing } from '@/theme';

export default function HiringNegotiatingScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle, type } = useResponsive();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';

  const [cancelOpen, setCancelOpen] = useState(false);
  const expiredHandled = useRef(false);

  const orderQuery = useQuery({
    queryKey: queryKeys.order(orderId),
    enabled: Boolean(orderId),
    queryFn: async () => (await orderService.getById(orderId)).content,
    refetchInterval: 5000,
  });

  const order = orderQuery.data;
  const remaining = useCountdown(order?.processExpired);

  const cancelMutation = useMutation({
    mutationFn: (reason: string) =>
      orderService.cancel(order!.id, { reason }),
    onSuccess: () => {
      setCancelOpen(false);
      router.replace('/(tabs)/home');
    },
    onError: (error) =>
      toast.show(
        error instanceof Error ? error.message : 'Không thể hủy yêu cầu.',
        'error',
      ),
  });

  useEffect(() => {
    if (!order) return;
    if (order.status === 'Starting') {
      router.replace({
        pathname: '/hiring-stage/[orderId]',
        params: { orderId: order.id },
      });
    } else if (isFinishedOrderStatus(order.status)) {
      router.replace('/(tabs)/home');
    }
  }, [order, router]);

  useEffect(() => {
    if (!order || order.status !== 'Processing' || remaining > 0) return;
    if (expiredHandled.current) return;
    expiredHandled.current = true;
    cancelMutation.mutate('Quá thời gian gửi yêu cầu');
  }, [order, remaining, cancelMutation]);

  if (!orderId || orderQuery.isError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Đang chờ chấp thuận..." />
        <ErrorView onRetry={() => orderQuery.refetch()} />
      </SafeAreaView>
    );
  }

  if (orderQuery.isLoading || !order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Đang chờ chấp thuận..." />
        <LoadingView />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Đang chờ chấp thuận..." />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.column, contentStyle]}>
          <View style={styles.statusCard}>
            <View style={styles.pulse}>
              <View style={styles.pulseDot} />
            </View>
            <Text style={styles.statusLabel}>
              Đang chờ {order.toUser?.name ?? 'người chơi'} chấp thuận
            </Text>
            <Text style={[styles.countdownValue, type.display]}>
              {formatCountdownShort(remaining)}
            </Text>
            <Text style={styles.countdownLabel}>Yêu cầu sẽ bị hủy sau</Text>
          </View>

          <OrderParties left={order.user} right={order.toUser} />

          <OrderSummary
            duration={order.totalTimes}
            priceLabel="Tổng chi phí:"
            price={order.totalPrices}
            endLabel="Dự kiến kết thúc:"
            endValue={formatDateTime(orderExpectedEnd(order))}
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
        <View style={styles.footerRow}>
          <Button
            label="Hủy yêu cầu"
            variant="danger"
            size="md"
            onPress={() => setCancelOpen(true)}
          />
        </View>
      </View>

      <CancelOrderDialog
        visible={cancelOpen}
        title="Hủy yêu cầu thuê đơn này?"
        placeholder="Nhập lý do hủy"
        loading={cancelMutation.isPending}
        onDismiss={() => setCancelOpen(false)}
        onConfirm={(reason) => cancelMutation.mutate(reason)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingVertical: spacing.sm, gap: spacing.sm },
  column: { gap: spacing.sm },
  statusCard: {
    alignItems: 'center',
    gap: 6,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  pulse: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryFaint,
    marginBottom: spacing.xxs,
  },
  pulseDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primaryAction,
  },
  statusLabel: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
    textAlign: 'center',
  },
  countdownValue: {
    fontFamily: fonts.bold,
    color: colors.primaryInk,
    letterSpacing: 1,
    marginTop: spacing.xs,
  },
  countdownLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  footer: {
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerRow: { maxWidth: 420, width: '100%', alignSelf: 'center' },
});
