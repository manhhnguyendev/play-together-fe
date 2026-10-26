import * as Linking from 'expo-linking';
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
import { useAuthStore } from '@/store/auth';
import { colors, fonts, spacing } from '@/theme';

const MIN_DEPOSIT = 10000;
const MAX_DEPOSIT = 50000000;

export default function DepositScreen() {
  const router = useRouter();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
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
      await Linking.openURL(payUrl);
      router.dismissTo('/(tabs)/personal');
    } catch {
      toast.show('Không thể mở cổng thanh toán MOMO', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <AppBar title="Thanh toán qua MOMO" />
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
        </ScrollView>
        <View style={styles.footer}>
          <Button
            label="Nạp tiền"
            size="lg"
            loading={submitting}
            onPress={() => void submit()}
          />
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
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
