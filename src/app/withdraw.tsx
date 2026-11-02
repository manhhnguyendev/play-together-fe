import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { userService } from '@/api/services/users';
import {
  AppBar,
  Button,
  FLOAT_BAND_STYLE,
  TextField,
  useToast,
} from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { formatNumber, parseAmount } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, radius, spacing } from '@/theme';

const MIN_WITHDRAW = 10000;
const MAX_WITHDRAW = 50000000;

export default function WithdrawScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { gutter, contentStyle, type } = useResponsive();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? '';

  const [moneyText, setMoneyText] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const balanceQuery = useQuery({
    queryKey: queryKeys.userBalance(userId),
    enabled: Boolean(userId),
    queryFn: async () => (await userService.getUserBalance(userId)).content,
  });

  const activeBalance =
    balanceQuery.data?.activeBalance ?? user?.userBalance.activeBalance ?? 0;

  const submit = async () => {
    if (submitting) return;
    const amount = parseAmount(moneyText);
    if (!moneyText.trim()) {
      toast.show('Vui lòng nhập số tiền!', 'error');
      return;
    }
    if (amount < MIN_WITHDRAW) {
      toast.show('Số tiền rút tối thiểu là 10.000đ', 'error');
      return;
    }
    if (amount >= MAX_WITHDRAW) {
      toast.show('Số tiền rút tối đa là 50.000.000đ', 'error');
      return;
    }
    // A failed balance read leaves a possibly stale number on screen. Letting
    // the request through would either reject it with a misleading "not enough"
    // or start a withdrawal against money that may no longer be there.
    if (balanceQuery.isError) {
      toast.show('Không kiểm tra được số dư. Hãy thử tải lại.', 'error');
      return;
    }
    if (activeBalance < amount) {
      toast.show('Số dư khả dụng không đủ!', 'error');
      return;
    }
    if (phone.trim().length < 10) {
      toast.show('Vui lòng nhập số điện thoại', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await userService.withdraw({
        moneyWithdraw: amount,
        phoneNumberMomo: phone.trim(),
      });
      if (userId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.userBalance(userId),
        });
      }
      await queryClient.invalidateQueries({ queryKey: ['users', 'transactions'] });
      toast.show('Rút tiền thành công', 'success');
      // replace, not push: the withdrawal is spent, so it must not be reachable
      // again with the back gesture.
      router.replace('/transactions');
    } catch {
      toast.show('Rút tiền thất bại', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Rút tiền" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={contentStyle}
          contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.amountRow}>
              <TextField
                value={moneyText}
                onChangeText={(value) =>
                  setMoneyText(
                    parseAmount(value) ? formatNumber(parseAmount(value)) : '',
                  )
                }
                keyboardType="number-pad"
                label="Số tiền"
                variant="floating"
                maxLength={11}
                containerStyle={styles.amountInput}
              />
              <Text style={[type.body, styles.unit]}>đ</Text>
            </View>
          </View>

          <View style={styles.balancePanel}>
            <Text style={[styles.balanceLabel, type.overline]}>
              Số dư khả dụng
            </Text>
            <Text style={[styles.balance, type.bodyMedium]}>
              {formatNumber(activeBalance)} đ
            </Text>
            {balanceQuery.isError ? (
              <View style={styles.balanceNoticeRow}>
                <Text style={styles.balanceNotice}>
                  Không kiểm tra được số dư mới nhất.
                </Text>
                <Button
                  label="Thử lại"
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  onPress={() => void balanceQuery.refetch()}
                />
              </View>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={[styles.methodLabel, type.overline]}>
              Nhận qua MoMo
            </Text>
            <TextField
              value={phone}
              onChangeText={(value) => setPhone(value.replace(/[^0-9]/g, ''))}
              keyboardType="phone-pad"
              label="Số điện thoại nhận"
              variant="floating"
              maxLength={10}
            />
          </View>
        </ScrollView>
        <View
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}
        >
          <View style={styles.footerInner}>
            <Button
              label="Rút tiền"
              size="lg"
              loading={submitting}
              onPress={() => void submit()}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  amountInput: { flex: 1, minWidth: 0 },
  unit: { ...FLOAT_BAND_STYLE, color: colors.text },
  balancePanel: {
    alignItems: 'center',
    gap: spacing.xxs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryFaint,
  },
  balanceLabel: { color: colors.primaryAction },
  balance: { color: colors.primaryInk },
  balanceNoticeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  balanceNotice: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.danger,
  },
  methodLabel: { color: colors.textMuted },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerInner: { maxWidth: 420, width: '100%', alignSelf: 'center' },
});
