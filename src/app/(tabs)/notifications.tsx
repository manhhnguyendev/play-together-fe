import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { notificationService } from '@/api/services/content';
import { EmptyState, ErrorView, LoadingView } from '@/components/ui';
import { useOngoingOrderGuard } from '@/features/orders/useOngoingOrderGuard';
import { formatDateTimeAmPm } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, spacing } from '@/theme';

export default function NotificationsScreen() {
  const [pageSize, setPageSize] = useState(10);

  useOngoingOrderGuard();

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications(pageSize),
    queryFn: async () => notificationService.getAll(pageSize),
  });

  const notifications = notificationsQuery.data?.content ?? [];
  const hasNext = notificationsQuery.data?.hasNext ?? false;

  const loadMore = () => {
    if (!hasNext || notificationsQuery.isFetching) return;
    setPageSize((value) => value + 10);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.appBar}>
        <Image
          source={require('../../../assets/images/play_together_logo_no_text.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.title}>Thông báo</Text>
        <View style={styles.logo} />
      </View>

      {notificationsQuery.isLoading ? (
        <LoadingView />
      ) : notificationsQuery.isError ? (
        <ErrorView onRetry={() => notificationsQuery.refetch()} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="Không có thông báo"
          description="Bạn chưa có thông báo nào."
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDate}>
                {formatDateTimeAmPm(item.createdDate)}
              </Text>
              <View style={styles.divider} />
            </View>
          )}
          ListFooterComponent={
            hasNext && notificationsQuery.isFetching ? (
              <Text style={styles.loadingMore}>Đang tải...</Text>
            ) : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  logo: { width: 46, height: 46, borderRadius: 23 },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: colors.text,
  },
  list: { paddingTop: spacing.sm },
  item: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  itemTitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  itemDate: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
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
