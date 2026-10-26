import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { transactionService } from '@/api/services/content';
import type { TransactionModel } from '@/api/types';
import {
  AppBar,
  EmptyState,
  ErrorView,
  LoadingView,
} from '@/components/ui';
import { formatDateTimeAmPm, formatVnd } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, radius, spacing } from '@/theme';

const FILTERS = [
  { label: 'Tất cả', type: '', operation: '' },
  { label: 'Nhận tiền', type: 'Order', operation: 'Add' },
  { label: 'Trừ tiền', type: 'Order', operation: 'Sub' },
  { label: 'Nạp tiền', type: 'Deposit', operation: '' },
  { label: 'Rút tiền', type: 'Withdraw', operation: '' },
  { label: 'Donate', type: 'Donate', operation: '' },
] as const;

const transactionTitle = (type: string, operation: string): string => {
  if (type === 'Deposit') return 'Nạp tiền từ MOMO';
  if (type === 'Withdraw') return 'Rút tiền về MOMO';
  if (type === 'Order - Refund') return 'Hoàn tiền từ giao dịch';
  if (type === 'Order' && operation === 'Add') return 'Nhận tiền từ giao dịch';
  if (type === 'Order' && operation === 'Sub') return 'Trừ tiền từ giao dịch';
  if (type === 'Donate') return 'Gửi từ thiện';
  if (type === 'Report - Refund') return 'Hoàn tiền từ việc tố cáo thành công';
  if (type === 'Report') return 'Trừ tiền từ việc bị tố cáo thành công';
  if (type === 'Maintain - Refund') return 'Hoàn tiền vì hệ thống bảo trì';
  return type;
};

export default function TransactionsScreen() {
  const router = useRouter();
  const [filterIndex, setFilterIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const filter = FILTERS[filterIndex];

  const transactionsQuery = useQuery({
    queryKey: queryKeys.transactions(filter.type, filter.operation, pageSize),
    queryFn: async () =>
      transactionService.getAll(filter.type, filter.operation, pageSize),
  });

  const transactions = transactionsQuery.data?.content ?? [];
  const hasNext = transactionsQuery.data?.hasNext ?? false;

  const selectFilter = (index: number) => {
    if (index === filterIndex) return;
    setFilterIndex(index);
    setPageSize(10);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar
        title="Lịch sử giao dịch"
        onBack={() => router.dismissTo('/(tabs)/personal')}
      />

      <View style={styles.filters}>
        {FILTERS.map((item, index) => {
          const active = index === filterIndex;
          return (
            <Pressable
              key={item.label}
              onPress={() => selectFilter(index)}
              style={({ pressed }) => [
                styles.filter,
                active && styles.filterActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {transactionsQuery.isLoading ? (
        <LoadingView />
      ) : transactionsQuery.isError ? (
        <ErrorView onRetry={() => transactionsQuery.refetch()} />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="Không có dữ liệu"
          description="Chưa có giao dịch nào trong mục này."
        />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onEndReached={() => {
            if (hasNext && !transactionsQuery.isFetching) {
              setPageSize((value) => value + 10);
            }
          }}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => <TransactionRow transaction={item} />}
          ListFooterComponent={
            hasNext && transactionsQuery.isFetching ? (
              <Text style={styles.loadingMore}>Đang tải...</Text>
            ) : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}

function TransactionRow({ transaction }: { transaction: TransactionModel }) {
  const isSub = transaction.operation === 'Sub';
  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={styles.rowTitle}>
          {transactionTitle(
            transaction.typeOfTransaction,
            transaction.operation,
          )}
        </Text>
        <Text style={styles.rowDate}>
          {formatDateTimeAmPm(transaction.createdDate)}
        </Text>
      </View>
      <Text style={[styles.amount, isSub && styles.amountSub]}>
        {isSub ? '−' : '+'}
        {formatVnd(transaction.money)}
      </Text>
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  filter: {
    width: '31.5%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryFaint,
  },
  filterActive: { backgroundColor: colors.primary },
  pressed: { opacity: 0.7 },
  filterLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.primaryDark,
  },
  filterLabelActive: { color: colors.white },
  list: { paddingBottom: spacing.xxl },
  row: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowTitle: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  rowDate: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  amount: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.success,
    textAlign: 'right',
    marginTop: 2,
  },
  amountSub: { color: colors.text },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
  },
  loadingMore: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
