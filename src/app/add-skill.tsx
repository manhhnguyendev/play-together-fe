import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { gameOfUserService, gameService } from '@/api/services/catalog';
import { userService } from '@/api/services/users';
import {
  AppBar,
  Button,
  Checkbox,
  ErrorView,
  LoadingView,
  useToast,
} from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { displayNameOfGame } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, radius, spacing, touchTarget } from '@/theme';

const MAX_SKILLS = 5;

export default function AddSkillScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle, type } = useResponsive();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? '';
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const gamesQuery = useQuery({
    queryKey: queryKeys.allGames,
    queryFn: async () => (await gameService.getAll()).content,
  });

  const skillsQuery = useQuery({
    queryKey: queryKeys.gamesOfUser(userId),
    enabled: Boolean(userId),
    queryFn: async () => (await userService.getGameOfUser(userId)).content,
  });

  const existingNames = useMemo(
    () => new Set((skillsQuery.data ?? []).map((item) => item.game?.name)),
    [skillsQuery.data],
  );

  const availableGames = useMemo(
    () => (gamesQuery.data ?? []).filter((game) => !existingNames.has(game.name)),
    [existingNames, gamesQuery.data],
  );

  const toggle = (gameId: string) => {
    setSelected((current) =>
      current.includes(gameId)
        ? current.filter((id) => id !== gameId)
        : [...current, gameId],
    );
  };

  const submit = async () => {
    if (selected.length === 0) {
      toast.show('Vui lòng chọn kỹ năng!', 'error');
      return;
    }
    const total = (skillsQuery.data?.length ?? 0) + selected.length;
    if (total > MAX_SKILLS) {
      toast.show(`Chỉ được thêm tối đa ${MAX_SKILLS} kỹ năng`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      await gameOfUserService.create(
        selected.map((gameId) => ({ gameId, rankId: '' })),
      );
      await queryClient.invalidateQueries({
        queryKey: queryKeys.gamesOfUser(userId),
      });
      toast.show('Thêm thành công', 'success');
      router.back();
    } catch {
      toast.show('Thêm thất bại', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const loading = gamesQuery.isLoading || skillsQuery.isLoading;
  const error = gamesQuery.isError || skillsQuery.isError;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Thêm kỹ năng" />

      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView
          onRetry={() => {
            void gamesQuery.refetch();
            void skillsQuery.refetch();
          }}
        />
      ) : (
        <>
          <ScrollView
            style={contentStyle}
            contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
            showsVerticalScrollIndicator={false}
          >
            {availableGames.length === 0 ? (
              <Text style={[styles.empty, type.body]}>
                Bạn đã thêm tất cả tựa game hiện có.
              </Text>
            ) : (
              <View style={styles.card}>
                {availableGames.map((game, index) => (
                  <View
                    key={game.id}
                    style={[styles.row, index > 0 && styles.rowDivider]}
                  >
                    <Checkbox
                      checked={selected.includes(game.id)}
                      onPress={() => toggle(game.id)}
                      label={displayNameOfGame(game)}
                    />
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <View
            style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}
          >
            <View style={styles.footerInner}>
              <Button
                label="Cập nhật"
                size="lg"
                onPress={() => void submit()}
                loading={submitting}
              />
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingVertical: spacing.md, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  row: { minHeight: touchTarget },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerInner: { maxWidth: 420, width: '100%', alignSelf: 'center' },
});
