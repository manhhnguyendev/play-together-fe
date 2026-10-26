import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gameOfUserService, gameService } from '@/api/services/catalog';
import { userService } from '@/api/services/users';
import type { GameOfUserModel } from '@/api/types';
import {
  AppBar,
  ErrorView,
  LoadingView,
  SelectField,
  useToast,
} from '@/components/ui';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, radius, spacing } from '@/theme';

export default function UpdateSkillsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? '';

  const gamesQuery = useQuery({
    queryKey: queryKeys.gamesOfUser(userId),
    enabled: Boolean(userId),
    queryFn: async () => (await userService.getGameOfUser(userId)).content,
  });

  const games = gamesQuery.data ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar
        title="Chỉnh sửa kỹ năng"
        right={
          <Pressable hitSlop={10} onPress={() => router.push('/add-skill')}>
            <Ionicons name="add" size={26} color={colors.text} />
          </Pressable>
        }
      />

      {gamesQuery.isLoading ? (
        <LoadingView />
      ) : gamesQuery.isError ? (
        <ErrorView onRetry={() => gamesQuery.refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {games.length === 0 ? (
            <Text style={styles.empty}>Không có dữ liệu</Text>
          ) : (
            games.map((game) => (
              <SkillRow
                key={game.id}
                userId={userId}
                game={game}
                canDelete={!user?.isPlayer || games.length > 1}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SkillRow({
  userId,
  game,
  canDelete,
}: {
  userId: string;
  game: GameOfUserModel;
  canDelete: boolean;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const hasRank = game.rankId !== 'None';
  const [rankOverride, setRankOverride] = useState<{
    gameId: string;
    rankId: string | null;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const rankId =
    rankOverride?.gameId === game.id
      ? rankOverride.rankId
      : hasRank
        ? game.rankId
        : null;

  const setRankId = (value: string | null) =>
    setRankOverride({ gameId: game.id, rankId: value });

  const ranksQuery = useQuery({
    queryKey: queryKeys.gameRanks(game.gameId),
    enabled: hasRank,
    queryFn: async () => (await gameService.getAllRanks(game.gameId)).content,
  });

  const options = useMemo(
    () =>
      (ranksQuery.data ?? []).map((rank) => ({
        label: rank.name,
        value: rank.id,
      })),
    [ranksQuery.data],
  );

  const changeRank = async (value: string) => {
    const previous = rankId;
    setRankId(value);
    try {
      await gameOfUserService.update(game.id, { rankId: value });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.gamesOfUser(userId),
      });
      toast.show('Cập nhật thành công', 'success');
    } catch {
      setRankId(previous);
      toast.show('Cập nhật thất bại', 'error');
    }
  };

  const remove = async () => {
    if (!canDelete) {
      toast.show(
        'Trạng thái nhận yêu cầu thuê đang bật, bạn cần có tối thiểu 1 kỹ năng',
        'error',
      );
      return;
    }
    setBusy(true);
    try {
      await gameOfUserService.remove(game.id);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.gamesOfUser(userId),
      });
      toast.show('Xóa thành công', 'success');
    } catch {
      toast.show('Xóa thất bại', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.skillRow}>
      <Text style={styles.gameName} numberOfLines={2}>
        {game.game?.name}
      </Text>
      {hasRank ? (
        <View style={styles.rankField}>
          <SelectField
            placeholder="Chọn rank"
            value={rankId}
            options={options}
            onChange={(value) => void changeRank(value)}
          />
        </View>
      ) : (
        <View style={styles.rankField} />
      )}
      <Pressable
        hitSlop={8}
        disabled={busy}
        onPress={() => void remove()}
        style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
      >
        <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  gameName: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  rankField: { width: 138 },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
});
