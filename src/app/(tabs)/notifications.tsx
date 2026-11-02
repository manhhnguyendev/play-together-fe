import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import {
  EmptyState,
  ErrorView,
  LoadingView,
  ScreenHeader,
  useToast,
} from '@/components/ui';
import { useUnreadNotificationCount } from '@/features/notifications/useUnreadNotificationCount';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { formatDateTime } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { openOrderById, orderIdOfReference, routeOfReference } from '@/navigation/deepLink';
import { colors, fonts, radius, spacing } from '@/theme';

export default function NotificationsScreen() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const router = useAppRouter();
  const { gutter, contentStyle } = useResponsive();
  const [pageSize, setPageSize] = useState(10);


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

    const orderId = orderIdOfReference(item.referenceUrl);
    if (orderId) {
      void openOrderById(orderId, router);
      return;
    }
    const target = routeOfReference(item.referenceUrl);
    if (target) router.push(target);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Thông báo"
        subtitle={unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Tất cả đã đọc'}
      />

      {notifications.length > 0 ? (
        <View
          style={[styles.actions, { paddingHorizontal: gutter }, contentStyle]}
        >
          <View style={styles.actionButtons}>
            <Pressable
              disabled={unreadCount === 0 || markAll.isPending}
              onPress={() => markAll.mutate()}
              accessibilityRole="button"
              accessibilityState={{ disabled: unreadCount === 0 || markAll.isPending }}
              hitSlop={8}
              style={({ pressed }) => [
                styles.actionPill,
                pressed && styles.pressed,
                unreadCount === 0 && styles.actionPillDisabled,
              ]}
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
              accessibilityRole="button"
              accessibilityState={{ disabled: removeRead.isPending }}
              hitSlop={8}
              style={({ pressed }) => [
                styles.actionPill,
                pressed && styles.pressed,
              ]}
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
          style={contentStyle}
          contentContainerStyle={[styles.list, { paddingHorizontal: gutter }]}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => {
            const unread = item.status === 'UNREAD';
            return (
              <Pressable
                onPress={() => openNotification(item)}
                accessibilityRole="none"
                accessibilityLabel={unread ? `${item.title}, chưa đọc` : item.title}
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
                  {formatDateTime(item.createdDate)}
                </Text>
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
  safe: { flex: 1, backgroundColor: colors.background },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionPill: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primaryFaint,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  actionPillDisabled: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  actionText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryAction,
  },
  actionDisabled: { color: colors.textFaint },
  pressed: { opacity: 0.7 },
  list: { paddingTop: spacing.xs, paddingBottom: spacing.xxl },
  item: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
  },
  itemUnread: { backgroundColor: colors.primaryFaint },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryAction,
  },
  itemTitle: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
    lineHeight: 23,
  },
  itemTitleUnread: { fontFamily: fonts.bold },
  itemBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemDate: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textFaint,
    marginTop: 6,
  },
  loadingMore: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
