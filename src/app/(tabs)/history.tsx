import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
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
} from '@/components/ui';
import { secondsBetween } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, spacing } from '@/theme';

type HistoryTab = 'created' | 'received';

const THREE_HOURS = 3 * 60 * 60;

export default function HistoryScreen() {
  const router = useRouter();
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

  const openOrder = async (order: OrderModel) => {
    try {
      const detail = (await orderService.getDetailById(order.id)).content;
      const hasFeedback =
        (detail.ratings ?? []).length > 0 || (detail.reports ?? []).length > 0;
      if (!hasFeedback) {
        const fullOrder = (await orderService.getById(order.id)).content;
        const secondsToFinish = secondsBetween(
          new Date().toISOString(),
          fullOrder.timeFinish,
        );
        if (secondsToFinish >= -THREE_HOURS) {
          router.push({
            pathname: '/end-order/[orderId]',
            params: { orderId: order.id },
          });
          return;
        }
      }
    } catch {
      // Fall through to the read-only detail screen.
    }
    router.push({
      pathname: '/history/[orderId]',
      params: { orderId: order.id },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.appBar}>
        <Image
          source={require('../../../assets/images/play_together_logo_no_text.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.title}>Lịch sử hoạt động</Text>
        <View style={styles.logoSpacer} />
      </View>

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
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={ordersQuery.isRefetching}
              onRefresh={() => {
                void ordersQuery.refetch();
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
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
  safe: { flex: 1, backgroundColor: colors.surface },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
  },
  logoSpacer: { width: 44 },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 19,
    color: colors.text,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  tabLabel: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textMuted,
    paddingBottom: spacing.xs,
  },
  tabLabelActive: {
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  tabIndicator: {
    height: 2,
    width: '60%',
    backgroundColor: 'transparent',
  },
  tabIndicatorActive: { backgroundColor: colors.primary },
  list: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  footer: { paddingVertical: spacing.md },
});
