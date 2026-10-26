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

  const ratings = ratingsQuery.data?.content ?? [];
  const hasNext = ratingsQuery.data?.hasNext ?? false;

  const changeVote = (value: number) => {
    setVote(value);
    setPageSize(10);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Chi tiết đánh giá" />

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
