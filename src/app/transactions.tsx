import { useQuery } from '@tanstack/react-query';
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
import {
  AppBar,
  EmptyState,
  ErrorView,
  LoadingView,
} from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { formatDateTime, formatVnd } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { colors, control, hitSlop, radius, spacing } from '@/theme';

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
  const router = useAppRouter();
  const { gutter, contentStyle, itemWidth, type } = useResponsive();
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

      <View style={[styles.filters, contentStyle, { paddingHorizontal: gutter }]}>
        {FILTERS.map((item, index) => {
          const active = index === filterIndex;
          return (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              accessibilityLabel={`Lọc theo ${item.label}`}
              accessibilityState={{ selected: active }}
              hitSlop={hitSlop.sm}
              onPress={() => selectFilter(index)}
              style={({ pressed }) => [
                styles.filter,
                { width: itemWidth(150, spacing.sm) },
                active && styles.filterActive,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.filterLabel,
                  type.bodySmallMedium,
                  active && styles.filterLabelActive,
                ]}
                numberOfLines={1}
              >
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
          style={contentStyle}
          contentContainerStyle={[styles.list, { paddingHorizontal: gutter }]}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasNext && !transactionsQuery.isFetching) {
              setPageSize((value) => value + 10);
            }
          }}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => {
            const isSub = item.operation === 'Sub';
            return (
              <View style={styles.card}>
                <View style={styles.rowTop}>
                  <Text style={[styles.rowTitle, type.bodyMedium]}>
                    {transactionTitle(
                      item.typeOfTransaction,
                      item.operation,
                    )}
                  </Text>
                  <Text style={[styles.rowDate, type.caption]}>
                    {formatDateTime(item.createdDate)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.amount,
                    type.title3,
                    isSub && styles.amountSub,
                  ]}
                >
                  {isSub ? '−' : '+'}
                  {formatVnd(item.money)}
                </Text>
              </View>
            );
          }}
          ListFooterComponent={
            hasNext && transactionsQuery.isFetching ? (
              <Text style={[styles.loadingMore, type.bodySmall]}>
                Đang tải...
              </Text>
            ) : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  filter: {
    minHeight: control.buttonSm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterActive: {
    backgroundColor: colors.primaryFill,
    borderColor: colors.primaryFill,
  },
  pressed: { opacity: 0.7 },
  filterLabel: { color: colors.textSecondary, textAlign: 'center' },
  filterLabelActive: { color: colors.textOnPrimary },
  list: { paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.xs },
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowTitle: { flex: 1, minWidth: 0, color: colors.text },
  rowDate: { color: colors.textMuted, maxWidth: '42%', textAlign: 'right' },
  amount: { color: colors.success, textAlign: 'right' },
  amountSub: { color: colors.text },
  loadingMore: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
