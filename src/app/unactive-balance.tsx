import { useQuery } from '@tanstack/react-query';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { userService } from '@/api/services/users';
import {
  AppBar,
  EmptyState,
  ErrorView,
  LoadingView,
} from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { formatDateTime, formatVnd } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { colors, radius, spacing } from '@/theme';

export default function UnActiveBalanceScreen() {
  const { gutter, contentStyle, type } = useResponsive();

  const balancesQuery = useQuery({
    queryKey: queryKeys.unActiveBalances,
    queryFn: async () => userService.getUnActiveBalances(),
  });

  const balances = balancesQuery.data?.content ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Số dư khả dụng" />
      {balancesQuery.isLoading ? (
        <LoadingView />
      ) : balancesQuery.isError ? (
        <ErrorView onRetry={() => balancesQuery.refetch()} />
      ) : balances.length === 0 ? (
        <EmptyState
          icon="wallet-outline"
          title="Không có dữ liệu"
          description="Chưa có khoản tiền nào đang chờ xử lý."
        />
      ) : (
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
                {formatDateTime(item.dateActive)}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
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
});
