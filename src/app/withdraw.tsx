import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { formatVnd, parseAmount } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, spacing } from '@/theme';

export default function WithdrawScreen() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const params = useLocalSearchParams<{ money?: string }>();
  const money = parseAmount(typeof params.money === 'string' ? params.money : '');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (submitting) return;
    if (phone.trim().length < 10) {
      toast.show('Vui lòng nhập số điện thoại', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await userService.withdraw({
        moneyWithdraw: money,
        phoneNumberMomo: phone.trim(),
      });
      toast.show('RÚT TIỀN THÀNH CÔNG', 'success');
      if (user?.id) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.userBalance(user.id),
        });
      }
      await queryClient.invalidateQueries({ queryKey: ['users', 'transactions'] });
      router.replace('/transactions');
    } catch {
      toast.show('RÚT TIỀN THẤT BẠI', 'error');
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
          <View style={styles.info}>
            <Text style={styles.infoLabel}>Số tiền rút</Text>
            <Text style={styles.infoValue}>{formatVnd(money)}</Text>
          </View>
          <TextField
            value={phone}
            onChangeText={(value) => setPhone(value.replace(/[^0-9]/g, ''))}
            keyboardType="phone-pad"
            placeholder="Nhập số điện thoại"
            maxLength={10}
          />
        </ScrollView>
        <View style={styles.footer}>
          <Button
            label="Rút tiền"
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
    gap: spacing.lg,
  },
  info: {
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  infoValue: {
    fontFamily: fonts.semibold,
    fontSize: 22,
    color: colors.text,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
