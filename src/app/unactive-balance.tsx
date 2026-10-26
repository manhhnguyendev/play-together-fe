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
import { formatDateTimeAmPm, formatVnd } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, spacing } from '@/theme';

export default function UnActiveBalanceScreen() {
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
        <ScrollView contentContainerStyle={styles.list}>
          {balances.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={styles.rowTop}>
                <Text style={styles.money}>+ {formatVnd(item.money)}</Text>
                <Text style={styles.status}>Chưa xử lý</Text>
              </View>
              <Text style={styles.date}>
                {formatDateTimeAmPm(item.dateActive)}
              </Text>
              <View style={styles.divider} />
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  list: { paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  row: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  money: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.success,
  },
  status: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.warning,
  },
  date: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 3,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
  },
});
