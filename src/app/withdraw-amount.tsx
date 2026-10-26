import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { userService } from '@/api/services/users';
import { AppBar, Button, TextField, useToast } from '@/components/ui';
import { formatNumber, parseAmount } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, spacing } from '@/theme';

const MIN_WITHDRAW = 10000;
const MAX_WITHDRAW = 50000000;

export default function WithdrawAmountScreen() {
  const router = useRouter();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? '';
  const [moneyText, setMoneyText] = useState('');

  const balanceQuery = useQuery({
    queryKey: queryKeys.userBalance(userId),
    enabled: Boolean(userId),
    queryFn: async () => (await userService.getUserBalance(userId)).content,
  });

  const activeBalance =
    balanceQuery.data?.activeBalance ?? user?.userBalance.activeBalance ?? 0;

  const submit = () => {
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
    if (activeBalance < amount) {
      toast.show('Số dư khả dụng không đủ!', 'error');
      return;
    }
    router.push({
      pathname: '/withdraw-method',
      params: { money: String(amount) },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <AppBar title="Rút tiền" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.amountRow}>
            <TextField
              value={moneyText}
              onChangeText={(value) =>
                setMoneyText(
                  parseAmount(value) ? formatNumber(parseAmount(value)) : '',
                )
              }
              keyboardType="number-pad"
              placeholder="Nhập số tiền"
              maxLength={11}
              containerStyle={styles.amountInput}
            />
            <Text style={styles.unit}>đ</Text>
          </View>
          <Text style={styles.balance}>
            Số dư khả dụng: {formatNumber(activeBalance)} đ
          </Text>
        </ScrollView>
        <View style={styles.footer}>
          <Button label="Rút tiền" size="lg" onPress={submit} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: spacing.md,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  amountInput: { flex: 1 },
  unit: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },
  balance: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
