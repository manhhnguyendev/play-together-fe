import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { charityService } from '@/api/services/content';
import { userService } from '@/api/services/users';
import {
  AppBar,
  Button,
  ErrorView,
  LoadingView,
  TextField,
  useToast,
} from '@/components/ui';
import { formatNumber, formatVnd, parseAmount } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, spacing } from '@/theme';

export default function CharityDonateScreen() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
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
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.balanceRow}>
              <Ionicons name="cash-outline" size={20} color={colors.primary} />
              <Text style={styles.balanceLabel}>Số dư khả dụng: </Text>
              <Text style={styles.balanceValue}>{formatVnd(activeBalance)}</Text>
            </View>

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
                maxLength={10}
                containerStyle={styles.amountInput}
              />
              <Text style={styles.unit}>đ</Text>
            </View>

            <TextField
              label="Nhập lời nhắn của bạn..."
              value={message}
              onChangeText={setMessage}
              placeholder="Nhập vào lời nhắn của bạn"
              maxLength={1000}
              multiline
              containerStyle={styles.messageInput}
            />
          </ScrollView>
          <View style={styles.footer}>
            <Button
              label="Gửi tiền từ thiện"
              size="lg"
              loading={submitting}
              onPress={() => void submit()}
            />
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  scroll: { padding: spacing.md, gap: spacing.lg },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceLabel: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  balanceValue: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
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
  messageInput: { minHeight: 260 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
