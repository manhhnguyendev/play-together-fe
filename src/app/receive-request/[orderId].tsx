import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { orderService } from '@/api/services/orders';
import { CancelOrderDialog } from '@/components/orders/CancelOrderDialog';
import {
  AppBar,
  Avatar,
  Button,
  ErrorView,
  LoadingView,
  SectionHeader,
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
  formatVnd,
  isEmptyDate,
} from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, radius, spacing } from '@/theme';

/**
 * Accepting an instant hire starts the session; accepting a booking only holds
 * the slot, which belongs on the order screen where it can still be cancelled.
 */
function sessionRouteFor(status: string): '/end-order/[orderId]' | '/hiring-stage/[orderId]' {
  return status === 'Scheduled' ? '/end-order/[orderId]' : '/hiring-stage/[orderId]';
}

export default function ReceiveRequestScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle, type, isSmall } = useResponsive();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';

  const [rejectOpen, setRejectOpen] = useState(false);
  const expiredHandled = useRef(false);

  const orderQuery = useQuery({
    queryKey: queryKeys.order(orderId),
    enabled: Boolean(orderId),
    queryFn: async () => (await orderService.getById(orderId)).content,
    refetchInterval: 5000,
  });

  const order = orderQuery.data;
  const remaining = useCountdown(order?.processExpired);

  const acceptMutation = useMutation({
    mutationFn: async () => {
      await orderService.accept(order!.id, { isAccept: true });
      return (await orderService.getById(order!.id)).content;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.order(updated.id), updated);
      router.replace({
        pathname: sessionRouteFor(updated.status),
        params: { orderId: updated.id },
      });
    },
    onError: (error) =>
      toast.show(
        error instanceof Error ? error.message : 'Không thể chấp nhận yêu cầu.',
        'error',
      ),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) =>
      orderService.reject(order!.id, { isAccept: false, reason }),
    onSuccess: () => {
      setRejectOpen(false);
      router.replace('/(tabs)/home');
    },
    onError: (error) =>
      toast.show(
        error instanceof Error ? error.message : 'Không thể từ chối yêu cầu.',
        'error',
      ),
  });

  useEffect(() => {
    if (!order) return;
    if (order.status === 'Starting' || order.status === 'Scheduled') {
      router.replace({
        pathname: sessionRouteFor(order.status),
        params: { orderId: order.id },
      });
    } else if (order.status !== 'Processing' && isFinishedOrderStatus(order.status)) {
      router.replace('/(tabs)/home');
    }
  }, [order, router]);

  useEffect(() => {
    if (!order || order.status !== 'Processing' || remaining > 0) return;
    if (expiredHandled.current) return;
    expiredHandled.current = true;
    rejectMutation.mutate('Quá thời gian chấp thuận');
  }, [order, remaining, rejectMutation]);

  if (!orderId || orderQuery.isError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Bạn nhận được yêu cầu thuê" />
        <ErrorView onRetry={() => orderQuery.refetch()} />
      </SafeAreaView>
    );
  }

  if (orderQuery.isLoading || !order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Bạn nhận được yêu cầu thuê" />
        <LoadingView />
      </SafeAreaView>
    );
  }

  const games = orderGameNames(order);
  const expectedEnd = orderExpectedEnd(order);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Bạn nhận được yêu cầu thuê" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.column, contentStyle]}>
          <View style={styles.countdownCard}>
            <Text style={styles.countdownLabel}>Yêu cầu sẽ bị hủy sau</Text>
            <Text style={[styles.countdownValue, type.display]}>
              {formatCountdownShort(remaining)}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.requesterRow}>
              <Avatar
                uri={order.user?.avatar}
                name={order.user?.name ?? ''}
                size={isSmall ? 56 : 64}
              />
              <View style={styles.requesterInfo}>
                <Text style={styles.requesterName} numberOfLines={1}>
                  {order.user?.name ?? 'Người thuê'}
                </Text>
                <Text style={styles.requesterHint}>Muốn thuê bạn</Text>
              </View>
              <Text style={styles.offerPrice}>{formatVnd(order.totalPrices)}</Text>
            </View>
            <View style={styles.divider} />
            <InfoLine label="Thời lượng" value={`${order.totalTimes} giờ`} />
            {!isEmptyDate(order.timeStart) ? (
              <InfoLine
                label="Bắt đầu lúc"
                value={formatDateTime(order.timeStart)}
              />
            ) : null}
            <InfoLine
              label="Dự kiến kết thúc"
              value={formatDateTime(expectedEnd)}
            />
          </View>

          <View style={styles.card}>
            <SectionHeader title="Tựa game đã chọn" icon="game-controller-outline" />
            {games.map((name, index) => (
              <View key={`${name}-${index}`} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bullet}>{name}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <SectionHeader title="Lời nhắn" icon="chatbubble-ellipses-outline" />
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>{order.message || '—'}</Text>
            </View>
          </View>
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
              label="Từ chối"
              variant="secondary"
              size="md"
              onPress={() => setRejectOpen(true)}
            />
          </View>
          <View style={styles.footerButton}>
            <Button
              label="Chấp nhận"
              size="md"
              loading={acceptMutation.isPending}
              onPress={() => acceptMutation.mutate()}
            />
          </View>
        </View>
      </View>

      <CancelOrderDialog
        visible={rejectOpen}
        title="Từ chối nhận đơn thuê này?"
        placeholder="Nhập lý do từ chối"
        loading={rejectMutation.isPending}
        onDismiss={() => setRejectOpen(false)}
        onConfirm={(reason) => rejectMutation.mutate(reason)}
      />
    </SafeAreaView>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
  countdownCard: {
    alignItems: 'center',
    gap: 6,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryFaint,
  },
  countdownLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.primaryAction,
  },
  countdownValue: {
    fontFamily: fonts.bold,
    color: colors.primaryInk,
    letterSpacing: 0.5,
  },
  requesterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  requesterInfo: { flex: 1, minWidth: 0, gap: 2 },
  requesterName: {
    fontFamily: fonts.bold,
    fontSize: 17,
    letterSpacing: -0.2,
    color: colors.text,
  },
  requesterHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  offerPrice: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.primaryInk,
    marginLeft: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 7,
  },
  infoLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
    textAlign: 'right',
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
  messageBox: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.xxs,
    backgroundColor: colors.background,
  },
  messageText: {
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
  footerRow: { flexDirection: 'row', gap: spacing.sm },
  footerButton: { flex: 1, minWidth: 0 },
});
