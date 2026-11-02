import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { orderService } from '@/api/services/orders';
import { OrderParties } from '@/components/orders/OrderParties';
import {
  AppBar,
  Button,
  ErrorView,
  LoadingView,
  SectionHeader,
  useToast,
} from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { formatVnd } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, control, fonts, radius, spacing, touchTarget } from '@/theme';

const OTHER_REASON = 'other';

const REASONS = [
  'Có việc bận đột xuất',
  'Thông tin không chính xác',
  'Ngôn ngữ lăng mạ',
  'Cố tình AFK',
];

export default function EndOrderEarlyScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle } = useResponsive();
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.column, contentStyle]}>
            <OrderParties left={left} right={right} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>
                {order.totalTimes} giờ
              </Text>
              <Text style={styles.summaryDot}>·</Text>
              <Text style={styles.summaryValue}>
                {formatVnd(order.totalPrices)}
              </Text>
            </View>

            <View style={styles.card}>
              <SectionHeader title="Lý do kết thúc sớm" icon="help-circle-outline" />
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
                    accessibilityLabel="Lý do khác"
                    style={styles.input}
                    maxLength={500}
                  />
                ) : null}
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
          <View style={styles.footerRow}>
            <Button
              label="Kết thúc"
              variant="danger"
              size="md"
              onPress={submit}
              loading={finishMutation.isPending}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
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
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.reasonRow,
        pressed && styles.pressed,
        selected && styles.reasonRowSelected,
      ]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <Text style={[styles.reasonLabel, selected && styles.reasonLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { paddingVertical: spacing.sm, gap: spacing.sm },
  column: { gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  summaryText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryDot: { fontFamily: fonts.regular, fontSize: 14, color: colors.textFaint },
  summaryValue: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primaryInk,
  },
  reasons: { gap: spacing.xxs, marginTop: spacing.xxs },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTarget,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  reasonRowSelected: { backgroundColor: colors.primaryFaint },
  pressed: { opacity: 0.7 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primaryAction },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryAction,
  },
  reasonLabel: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  reasonLabelActive: { fontFamily: fonts.semibold, color: colors.primaryInk },
  input: {
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
    minHeight: control.inputHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
  footer: {
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerRow: { maxWidth: 420, width: '100%', alignSelf: 'center' },
});
