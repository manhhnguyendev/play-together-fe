import { useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
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
import { AppBar, Button, FLOAT_BAND_STYLE, TextField, useToast } from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { formatNumber, parseAmount } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, radius, spacing } from '@/theme';

const MIN_DEPOSIT = 10000;
const MAX_DEPOSIT = 50000000;

export default function DepositScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { gutter, contentStyle, type } = useResponsive();
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const [moneyText, setMoneyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (submitting) return;
    const amount = parseAmount(moneyText);
    if (!moneyText.trim()) {
      toast.show('Vui lòng nhập số tiền!', 'error');
      return;
    }
    if (amount < MIN_DEPOSIT) {
      toast.show('Số tiền nạp tối thiểu là 10.000đ', 'error');
      return;
    }
    if (amount >= MAX_DEPOSIT) {
      toast.show('Số tiền nạp tối đa là 50.000.000đ', 'error');
      return;
    }
    if (!user) return;

    setSubmitting(true);
    try {
      const result = await userService.getMomoLink({
        userId: user.id,
        amount,
      });
      const payUrl = result.content?.payUrl;
      if (!payUrl) {
        toast.show('Không thể tạo liên kết thanh toán', 'error');
        return;
      }
      if (result.content?.mock) {
        await userService.confirmDeposit(result.content.orderId);
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: queryKeys.userBalance(user.id),
          }),
          refreshUser(),
        ]);
        toast.show('Nạp tiền thành công (thanh toán thử nghiệm)', 'success');
      } else {
        await Linking.openURL(payUrl);
        toast.show('Đã mở cổng thanh toán MoMo', 'success');
      }
      router.dismissTo('/(tabs)/personal');
    } catch {
      toast.show('Không thể mở cổng thanh toán MoMo', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Thanh toán qua MoMo" />
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
        </ScrollView>
        <View
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}
        >
          <View style={styles.footerInner}>
            <Button
              label="Nạp tiền"
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
  scroll: { flexGrow: 1, paddingTop: spacing.md, paddingBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  amountInput: { flex: 1, minWidth: 0 },
  unit: { ...FLOAT_BAND_STYLE, color: colors.text },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerInner: { maxWidth: 420, width: '100%', alignSelf: 'center' },
});
