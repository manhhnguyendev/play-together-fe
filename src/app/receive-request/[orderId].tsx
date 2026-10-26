import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderService } from '@/api/services/orders';
import { CancelOrderDialog } from '@/components/orders/CancelOrderDialog';
import {
  AppBar,
  Avatar,
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
import {
  formatCountdownShort,
  formatDateTimeAmPm,
  formatVnd,
} from '@/lib/format';
import { useCountdown } from '@/hooks/useCountdown';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, radius, spacing } from '@/theme';

export default function ReceiveRequestScreen() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
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
        pathname: '/hiring-stage/[orderId]',
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
    if (order.status === 'Starting') {
      router.replace({
        pathname: '/hiring-stage/[orderId]',
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
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Avatar uri={order.user?.avatar} name={order.user?.name} size={110} />
          <View style={styles.headerInfo}>
            <Text style={styles.requesterName} numberOfLines={1}>
              {order.user?.name ?? 'Người thuê'}
            </Text>
            <InfoLine label="Thời lượng:" value={`${order.totalTimes} giờ`} />
            <InfoLine label="Chi phí:" value={formatVnd(order.totalPrices)} />
            <InfoLine
              label="Dự kiến kết thúc:"
              value={formatDateTimeAmPm(expectedEnd)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tựa game đã chọn:</Text>
          {games.map((name, index) => (
            <Text key={`${name}-${index}`} style={styles.bullet}>
              • {name}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lời nhắn:</Text>
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{order.message || '—'}</Text>
          </View>
        </View>

        <View style={styles.countdownBlock}>
          <Text style={styles.countdownLabel}>Yêu cầu sẽ bị hủy sau</Text>
          <Text style={styles.countdownValue}>
            {formatCountdownShort(remaining)}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Từ chối"
          variant="secondary"
          fullWidth={false}
          style={styles.footerButton}
          onPress={() => setRejectOpen(true)}
        />
        <Button
          label="Chấp nhận"
          fullWidth={false}
          style={styles.footerButton}
          loading={acceptMutation.isPending}
          onPress={() => acceptMutation.mutate()}
        />
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
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  headerInfo: { flex: 1, gap: 2 },
  requesterName: {
    fontFamily: fonts.semibold,
    fontSize: 19,
    color: colors.text,
    marginBottom: spacing.xxs,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 5,
  },
  infoLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  infoValue: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
    textAlign: 'right',
  },
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
  messageBox: {
    minHeight: 130,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.xxs,
  },
  messageText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
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
