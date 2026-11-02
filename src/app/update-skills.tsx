import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
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
import { SkillPickerSheet } from '@/components/skills/SkillPickerSheet';
import { useResponsive } from '@/hooks/useResponsive';
import { displayNameOfGame } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import {
  colors,
  hitSlop,
  radius,
  spacing,
  touchTarget,
} from '@/theme';

export default function UpdateSkillsScreen() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { gutter, contentStyle, itemWidth, type } = useResponsive();
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
          <Pressable
            hitSlop={hitSlop.md}
            onPress={() => setPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Thêm kỹ năng"
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={24} color={colors.primaryAction} />
          </Pressable>
        }
      />

      {gamesQuery.isLoading ? (
        <LoadingView />
      ) : gamesQuery.isError ? (
        <ErrorView onRetry={() => gamesQuery.refetch()} />
      ) : (
        <ScrollView
          style={contentStyle}
          contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
          showsVerticalScrollIndicator={false}
        >
          {games.length === 0 ? (
            <Text style={[styles.empty, type.body]}>Không có dữ liệu</Text>
          ) : (
            <View style={styles.grid}>
              {games.map((game) => (
                <SkillRow
                  key={game.id}
                  style={{ width: itemWidth(320, spacing.sm) }}
                  userId={userId}
                  game={game}
                  canDelete={!user?.isPlayer || games.length > 1}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Mounted only while open: react-native-web keeps a closed Modal's node
          in the DOM, and a stale full-screen sheet is exactly what an
          accessibility tree would keep reading. */}
      {pickerOpen ? (
        <SkillPickerSheet
          userId={userId}
          existing={games}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function SkillRow({
  userId,
  game,
  canDelete,
  style,
}: {
  userId: string;
  game: GameOfUserModel;
  canDelete: boolean;
  style?: ViewStyle;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { type } = useResponsive();
  const savedRankId = game.rankId !== 'None' ? game.rankId : null;
  const [rankOverride, setRankOverride] = useState<{
    gameId: string;
    rankId: string | null;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const rankId =
    rankOverride?.gameId === game.id ? rankOverride.rankId : savedRankId;

  const setRankId = (value: string | null) =>
    setRankOverride({ gameId: game.id, rankId: value });

  // The game's rank list decides whether a rank can be picked: gating the query
  // on "this skill already has a rank" left a freshly added skill with no way to
  // ever get one.
  const ranksQuery = useQuery({
    queryKey: queryKeys.gameRanks(game.gameId),
    enabled: Boolean(game.gameId),
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
    <View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.gameName, type.bodyMedium]} numberOfLines={2}>
          {displayNameOfGame(game.game)}
        </Text>
        <Pressable
          hitSlop={hitSlop.sm}
          disabled={busy}
          onPress={() => void remove()}
          accessibilityRole="button"
          accessibilityLabel={`Xóa kỹ năng ${displayNameOfGame(game.game)}`}
          accessibilityState={{ disabled: busy }}
          style={({ pressed }) => [
            styles.deleteButton,
            busy && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="trash-outline" size={19} color={colors.danger} />
        </Pressable>
      </View>
      {options.length > 0 ? (
        <SelectField
          variant="floating"
          label="Rank"
          placeholder="Chọn rank"
          value={rankId}
          options={options}
          onChange={(value) => void changeRank(value)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingVertical: spacing.md, paddingBottom: spacing.xxl },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  gameName: { flex: 1, minWidth: 0, color: colors.text },
  addButton: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryFaint,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  deleteButton: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerSoft,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
