import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderService } from '@/api/services/orders';
import type { OrderModel } from '@/api/types';
import { OrderHistoryCard } from '@/components/orders/OrderHistoryCard';
import {
  Button,
  EmptyState,
  ErrorView,
  LoadingView,
  ScreenHeader,
} from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { queryKeys } from '@/lib/queryKeys';
import { openOrderById } from '@/navigation/deepLink';
import { useAuthStore } from '@/store/auth';
import { colors, control, fonts, radius, spacing } from '@/theme';

type HistoryTab = 'created' | 'received';

export default function HistoryScreen() {
  const router = useAppRouter();
  const { gutter, contentStyle } = useResponsive();
  const currentUser = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<HistoryTab>('created');
  const [pageSize, setPageSize] = useState(10);

  const ordersQuery = useQuery({
    queryKey:
      tab === 'created'
        ? queryKeys.history.created(pageSize)
        : queryKeys.history.received(pageSize),
    enabled: Boolean(currentUser?.id),
    refetchOnMount: 'always',
    queryFn: async () =>
      tab === 'created'
        ? orderService.getAllCreated(pageSize)
        : orderService.getAllReceived(pageSize),
  });

  const orders = ordersQuery.data?.content ?? [];
  const hasNext = ordersQuery.data?.hasNext ?? false;

  const switchTab = (next: HistoryTab) => {
    if (next === tab) return;
    setTab(next);
    setPageSize(10);
  };

  const openOrder = (order: OrderModel) => openOrderById(order.id, router);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Lịch sử hoạt động" subtitle="Đơn đã và đang diễn ra" />

      <View style={styles.tabs}>
        <TabButton
          label="Đi thuê"
          active={tab === 'created'}
          onPress={() => switchTab('created')}
        />
        <TabButton
          label="Được thuê"
          active={tab === 'received'}
          onPress={() => switchTab('received')}
        />
      </View>

      {ordersQuery.isLoading ? (
        <LoadingView />
      ) : ordersQuery.isError ? (
        <ErrorView onRetry={() => ordersQuery.refetch()} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          style={contentStyle}
          contentContainerStyle={[styles.list, { paddingHorizontal: gutter }]}
          refreshControl={
            <RefreshControl
              refreshing={ordersQuery.isRefetching}
              onRefresh={() => {
                void ordersQuery.refetch();
              }}
              tintColor={colors.primaryAction}
              colors={[colors.primaryAction]}
            />
          }
          renderItem={({ item }) => (
            <OrderHistoryCard
              order={item}
              currentUserId={currentUser?.id ?? ''}
              onPress={() => openOrder(item)}
              onReorder={() =>
                router.push({
                  pathname: '/player/[id]',
                  params: { id: item.toUserId },
                })
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="Không có dữ liệu"
              description="Các lượt thuê của bạn sẽ xuất hiện tại đây."
            />
          }
          ListFooterComponent={
            hasNext ? (
              <View style={styles.footer}>
                <Button
                  label="Tải thêm"
                  variant="secondary"
                  loading={ordersQuery.isFetching}
                  onPress={() => setPageSize((value) => value + 10)}
                />
              </View>
            ) : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]}
    >
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
      <View style={[styles.tabIndicator, active && styles.tabIndicatorActive]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: control.buttonSm,
    paddingTop: spacing.xs,
  },
  tabLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.textMuted,
    paddingBottom: spacing.xs,
  },
  tabLabelActive: {
    fontFamily: fonts.bold,
    color: colors.primaryAction,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '46%',
    borderTopLeftRadius: radius.xs,
    borderBottomLeftRadius: radius.xs,
    backgroundColor: 'transparent',
  },
  tabIndicatorActive: { backgroundColor: colors.primaryAction },
  list: {
    flexGrow: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  footer: { paddingVertical: spacing.md },
});
