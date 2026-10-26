import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderService } from '@/api/services/orders';
import { OrderParties } from '@/components/orders/OrderParties';
import {
  AppBar,
  Button,
  ErrorView,
  LoadingView,
  useToast,
} from '@/components/ui';
import { formatVnd } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, radius, spacing } from '@/theme';

const OTHER_REASON = 'other';

const REASONS = [
  'Có việc bận đột xuất',
  'Thông tin không chính xác',
  'Ngôn ngữ lăng mạ',
  'Cố tình AFK',
];

export default function EndOrderEarlyScreen() {
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';
  const currentUser = useAuthStore((state) => state.user);

  const [selected, setSelected] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');

  const orderQuery = useQuery({
    queryKey: queryKeys.order(orderId),
    enabled: Boolean(orderId),
    queryFn: async () => (await orderService.getById(orderId)).content,
  });

  const finishMutation = useMutation({
    mutationFn: (reason: string) =>
      orderService.finishSoon(order!.id, { reason }),
    onSuccess: async () => {
      const updated = (await orderService.getById(order!.id)).content;
      router.replace({
        pathname: '/end-order/[orderId]',
        params: { orderId: updated.id },
      });
    },
    onError: () =>
      toast.show(
        'Bạn chỉ có thể kết thúc sau khi hoàn thành 1/10 thời gian thuê',
        'error',
      ),
  });

  if (!orderId || orderQuery.isError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Kết thúc thuê sớm" />
        <ErrorView onRetry={() => orderQuery.refetch()} />
      </SafeAreaView>
    );
  }

  if (orderQuery.isLoading || !orderQuery.data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Kết thúc thuê sớm" />
        <LoadingView />
      </SafeAreaView>
    );
  }

  const order = orderQuery.data;
  const isHirer = order.user?.id === currentUser?.id;
  const left = isHirer ? order.user : order.toUser;
  const right = isHirer ? order.toUser : order.user;

  const submit = () => {
    const reason =
      selected === OTHER_REASON ? customReason.trim() : (selected ?? '');
    if (!reason) {
      toast.show('Vui lòng nhập lý do!', 'error');
      return;
    }
    finishMutation.mutate(reason);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Kết thúc thuê sớm" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <OrderParties left={left} right={right} />

        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {order.totalTimes} giờ · {formatVnd(order.totalPrices)}
          </Text>
        </View>

        <View style={styles.reasons}>
          {REASONS.map((reason) => (
            <ReasonRow
              key={reason}
              label={reason}
              selected={selected === reason}
              onPress={() => setSelected(reason)}
            />
          ))}
          <ReasonRow
            label="Lý do khác"
            selected={selected === OTHER_REASON}
            onPress={() => setSelected(OTHER_REASON)}
          />
          {selected === OTHER_REASON ? (
            <TextInput
              value={customReason}
              onChangeText={setCustomReason}
              placeholder="Nhập lý do của bạn"
              placeholderTextColor={colors.textFaint}
              style={styles.input}
              maxLength={500}
            />
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Kết thúc"
          onPress={submit}
          loading={finishMutation.isPending}
        />
      </View>
    </SafeAreaView>
  );
}

function ReasonRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.reasonRow, pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <Text style={styles.reasonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingBottom: spacing.xxl },
  summary: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  summaryText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textMuted,
  },
  reasons: { paddingHorizontal: spacing.md, gap: spacing.xxs },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  reasonLabel: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  input: {
    marginTop: spacing.xs,
    marginLeft: 30,
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: 14,
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
