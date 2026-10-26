import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { useCountdown } from '@/hooks/useCountdown';
import {
  formatCountdownShort,
  formatDateTimeAmPm,
} from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, spacing } from '@/theme';

export default function HiringNegotiatingScreen() {
  const router = useRouter();
  const toast = useToast();
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
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <OrderParties left={order.user} right={order.toUser} />

        <OrderSummary
          duration={order.totalTimes}
          priceLabel="Tổng chi phí:"
          price={order.totalPrices}
          endLabel="Dự kiến kết thúc:"
          endValue={formatDateTimeAmPm(orderExpectedEnd(order))}
          games={orderGameNames(order)}
        />

        <View style={styles.countdownBlock}>
          <Text style={styles.countdownLabel}>Yêu cầu sẽ bị hủy sau:</Text>
          <Text style={styles.countdownValue}>
            {formatCountdownShort(remaining)}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Hủy yêu cầu"
          variant="danger"
          onPress={() => setCancelOpen(true)}
        />
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
