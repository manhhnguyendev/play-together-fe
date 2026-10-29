import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
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
import { formatDateTime } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, spacing } from '@/theme';

const VOTE_OPTIONS: { label: string; value: number }[] = [
  { label: 'Tất cả', value: 0 },
  { label: '5 sao', value: 5 },
  { label: '4 sao', value: 4 },
  { label: '3 sao', value: 3 },
  { label: '2 sao', value: 2 },
  { label: '1 sao', value: 1 },
];

export default function RatingsScreen() {
  const router = useRouter();
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

      {summaryQuery.data && summaryQuery.data.count > 0 ? (
        <RatingSummaryCard summary={summaryQuery.data} />
      ) : null}

      <View style={styles.filterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {VOTE_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={vote === option.value}
              onPress={() => changeVote(option.value)}
            />
          ))}
        </ScrollView>
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
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <RatingCard
              rating={item}
              canReport={canReport}
              onReport={() =>
                router.push({
                  pathname: '/report-comment',
                  params: { rateId: item.id, name: item.user?.name ?? '' },
                })
              }
            />
          )}
          ListFooterComponent={
            hasNext ? (
              <View style={styles.footer}>
                <Button
                  label="Tải thêm"
                  variant="secondary"
                  loading={ratingsQuery.isFetching}
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

function RatingSummaryCard({ summary }: { summary: RatingSummary }) {
  const max = Math.max(...Object.values(summary.distribution), 1);

  return (
    <View style={styles.summary}>
      <View style={styles.summaryScore}>
        <Text style={styles.summaryAverage}>{summary.average.toFixed(1)}</Text>
        <RatingStars value={Math.round(summary.average)} size={14} />
        <Text style={styles.summaryCount}>{summary.count} đánh giá</Text>
      </View>
      <View style={styles.summaryBars}>
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const count =
            summary.distribution[
              String(star) as keyof RatingSummary['distribution']
            ];
          return (
            <View key={star} style={styles.summaryBarRow}>
              <Text style={styles.summaryBarLabel}>{star}</Text>
              <Ionicons name="star" size={11} color={colors.gold} />
              <View style={styles.summaryBarTrack}>
                <View
                  style={[
                    styles.summaryBarFill,
                    { width: `${Math.round((count / max) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.summaryBarCount}>{count}</Text>
            </View>
          );
        })}
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
  return (
    <View style={styles.card}>
      <View style={styles.avatarWrap}>
        {rating.user?.avatar ? (
          <Image
            source={{ uri: rating.user.avatar }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Ionicons name="person" size={20} color={colors.primaryDark} />
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.name} numberOfLines={1}>
            {rating.user?.name ?? 'Người chơi'}
          </Text>
          {canReport ? (
            <Pressable hitSlop={8} onPress={onReport}>
              <Ionicons
                name="flag-outline"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          ) : null}
        </View>
        <RatingStars value={rating.rate} size={14} />
        <Text style={styles.date}>{formatDateTime(rating.createdDate)}</Text>
        <Text style={styles.comment}>{rating.comment}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  summary: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  summaryScore: { alignItems: 'center', gap: 4, width: 96 },
  summaryAverage: {
    fontFamily: fonts.bold,
    fontSize: 30,
    color: colors.text,
  },
  summaryCount: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  summaryBars: { flex: 1, gap: 3, justifyContent: 'center' },
  summaryBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryBarLabel: {
    width: 10,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
  },
  summaryBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  summaryBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  summaryBarCount: {
    width: 24,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
  },
  filterWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  filterRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  card: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 3 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  date: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textFaint,
  },
  comment: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  footer: { paddingTop: spacing.md },
});
