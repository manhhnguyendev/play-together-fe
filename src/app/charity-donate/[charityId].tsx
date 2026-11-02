import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { charityService } from '@/api/services/content';
import { userService } from '@/api/services/users';
import {
  AppBar,
  Button,
  ErrorView,
  FLOAT_BAND_STYLE,
  LoadingView,
  TextField,
  useToast,
} from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { formatNumber, formatVnd, parseAmount } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, radius, spacing } from '@/theme';

export default function CharityDonateScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle, type } = useResponsive();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? '';
  const params = useLocalSearchParams<{ charityId?: string }>();
  const charityId =
    typeof params.charityId === 'string' ? params.charityId : '';

  const [moneyText, setMoneyText] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const charityQuery = useQuery({
    queryKey: queryKeys.charity(charityId),
    enabled: Boolean(charityId),
    queryFn: async () => (await charityService.getById(charityId)).content,
  });

  const balanceQuery = useQuery({
    queryKey: queryKeys.userBalance(userId),
    enabled: Boolean(userId),
    queryFn: async () => (await userService.getUserBalance(userId)).content,
  });

  const activeBalance =
    balanceQuery.data?.activeBalance ?? user?.userBalance.activeBalance ?? 0;
  const charity = charityQuery.data;

  const submit = async () => {
    if (submitting) return;
    const amount = parseAmount(moneyText);
    if (!moneyText.trim()) {
      toast.show('Vui lòng nhập số tiền!', 'error');
      return;
    }
    if (amount < 1000) {
      toast.show('Số tiền gửi từ thiện tối thiểu là 1.000đ', 'error');
      return;
    }
    if (!message.trim()) {
      toast.show('Vui lòng nhập lời nhắn!', 'error');
      return;
    }
    if (amount > activeBalance) {
      toast.show('Số dư khả dụng không đủ!', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await userService.donate(charityId, {
        money: amount,
        message: message.trim(),
      });
      toast.show('Gửi từ thiện thành công', 'success');
      await queryClient.invalidateQueries({
        queryKey: queryKeys.userBalance(userId),
      });
      await queryClient.invalidateQueries({ queryKey: ['users', 'transactions'] });
      router.replace('/transactions');
    } catch {
      toast.show('Gửi từ thiện thất bại', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title={charity?.organizationName ?? 'Gửi tiền từ thiện'} />
      {charityQuery.isLoading || balanceQuery.isLoading ? (
        <LoadingView />
      ) : charityQuery.isError || balanceQuery.isError ? (
        <ErrorView
          onRetry={() => {
            void charityQuery.refetch();
            void balanceQuery.refetch();
          }}
        />
      ) : (
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
              <View style={[styles.card, styles.balanceCard]}>
                <Ionicons
                  name="cash-outline"
                  size={20}
                  color={colors.primaryAction}
                />
                <Text style={[styles.balanceLabel, type.bodySmall]}>
                  Số dư khả dụng:{' '}
                </Text>
                <Text style={[styles.balanceValue, type.title3]}>
                  {formatVnd(activeBalance)}
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.amountRow}>
                  <TextField
                    value={moneyText}
                    accessibilityLabel="Nhập số tiền từ thiện"
                    onChangeText={(value) =>
                      setMoneyText(
                        parseAmount(value) ? formatNumber(parseAmount(value)) : '',
                      )
                    }
                    keyboardType="number-pad"
                    label="Số tiền"
                    variant="floating"
                    maxLength={10}
                    containerStyle={styles.amountInput}
                  />
                  <Text style={styles.unit}>đ</Text>
                </View>

                <TextField
                  label="Lời nhắn"
                  value={message}
                  accessibilityLabel="Nhập lời nhắn của bạn"
                  onChangeText={setMessage}
                  placeholder="Gửi một lời nhắn đến cộng đồng"
                  maxLength={1000}
                  multiline
                  variant="floating"
                  containerStyle={styles.messageInput}
                />
              </View>
            </View>
          </ScrollView>
          <View
            style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}
          >
            <View style={styles.footerInner}>
              <Button
                label="Gửi tiền từ thiện"
                size="lg"
                loading={submitting}
                onPress={() => void submit()}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { paddingVertical: spacing.sm },
  column: { gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  balanceLabel: {
    color: colors.textSecondary,
    flexShrink: 0,
  },
  balanceValue: {
    color: colors.textStrong,
    flexShrink: 1,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  amountInput: { flex: 1, minWidth: 0 },
  unit: {
    ...FLOAT_BAND_STYLE,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.textSecondary,
    flexShrink: 0,
  },
  messageInput: { minHeight: 260 },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerInner: { maxWidth: 420, width: '100%', alignSelf: 'center' },
});
