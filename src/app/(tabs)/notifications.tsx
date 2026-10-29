import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { notificationService } from '@/api/services/content';
import type { NotificationModel } from '@/api/types';
import { EmptyState, ErrorView, LoadingView, useToast } from '@/components/ui';
import { useOngoingOrderGuard } from '@/features/orders/useOngoingOrderGuard';
import { useUnreadNotificationCount } from '@/features/notifications/useUnreadNotificationCount';
import { formatDateTimeAmPm } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, spacing } from '@/theme';

export default function NotificationsScreen() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [pageSize, setPageSize] = useState(10);

  useOngoingOrderGuard();

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications(pageSize),
    queryFn: async () => notificationService.getAll(pageSize),
  });

  const unreadQuery = useUnreadNotificationCount();
  const unreadCount = unreadQuery.data ?? 0;

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    ]);

  const markRead = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: invalidate,
    onError: () => toast.show('Không thể đánh dấu đã đọc', 'error'),
  });

  const markAll = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: async () => {
      await invalidate();
      toast.show('Đã đọc tất cả thông báo', 'success');
    },
    onError: () => toast.show('Không thể cập nhật thông báo', 'error'),
  });

  const removeRead = useMutation({
    mutationFn: () => notificationService.removeRead(),
    onSuccess: async () => {
      await invalidate();
      toast.show('Đã xoá thông báo đã đọc', 'success');
    },
    onError: () => toast.show('Không thể xoá thông báo', 'error'),
  });

  const notifications = notificationsQuery.data?.content ?? [];
  const hasNext = notificationsQuery.data?.hasNext ?? false;

  const loadMore = () => {
    if (!hasNext || notificationsQuery.isFetching) return;
    setPageSize((value) => value + 10);
  };

  const openNotification = (item: NotificationModel) => {
    if (item.status === 'UNREAD' && !markRead.isPending) {
      markRead.mutate(item.id);
    }
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

      {notifications.length > 0 ? (
        <View style={styles.actions}>
          <Text style={styles.unreadLabel}>
            {unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Tất cả đã đọc'}
          </Text>
          <View style={styles.actionButtons}>
            <Pressable
              disabled={unreadCount === 0 || markAll.isPending}
              onPress={() => markAll.mutate()}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Text
                style={[
                  styles.actionText,
                  unreadCount === 0 && styles.actionDisabled,
                ]}
              >
                Đọc tất cả
              </Text>
            </Pressable>
            <Pressable
              disabled={removeRead.isPending}
              onPress={() => removeRead.mutate()}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Text style={styles.actionText}>Xoá đã đọc</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

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
          renderItem={({ item }) => {
            const unread = item.status === 'UNREAD';
            return (
              <Pressable
                onPress={() => openNotification(item)}
                style={({ pressed }) => [
                  styles.item,
                  unread && styles.itemUnread,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.itemHeader}>
                  {unread ? <View style={styles.dot} /> : null}
                  <Text
                    style={[styles.itemTitle, unread && styles.itemTitleUnread]}
                  >
                    {item.title}
                  </Text>
                </View>
                {item.body ? (
                  <Text style={styles.itemBody}>{item.body}</Text>
                ) : null}
                <Text style={styles.itemDate}>
                  {formatDateTimeAmPm(item.createdDate)}
                </Text>
                <View style={styles.divider} />
              </Pressable>
            );
          }}
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  unreadLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primary,
  },
  actionDisabled: { color: colors.textFaint },
  pressed: { opacity: 0.65 },
  list: { paddingTop: spacing.xs },
  item: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  itemUnread: { backgroundColor: colors.primaryFaint },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  itemTitle: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  itemTitleUnread: { fontFamily: fonts.semibold },
  itemBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: 2,
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
