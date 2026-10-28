import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gameService } from '@/api/services/catalog';
import type { GamesModel } from '@/api/types';
import { AppBar, ErrorView, LoadingView, useToast } from '@/components/ui';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, radius, spacing } from '@/theme';

interface ToggleVariables {
  game: GamesModel;
  favorite: boolean;
}

export default function FavoriteGamesScreen() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const gamesQuery = useQuery({
    queryKey: queryKeys.allGames,
    queryFn: async () => (await gameService.getAll()).content,
  });

  const favoritesQuery = useQuery({
    queryKey: queryKeys.favoriteGames,
    queryFn: async () => (await gameService.getFavorites()).content,
  });

  const favoriteIds = useMemo(
    () => new Set((favoritesQuery.data ?? []).map((game) => game.id)),
    [favoritesQuery.data],
  );

  const toggle = useMutation({
    mutationFn: async ({ game, favorite }: ToggleVariables) => {
      if (favorite) {
        await gameService.removeFavorite(game.id);
      } else {
        await gameService.addFavorite(game.id);
      }
    },
    onMutate: async ({ game, favorite }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favoriteGames });
      const previous = queryClient.getQueryData<GamesModel[]>(
        queryKeys.favoriteGames,
      );
      queryClient.setQueryData<GamesModel[]>(queryKeys.favoriteGames, (games) =>
        favorite
          ? (games ?? []).filter((item) => item.id !== game.id)
          : [...(games ?? []), game],
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKeys.favoriteGames, context?.previous);
      toast.show('Không cập nhật được game yêu thích', 'error');
    },
    onSuccess: (_data, { favorite }) => {
      toast.show(
        favorite ? 'Đã bỏ khỏi game yêu thích' : 'Đã thêm vào game yêu thích',
        'success',
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.favoriteGames });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.mostFavoritedGames,
      });
    },
  });

  const games = gamesQuery.data ?? [];
  const pendingGameId = toggle.isPending ? toggle.variables?.game.id : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar
        title="Game yêu thích"
        subtitle={`${favoriteIds.size} game đã chọn`}
      />

      {gamesQuery.isLoading || favoritesQuery.isLoading ? (
        <LoadingView />
      ) : gamesQuery.isError ? (
        <ErrorView onRetry={() => gamesQuery.refetch()} />
      ) : games.length === 0 ? (
        <Text style={styles.empty}>Chưa có dữ liệu</Text>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.hint}>
            Chọn những game bạn thích để chúng xuất hiện trong gợi ý và bộ lọc
            tìm người chơi.
          </Text>

          {games.map((game) => {
            const favorite = favoriteIds.has(game.id);
            const label = game.displayName || game.name;
            const busy = pendingGameId === game.id;

            return (
              <Pressable
                key={game.id}
                disabled={busy}
                onPress={() => toggle.mutate({ game, favorite })}
                style={({ pressed }) => [
                  styles.row,
                  favorite && styles.rowActive,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.rowText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {label}
                  </Text>
                  {game.otherName ? (
                    <Text style={styles.otherName} numberOfLines={1}>
                      {game.otherName}
                    </Text>
                  ) : null}
                </View>

                {busy ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons
                    name={favorite ? 'heart' : 'heart-outline'}
                    size={22}
                    color={favorite ? colors.primary : colors.textFaint}
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.xs,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  rowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryFaint,
  },
  rowText: { flex: 1, gap: 2 },
  name: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  otherName: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  pressed: { opacity: 0.7 },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    padding: spacing.lg,
  },
});
