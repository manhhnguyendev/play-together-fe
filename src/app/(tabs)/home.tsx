import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { recommendService } from '@/api/services/content';
import { userService } from '@/api/services/users';
import type { GetAllUserModel } from '@/api/types';
import { PlayerRail } from '@/components/players/PlayerRail';
import { EmptyState, HomeAppBar } from '@/components/ui';
import { playerListDraft } from '@/features/discovery/playerListDraft';
import { useOngoingOrderGuard } from '@/features/orders/useOngoingOrderGuard';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, spacing } from '@/theme';

const RECOMMEND_SCORE_THRESHOLD = 3.5;

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  useOngoingOrderGuard();

  const newAccountsQuery = useQuery({
    queryKey: queryKeys.home.newAccounts,
    queryFn: async () => (await userService.getNewAccounts()).content,
  });

  const sameHobbiesQuery = useQuery({
    queryKey: queryKeys.home.sameHobbies,
    queryFn: async () => (await userService.getSameHobbies()).content,
  });

  const topRatingQuery = useQuery({
    queryKey: queryKeys.home.topRating,
    queryFn: async () => (await userService.getTopRating()).content,
  });

  const recentOrdersQuery = useQuery({
    queryKey: queryKeys.home.recentOrders,
    queryFn: async () => (await userService.getRecentOrders()).content,
  });

  const topPlayerIds = (topRatingQuery.data ?? []).map((player) => player.id);
  const canRecommend = Boolean(user?.id) && topPlayerIds.length === 5;

  const recommendQuery = useQuery({
    queryKey: queryKeys.home.recommend(user?.id ?? '', topPlayerIds),
    enabled: canRecommend,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const results = await recommendService.predict(
        topPlayerIds.map((playerId) => ({
          userId: user!.id,
          playerId,
        })),
      );
      const accepted = results.filter(
        (item) => Number(item.score) > RECOMMEND_SCORE_THRESHOLD,
      );
      const previews = await Promise.all(
        accepted.map((item) =>
          userService
            .getPlayerPreviewById(item.playerId)
            .then((response) => response.content)
            .catch(() => null),
        ),
      );
      return previews.filter(
        (player): player is GetAllUserModel => player !== null,
      );
    },
  });

  const recommendations = recommendQuery.data ?? [];
  const hasRecommendations = recommendations.length > 0;
  const showTopPlayers =
    !canRecommend ||
    (recommendQuery.isFetched && !recommendQuery.isFetching && !hasRecommendations);

  const refreshAll = async () => {
    await Promise.all([
      newAccountsQuery.refetch(),
      sameHobbiesQuery.refetch(),
      topRatingQuery.refetch(),
      recentOrdersQuery.refetch(),
      recommendQuery.refetch(),
    ]);
  };

  const refreshing =
    newAccountsQuery.isRefetching ||
    sameHobbiesQuery.isRefetching ||
    topRatingQuery.isRefetching ||
    recentOrdersQuery.isRefetching;

  const openList = (title: string, players: GetAllUserModel[]) => {
    playerListDraft.set({ title, players });
    router.push('/player-list');
  };

  const nothingToShow =
    newAccountsQuery.isFetched &&
    sameHobbiesQuery.isFetched &&
    (newAccountsQuery.data ?? []).length === 0 &&
    (sameHobbiesQuery.data ?? []).length === 0 &&
    !hasRecommendations &&
    (topRatingQuery.data ?? []).length === 0 &&
    (recentOrdersQuery.data ?? []).length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <HomeAppBar />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshAll}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.hello}>Xin chào</Text>
          <Text style={styles.name}>{user?.name ?? 'bạn'}</Text>
          <Text style={styles.heroText}>
            Tìm người chơi phù hợp và bắt đầu những trận game đáng nhớ.
          </Text>
        </View>

        {hasRecommendations ? (
          <PlayerRail
            title="Đề xuất cho bạn"
            players={recommendations}
            onSeeAll={() => openList('Đề xuất cho bạn', recommendations)}
          />
        ) : null}

        <PlayerRail
          title="Các người chơi mới"
          players={newAccountsQuery.data}
          loading={newAccountsQuery.isLoading}
          onSeeAll={() =>
            openList('Các người chơi mới', newAccountsQuery.data ?? [])
          }
        />

        {showTopPlayers ? (
          <PlayerRail
            title="Top người chơi ưa thích"
            players={topRatingQuery.data}
            loading={topRatingQuery.isLoading}
            onSeeAll={() =>
              openList('Top người chơi ưa thích', topRatingQuery.data ?? [])
            }
          />
        ) : null}

        <PlayerRail
          title="Có thể bạn sẽ thích"
          players={sameHobbiesQuery.data}
          loading={sameHobbiesQuery.isLoading}
          onSeeAll={() =>
            openList('Có thể bạn sẽ thích', sameHobbiesQuery.data ?? [])
          }
        />

        {(recentOrdersQuery.data ?? []).length > 0 ? (
          <PlayerRail
            title="Thuê lại"
            players={recentOrdersQuery.data}
            onSeeAll={() =>
              openList('Thuê lại', recentOrdersQuery.data ?? [])
            }
          />
        ) : null}

        {nothingToShow ? (
          <EmptyState
            icon="people-outline"
            title="Chưa có người chơi nào"
            description="Hãy quay lại sau hoặc thử tìm kiếm người chơi theo tựa game bạn thích."
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingVertical: spacing.md,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  hero: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
    padding: spacing.lg,
  },
  hello: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primaryDark,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.text,
    marginTop: 2,
  },
  heroText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
