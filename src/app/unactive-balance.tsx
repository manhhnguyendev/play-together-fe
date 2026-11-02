import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { userService } from '@/api/services/users';
import {
  AppBar,
  Button,
  EmptyState,
  ErrorView,
  LoadingView,
  useToast,
} from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { formatDateTime, formatVnd } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, radius, spacing } from '@/theme';

export default function UnActiveBalanceScreen() {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { gutter, contentStyle, type } = useResponsive();
  const userId = useAuthStore((state) => state.user?.id ?? '');
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const [releasing, setReleasing] = useState(false);

  const balancesQuery = useQuery({
    queryKey: queryKeys.unActiveBalances,
    queryFn: async () => userService.getUnActiveBalances(),
  });

  const balances = balancesQuery.data?.content ?? [];
  const total = balances.reduce((sum, item) => sum + item.money, 0);

  const release = async () => {
    if (releasing) return;
    setReleasing(true);
    try {
      await userService.releaseUnActiveBalance();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.unActiveBalances }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.userBalance(userId),
        }),
        refreshUser().catch(() => undefined),
      ]);
      toast.show('Đã thu hồi về số dư khả dụng', 'success');
    } catch {
      toast.show('Chưa thu hồi được, hãy thử lại sau', 'error');
    } finally {
      setReleasing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Tiền đang chờ về ví" />
      {balancesQuery.isLoading ? (
        <LoadingView />
      ) : balancesQuery.isError ? (
        <ErrorView onRetry={() => balancesQuery.refetch()} />
      ) : balances.length === 0 ? (
        <EmptyState
          icon="wallet-outline"
          title="Không có khoản nào chờ"
          description="Tiền của các đơn đã hoàn thành sẽ xuất hiện ở đây trước khi về số dư khả dụng."
        />
      ) : (
        <>
          <ScrollView
            style={contentStyle}
            contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
            showsVerticalScrollIndicator={false}
          >
            {balances.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.rowTop}>
                  <Text style={[styles.money, type.title3]}>
                    + {formatVnd(item.money)}
                  </Text>
                  <View style={styles.statusPill}>
                    <Text style={[styles.statusText, type.caption]}>
                      Chưa xử lý
                    </Text>
                  </View>
                </View>
                <Text style={[styles.date, type.bodySmall]}>
                  Về ví từ {formatDateTime(item.dateActive)}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View
            style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}
          >
            <View style={styles.footerInner}>
              <Text style={[styles.total, type.bodyMedium]}>
                Tổng đang chờ: {formatVnd(total)}
              </Text>
              <Button
                label="Thu hồi về số dư khả dụng"
                size="lg"
                loading={releasing}
                onPress={() => void release()}
              />
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  money: { color: colors.success, flexShrink: 1 },
  statusPill: {
    minHeight: 26,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: { color: colors.warning },
  date: { color: colors.textMuted },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerInner: {
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    gap: spacing.sm,
  },
  total: { color: colors.text, textAlign: 'center' },
});
