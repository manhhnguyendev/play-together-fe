import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
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
import { AppBar, Button, TextField, useToast } from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { formatVnd, parseAmount } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, radius, spacing } from '@/theme';

export default function WithdrawScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { gutter, contentStyle, type } = useResponsive();
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
          <View style={styles.hero}>
            <Text style={[styles.infoLabel, type.overline]}>Số tiền rút</Text>
            <Text style={[styles.infoValue, type.title1]}>{formatVnd(money)}</Text>
          </View>

          <View style={styles.card}>
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
  hero: {
    alignItems: 'center',
    gap: spacing.xxs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryFaint,
  },
  infoLabel: { color: colors.primaryAction },
  infoValue: { color: colors.primaryInk, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerInner: { maxWidth: 420, width: '100%', alignSelf: 'center' },
});
