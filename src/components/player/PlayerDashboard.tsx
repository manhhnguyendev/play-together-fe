import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { OrderModel } from '@/api/types';
import { ratingService } from '@/api/services/content';
import { orderService } from '@/api/services/orders';
import { userService } from '@/api/services/users';
import {
  Avatar,
  Button,
  ErrorView,
  SectionHeader,
  Skeleton,
  useToast,
} from '@/components/ui';
import { orderGameNames } from '@/features/orders/status';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { formatDateTime, formatVnd } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, radius, spacing } from '@/theme';

/**
 * The player's half of the home tab. A Player spends the app answering requests,
 * turning up for booked sessions and getting paid, and every screen for that
 * already existed one level down — this brings them forward so the app opens on
 * work instead of on a list of people to hire.
 */
export function PlayerDashboard() {
  const router = useAppRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { type } = useResponsive();
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const userId = user?.id ?? '';
  const isPlayer = Boolean(user?.isPlayer);
  const [enabling, setEnabling] = useState(false);

  // Booked and live sessions stay visible while player mode is off — the API
  // does not cancel them, and a paused player still owes those hours. Everything
  // that only matters to someone taking work waits for the switch.
  const statisticQuery = useQuery({
    queryKey: queryKeys.statistic,
    enabled: isPlayer,
    queryFn: async () => (await userService.getStatistic()).content,
  });

  const pendingQuery = useQuery({
    queryKey: queryKeys.unActiveBalances,
    enabled: isPlayer,
    queryFn: async () => (await userService.getUnActiveBalances()).content,
  });

  const requestsQuery = useQuery({
    queryKey: queryKeys.playerWork.requests('Processing'),
    enabled: isPlayer,
    queryFn: async () =>
      (await orderService.getRequestsOfPlayer('Processing')).content,
  });

  const scheduledQuery = useQuery({
    queryKey: queryKeys.playerWork.requests('Scheduled'),
    queryFn: async () =>
      (await orderService.getRequestsOfPlayer('Scheduled')).content,
  });

  const liveQuery = useQuery({
    queryKey: queryKeys.playerWork.requests('Starting'),
    queryFn: async () =>
      (await orderService.getRequestsOfPlayer('Starting')).content,
  });

  const ratingsQuery = useQuery({
    queryKey: queryKeys.ratings(userId, 0, 3),
    enabled: isPlayer && Boolean(userId),
    queryFn: async () => (await ratingService.getAll(userId, 0, 3)).content,
  });

  const pending = pendingQuery.data ?? [];
  const pendingTotal = pending.reduce((sum, item) => sum + item.money, 0);
  const requests = requestsQuery.data ?? [];
  const scheduled = scheduledQuery.data ?? [];
  const live = liveQuery.data ?? [];
  const ratings = ratingsQuery.data ?? [];

  const enablePlayerMode = async () => {
    setEnabling(true);
    try {
      await userService.updateIsPlayer({ isPlayer: true });
    } catch (error) {
      toast.show(
        error instanceof Error ? error.message : 'Không bật được nhận thuê',
        'error',
      );
      setEnabling(false);
      return;
    }
    await Promise.all([
      refreshUser().catch(() => undefined),
      queryClient.invalidateQueries({
        queryKey: queryKeys.userService(userId),
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.playerWork.root }),
    ]);
    setEnabling(false);
    toast.show('Đang nhận yêu cầu thuê', 'success');
  };

  const liveList =
    live.length > 0 ? (
      <WorkList
        title="Phiên đang diễn ra"
        icon="flash-outline"
        orders={live}
        loading={liveQuery.isLoading}
        metaOf={(order) =>
          `${order.totalTimes} giờ · ${orderGameNames(order).join(', ')}`
        }
        onPress={(order) => router.push(`/hiring-stage/${order.id}`)}
      />
    ) : null;

  const scheduledList =
    scheduled.length > 0 ? (
      <WorkList
        title="Phiên sắp tới"
        icon="calendar-outline"
        orders={scheduled}
        loading={scheduledQuery.isLoading}
        metaOf={(order) =>
          `${order.totalTimes} giờ · ${
            order.timeStart ? formatDateTime(order.timeStart) : 'chưa hẹn giờ'
          }`
        }
        onPress={(order) => router.push(`/history/${order.id}`)}
      />
    ) : null;

  // Player mode is a mode, not a busy flag: while it is off nobody can hire this
  // account and the account cannot hire anyone. The switch used to live only in
  // Quản lý nhận thuê, so turning it back on cost two screens of walking.
  if (!isPlayer) {
    return (
      <>
        <View style={styles.card}>
          <View style={styles.headRow}>
            <View style={styles.headLabelWrap}>
              <Text style={[styles.headTitle, type.title3]}>
                Ca trực của bạn
              </Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: colors.textFaint },
                  ]}
                />
                <Text style={styles.statusText}>
                  Đang ngừng nhận yêu cầu thuê
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quản lý nhận thuê"
              onPress={() => router.push('/manage-hiring')}
              style={({ pressed }) => [
                styles.headAction,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.headActionText}>Quản lý</Text>
              <Ionicons
                name="chevron-forward"
                size={15}
                color={colors.primaryAction}
              />
            </Pressable>
          </View>

          <Text style={styles.pausedHint}>
            Khi đang tắt, bạn không nhận đơn mới và cũng không đi thuê được. Ca
            đã hẹn vẫn còn hiệu lực.
          </Text>

          {scheduledQuery.isError || liveQuery.isError ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Thử tải lại các ca đã hẹn"
              onPress={() => {
                void scheduledQuery.refetch();
                void liveQuery.refetch();
              }}
              style={({ pressed }) => [
                styles.pausedRetry,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="alert-circle-outline"
                size={14}
                color={colors.warning}
              />
              <Text style={styles.pausedRetryText}>
                Không tải được các ca đã hẹn. Nhấn để thử lại.
              </Text>
            </Pressable>
          ) : null}

          <View style={styles.pausedActionRow}>
            <Button
              label="Bật lại"
              variant="outline"
              size="sm"
              fullWidth={false}
              loading={enabling}
              onPress={() => void enablePlayerMode()}
            />
          </View>
        </View>

        {liveList}
        {scheduledList}
      </>
    );
  }

  const retryAll = () => {
    void statisticQuery.refetch();
    void pendingQuery.refetch();
    void requestsQuery.refetch();
    void scheduledQuery.refetch();
    void liveQuery.refetch();
    void ratingsQuery.refetch();
  };

  // Nothing came back at all — one honest failure for the whole dashboard beats
  // six separate "could not load" rows.
  const nothingLoaded =
    statisticQuery.isError &&
    requestsQuery.isError &&
    scheduledQuery.isError &&
    live.length === 0 &&
    requests.length === 0 &&
    scheduled.length === 0;

  if (nothingLoaded) {
    return (
      <ErrorView
        message="Không tải được công việc của bạn. Kiểm tra kết nối rồi thử lại."
        onRetry={retryAll}
      />
    );
  }

  return (
    <>
      <SummaryCard
        isAccepting={Boolean(user?.isPlayer)}
        loading={statisticQuery.isLoading}
        revenueToday={statisticQuery.data?.item1}
        revenueMonth={statisticQuery.data?.item2}
        rating={user?.rate ?? 0}
        ratingCount={user?.numOfRate ?? 0}
        pendingTotal={pendingTotal}
        pendingCount={pending.length}
        pendingFailed={pendingQuery.isError && pending.length === 0}
        onManage={() => router.push('/manage-hiring')}
        onStatistics={() => router.push('/statistics')}
        onPending={() => router.push('/unactive-balance')}
        onRatings={() => router.push(`/ratings/${userId}`)}
      />

      {liveList}

      <WorkList
        title="Yêu cầu chờ phản hồi"
        icon="file-tray-stacked-outline"
        orders={requests}
        loading={requestsQuery.isLoading}
        error={requestsQuery.isError && requests.length === 0}
        onRetry={() => void requestsQuery.refetch()}
        onSeeAll={() => router.push('/history')}
        metaOf={(order) =>
          `${order.totalTimes} giờ · ${formatVnd(order.finalPrices)}${
            order.processExpired
              ? ` · trả lời trước ${formatDateTime(order.processExpired)}`
              : ''
          }`
        }
        onPress={(order) => router.push(`/receive-request/${order.id}`)}
      />

      {scheduledList}

      {ratings.length > 0 ? (
        <View style={styles.card}>
          <SectionHeader
            title="Đánh giá gần đây"
            icon="star-outline"
            actionLabel="Xem tất cả"
            onAction={() => router.push(`/ratings/${userId}?canReport=1`)}
          />
          {ratings.map((rating) => (
            <View key={rating.id} style={styles.ratingRow}>
              <Avatar
                uri={rating.user?.avatar ?? ''}
                name={rating.user?.name ?? '?'}
                size={34}
              />
              <View style={styles.ratingBody}>
                <View style={styles.ratingHead}>
                  <Text
                    style={styles.ratingName}
                    numberOfLines={1}
                  >
                    {rating.user?.name ?? 'Người thuê'}
                  </Text>
                  <View style={styles.stars}>
                    <Ionicons name="star" size={12} color={colors.gold} />
                    <Text style={styles.starsValue}>{rating.rate.toFixed(1)}</Text>
                  </View>
                </View>
                <Text style={styles.ratingComment} numberOfLines={2}>
                  {rating.comment || 'Không có bình luận'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}

function SummaryCard({
  isAccepting,
  loading,
  revenueToday,
  revenueMonth,
  rating,
  ratingCount,
  pendingTotal,
  pendingCount,
  pendingFailed,
  onManage,
  onStatistics,
  onPending,
  onRatings,
}: {
  isAccepting: boolean;
  loading: boolean;
  revenueToday?: number;
  revenueMonth?: number;
  rating: number;
  ratingCount: number;
  pendingTotal: number;
  pendingCount: number;
  pendingFailed: boolean;
  onManage: () => void;
  onStatistics: () => void;
  onPending: () => void;
  onRatings: () => void;
}) {
  const { type } = useResponsive();

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <View style={styles.headLabelWrap}>
          <Text style={[styles.headTitle, type.title3]}>Ca trực của bạn</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isAccepting
                    ? colors.success
                    : colors.textFaint,
                },
              ]}
            />
            <Text style={styles.statusText}>
              {isAccepting ? 'Đang nhận yêu cầu thuê' : 'Đang tạm ngừng nhận thuê'}
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quản lý nhận thuê"
          onPress={onManage}
          style={({ pressed }) => [styles.headAction, pressed && styles.pressed]}
        >
          <Text style={styles.headActionText}>Quản lý</Text>
          <Ionicons name="chevron-forward" size={15} color={colors.primaryAction} />
        </Pressable>
      </View>

      <View style={styles.tileRow}>
        {loading ? (
          <>
            <Skeleton height={48} radius={radius.md} style={styles.tileSkeleton} />
            <Skeleton height={48} radius={radius.md} style={styles.tileSkeleton} />
          </>
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xem thống kê doanh thu"
              onPress={onStatistics}
              style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
            >
              <Text style={styles.tileLabel}>Doanh thu hôm nay</Text>
              <Text
                style={[styles.tileValue, type.bodyMedium]}
                numberOfLines={1}
              >
                {revenueToday === undefined ? '—' : formatVnd(revenueToday)}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xem thống kê doanh thu"
              onPress={onStatistics}
              style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
            >
              <Text style={styles.tileLabel}>Doanh thu tháng này</Text>
              <Text
                style={[styles.tileValue, type.bodyMedium]}
                numberOfLines={1}
              >
                {revenueMonth === undefined ? '—' : formatVnd(revenueMonth)}
              </Text>
            </Pressable>
          </>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Xem số dư chờ về ví"
        onPress={onPending}
        style={({ pressed }) => [styles.footRow, pressed && styles.pressed]}
      >
        <Text style={styles.footText}>
          {pendingFailed
            ? 'Không tải được số dư chờ về ví.'
            : pendingCount > 0
              ? `${formatVnd(pendingTotal)} đang chờ về ví · ${pendingCount} phiên`
              : 'Chưa có khoản nào chờ thanh toán'}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textFaint} />
      </Pressable>

      <View style={styles.divider} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          ratingCount > 0
            ? `Xem ${ratingCount} đánh giá, trung bình ${rating.toFixed(1)} sao`
            : 'Xem mục đánh giá'
        }
        onPress={onRatings}
        style={({ pressed }) => [styles.footRow, pressed && styles.pressed]}
      >
        <View style={styles.ratingPill}>
          <Ionicons name="star" size={12} color={colors.goldText} />
          <Text style={styles.ratingPillValue}>
            {ratingCount > 0 ? rating.toFixed(1) : '—'}
          </Text>
        </View>
        <Text style={styles.footText} numberOfLines={1}>
          {ratingCount > 0
            ? `${ratingCount} đánh giá từ người thuê`
            : 'Chưa có đánh giá nào'}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textFaint} />
      </Pressable>
    </View>
  );
}

function WorkList({
  title,
  icon,
  orders,
  loading,
  error = false,
  onRetry,
  onSeeAll,
  metaOf,
  onPress,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  orders: OrderModel[];
  loading: boolean;
  error?: boolean;
  onRetry?: () => void;
  onSeeAll?: () => void;
  metaOf: (order: OrderModel) => string;
  onPress: (order: OrderModel) => void;
}) {
  const { type } = useResponsive();

  return (
    <View style={styles.card}>
      <SectionHeader
        title={title}
        icon={icon}
        actionLabel={!error && orders.length > 0 && onSeeAll ? 'Xem tất cả' : undefined}
        onAction={onSeeAll}
      />

      {error ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>Không tải được mục này.</Text>
          {onRetry ? (
            <Text
              accessibilityRole="button"
              style={styles.errorAction}
              onPress={onRetry}
            >
              Thử lại
            </Text>
          ) : null}
        </View>
      ) : loading ? (
        <>
          <Skeleton height={15} width="60%" radius={radius.xs} />
          <Skeleton height={15} width="45%" radius={radius.xs} />
        </>
      ) : orders.length === 0 ? (
        <Text style={styles.empty}>Không có mục nào ở đây.</Text>
      ) : (
        orders.map((order) => {
          const hirer = order.user;
          return (
            <Pressable
              key={order.id}
              accessibilityRole="button"
              accessibilityLabel={`Mở lượt thuê với ${
                hirer?.name ?? 'người thuê'
              }`}
              onPress={() => onPress(order)}
              style={({ pressed }) => [styles.orderRow, pressed && styles.pressed]}
            >
              <Avatar
                uri={hirer?.avatar ?? ''}
                name={hirer?.name ?? '?'}
                size={38}
              />
              <View style={styles.orderBody}>
                <Text style={[styles.orderName, type.bodyMedium]} numberOfLines={1}>
                  {hirer?.name ?? 'Người thuê'}
                </Text>
                <Text
                  style={[styles.orderMeta, type.bodySmall]}
                  numberOfLines={2}
                >
                  {metaOf(order)}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textFaint}
              />
            </Pressable>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  pressed: { opacity: 0.7 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headLabelWrap: { flex: 1, minWidth: 0, gap: 2 },
  headTitle: { color: colors.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: radius.pill },
  statusText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  headAction: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  headActionText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primaryAction,
  },
  pausedHint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  pausedRetry: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pausedRetryText: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.warning,
  },
  pausedActionRow: {
    alignSelf: 'center',
    marginTop: spacing.xxs,
    minWidth: 160,
  },
  tileRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  tile: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primaryFaint,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  tileSkeleton: { flex: 1, minWidth: 0 },
  tileLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 15,
    color: colors.primaryAction,
  },
  tileValue: { color: colors.primaryInk },
  footRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 34,
  },
  footText: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.goldSoft,
  },
  ratingPillValue: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.goldText,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  orderBody: { flex: 1, minWidth: 0 },
  orderName: { color: colors.text },
  orderMeta: { color: colors.textMuted },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  ratingBody: { flex: 1, minWidth: 0 },
  ratingHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  ratingName: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text,
  },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  starsValue: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textSecondary,
  },
  ratingComment: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    paddingVertical: spacing.xs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  errorAction: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryAction,
  },
});
