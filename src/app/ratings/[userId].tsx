import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ratingService } from '@/api/services/content';
import type { RatingModel } from '@/api/types';
import type { RatingSummary } from '@/api/v2/types';
import {
  AppBar,
  Button,
  Chip,
  EmptyState,
  ErrorView,
  LoadingView,
  RatingStars,
} from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { formatDateTime } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { colors, hitSlop, radius, spacing, touchTarget } from '@/theme';

const VOTE_OPTIONS: { label: string; value: number }[] = [
  { label: 'Tất cả', value: 0 },
  { label: '5 sao', value: 5 },
  { label: '4 sao', value: 4 },
  { label: '3 sao', value: 3 },
  { label: '2 sao', value: 2 },
  { label: '1 sao', value: 1 },
];

export default function RatingsScreen() {
  const router = useAppRouter();
  const { gutter, contentStyle } = useResponsive();
  const params = useLocalSearchParams<{ userId?: string; canReport?: string }>();
  const userId = typeof params.userId === 'string' ? params.userId : '';
  const canReport = params.canReport === '1';
  const [vote, setVote] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const ratingsQuery = useQuery({
    queryKey: queryKeys.ratings(userId, vote, pageSize),
    enabled: Boolean(userId),
    queryFn: async () => ratingService.getAll(userId, vote, pageSize),
  });

  const summaryQuery = useQuery({
    queryKey: queryKeys.ratingSummary(userId),
    enabled: Boolean(userId),
    queryFn: () => ratingService.getSummary(userId),
  });

  const ratings = ratingsQuery.data?.content ?? [];
  const hasNext = ratingsQuery.data?.hasNext ?? false;

  const changeVote = (value: number) => {
    setVote(value);
    setPageSize(10);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Chi tiết đánh giá" />

      <View
        style={[
          styles.header,
          { paddingHorizontal: gutter },
          contentStyle,
        ]}
      >
        {summaryQuery.data && summaryQuery.data.count > 0 ? (
          <RatingSummaryCard summary={summaryQuery.data} />
        ) : null}

        <View style={styles.filterRow}>
          {VOTE_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={vote === option.value}
              onPress={() => changeVote(option.value)}
            />
          ))}
        </View>
      </View>

      {ratingsQuery.isLoading ? (
        <LoadingView />
      ) : ratingsQuery.isError ? (
        <ErrorView onRetry={() => ratingsQuery.refetch()} />
      ) : ratings.length === 0 ? (
        <EmptyState
          icon="chatbubble-ellipses-outline"
          title="Chưa có đánh giá"
          description="Người chơi này chưa nhận được đánh giá nào."
        />
      ) : (
        <FlatList
          data={ratings}
          keyExtractor={(item) => item.id}
          style={contentStyle}
          contentContainerStyle={[styles.list, { paddingHorizontal: gutter }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <RatingCard
              rating={item}
              canReport={canReport}
              onReport={() =>
                router.push({
                  pathname: '/report/[target]',
                  params: {
                    target: item.id,
                    kind: 'rating',
                    name: item.user?.name ?? '',
                    avatar: item.user?.avatar ?? '',
                  },
                })
              }
            />
          )}
          ListFooterComponent={
            hasNext ? (
              <View style={styles.footer}>
                <View style={styles.footerInner}>
                  <Button
                    label="Tải thêm"
                    variant="secondary"
                    size="md"
                    loading={ratingsQuery.isFetching}
                    onPress={() => setPageSize((value) => value + 10)}
                  />
                </View>
              </View>
            ) : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}

function RatingSummaryCard({ summary }: { summary: RatingSummary }) {
  const { type } = useResponsive();
  const max = Math.max(...Object.values(summary.distribution), 1);

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`Trung bình ${summary.average.toFixed(
        1,
      )} trên 5 sao, ${summary.count} đánh giá`}
    >
      <View style={styles.summary}>
        <View style={styles.summaryScore}>
          <Text style={[styles.summaryAverage, type.title1]}>
            {summary.average.toFixed(1)}
          </Text>
          <RatingStars value={Math.round(summary.average)} size={14} />
          <Text style={[styles.summaryCount, type.caption]}>
            {summary.count} đánh giá
          </Text>
        </View>
        <View style={styles.summaryBars}>
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count =
              summary.distribution[
                String(star) as keyof RatingSummary['distribution']
              ];
            return (
              <View
                key={star}
                style={styles.summaryBarRow}
                accessibilityRole="text"
                accessibilityLabel={`${star} sao: ${count} đánh giá`}
              >
                <Text style={[styles.summaryBarLabel, type.caption]}>{star}</Text>
                <Ionicons name="star" size={11} color={colors.gold} />
                <View style={styles.summaryBarTrack}>
                  <View
                    style={[
                      styles.summaryBarFill,
                      { width: `${Math.round((count / max) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={[styles.summaryBarCount, type.caption]}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function RatingCard({
  rating,
  canReport,
  onReport,
}: {
  rating: RatingModel;
  canReport: boolean;
  onReport: () => void;
}) {
  const { type } = useResponsive();
  return (
    <View style={[styles.card, styles.ratingCard]}>
      <View style={styles.avatarWrap}>
        {rating.user?.avatar ? (
          <Image
            source={{ uri: rating.user.avatar }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Ionicons name="person" size={20} color={colors.primaryInk} />
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={[styles.name, type.title3]} numberOfLines={1}>
            {rating.user?.name ?? 'Người chơi'}
          </Text>
          {canReport ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Báo cáo bình luận của ${
                rating.user?.name ?? 'Người chơi'
              }`}
              hitSlop={hitSlop.sm}
              onPress={onReport}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="flag-outline" size={19} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <RatingStars value={rating.rate} size={14} />
        <Text style={[styles.date, type.caption]}>
          {formatDateTime(rating.createdDate)}
        </Text>
        <Text style={[styles.comment, type.body]}>{rating.comment}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  summaryScore: {
    alignItems: 'center',
    gap: 4,
    width: 96,
  },
  summaryAverage: { color: colors.text },
  summaryCount: { color: colors.textMuted },
  summaryBars: { flex: 1, gap: 5, minWidth: 0 },
  summaryBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryBarLabel: {
    width: 10,
    color: colors.textMuted,
    textAlign: 'right',
  },
  summaryBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  summaryBarFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primaryAction,
  },
  summaryBarCount: {
    width: 24,
    color: colors.textMuted,
    textAlign: 'right',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  list: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  ratingCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 3, minWidth: 0 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: { flex: 1, color: colors.text, minWidth: 0 },
  iconButton: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6, backgroundColor: colors.surfaceMuted },
  date: { color: colors.textFaint },
  comment: { color: colors.text, marginTop: 2 },
  footer: { paddingTop: spacing.md },
  footerInner: { maxWidth: 320, width: '100%', alignSelf: 'center' },
});
