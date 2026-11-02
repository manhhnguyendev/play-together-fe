import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { PlayerDashboard } from '@/components/player/PlayerDashboard';
import { PlayerRail } from '@/components/players/PlayerRail';
import { EmptyState, ErrorView, HomeAppBar } from '@/components/ui';
import { playerListDraft } from '@/features/discovery/playerListDraft';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, radius, spacing } from '@/theme';

const MIN_RECOMMEND_SCORE = 0;

type LoadableList = { isError: boolean; data?: GetAllUserModel[] };

const failedWithNothing = (list: LoadableList): boolean =>
  list.isError && (list.data ?? []).length === 0;

export default function HomeScreen() {
  const router = useAppRouter();
  const queryClient = useQueryClient();
  const { gutter, contentStyle } = useResponsive();
  const user = useAuthStore((state) => state.user);

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
      const results = await recommendService.predict(topPlayerIds.length);
      return results
        .filter((item) => Number(item.score) > MIN_RECOMMEND_SCORE)
        .map((item) => item.player);
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
      // The player dashboard owns its own queries; pull-to-refresh has to reach
      // them too, otherwise the numbers a player is paid by go stale in plain
      // sight. Their keys are shared with the screens they also feed.
      queryClient.invalidateQueries({ queryKey: queryKeys.playerWork.root }),
      queryClient.invalidateQueries({ queryKey: queryKeys.statistic }),
      queryClient.invalidateQueries({ queryKey: queryKeys.unActiveBalances }),
    ]);
  };

  const refreshing =
    newAccountsQuery.isRefetching ||
    sameHobbiesQuery.isRefetching ||
    topRatingQuery.isRefetching ||
    recentOrdersQuery.isRefetching;

  // One shared failure across the discovery rails is a connection or server
  // problem, not an empty catalogue: say it once, loudly, instead of three
  // times in small type. Only when nothing loaded at all — a failed refresh
  // still has the list the user was already reading.
  const discoveryFailed =
    failedWithNothing(newAccountsQuery) &&
    failedWithNothing(sameHobbiesQuery) &&
    failedWithNothing(topRatingQuery) &&
    !hasRecommendations;

  const openList = (title: string, players: GetAllUserModel[]) => {
    playerListDraft.set({ title, players });
    router.push('/player-list');
  };

  const nothingToShow =
    !discoveryFailed &&
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
        contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshAll}
            tintColor={colors.primaryAction}
            colors={[colors.primaryAction]}
          />
        }
      >
        <View style={[styles.content, contentStyle]}>
          <View style={styles.hero}>
            <Text style={styles.hello}>Xin chào</Text>
            <Text style={styles.name} numberOfLines={1}>
              {user?.name ?? 'bạn'}
            </Text>
            <Text style={styles.heroText}>
              Tìm người chơi phù hợp và bắt đầu những trận game đáng nhớ.
            </Text>
          </View>

          {user?.isPlayer || user?.hasSkills ? <PlayerDashboard /> : null}

          {hasRecommendations ? (
            <PlayerRail
              title="Đề xuất cho bạn"
              players={recommendations}
              onSeeAll={() => openList('Đề xuất cho bạn', recommendations)}
            />
          ) : null}

          {discoveryFailed ? (
            <ErrorView
              message="Không tải được danh sách người chơi. Kiểm tra kết nối rồi thử lại."
              onRetry={() => void refreshAll()}
            />
          ) : (
            <>
              <PlayerRail
                title="Các người chơi mới"
                players={newAccountsQuery.data}
                loading={newAccountsQuery.isLoading}
                error={newAccountsQuery.isError}
                onRetry={() => void newAccountsQuery.refetch()}
                onSeeAll={() =>
                  openList('Các người chơi mới', newAccountsQuery.data ?? [])
                }
              />

              {showTopPlayers ? (
                <PlayerRail
                  title="Top người chơi ưa thích"
                  players={topRatingQuery.data}
                  loading={topRatingQuery.isLoading}
                  error={topRatingQuery.isError}
                  onRetry={() => void topRatingQuery.refetch()}
                  onSeeAll={() =>
                    openList('Top người chơi ưa thích', topRatingQuery.data ?? [])
                  }
                />
              ) : null}

              <PlayerRail
                title="Có thể bạn sẽ thích"
                players={sameHobbiesQuery.data}
                loading={sameHobbiesQuery.isLoading}
                error={sameHobbiesQuery.isError}
                onRetry={() => void sameHobbiesQuery.refetch()}
                onSeeAll={() =>
                  openList('Có thể bạn sẽ thích', sameHobbiesQuery.data ?? [])
                }
              />
            </>
          )}

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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingVertical: spacing.md, paddingBottom: spacing.xxl },
  content: { gap: spacing.lg },
  hero: {
    backgroundColor: colors.primaryFaint,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  hello: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primaryAction,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 31,
    color: colors.text,
    marginTop: 2,
  },
  heroText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
