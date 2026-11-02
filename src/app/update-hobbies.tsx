import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { gameService, hobbyService } from '@/api/services/catalog';
import {
  AppBar,
  Button,
  Checkbox,
  ErrorView,
  LoadingView,
  useToast,
} from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, control, radius, spacing } from '@/theme';

export default function UpdateHobbiesScreen() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle, columns, type } = useResponsive();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? '';
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const gamesQuery = useQuery({
    queryKey: queryKeys.allGames,
    queryFn: async () => (await gameService.getAll()).content,
  });

  const hobbiesQuery = useQuery({
    queryKey: queryKeys.hobbies(userId),
    enabled: Boolean(userId),
    queryFn: async () => (await hobbyService.getOfUser(userId)).content,
  });

  const games = useMemo(() => gamesQuery.data ?? [], [gamesQuery.data]);
  const hobbies = useMemo(() => hobbiesQuery.data ?? [], [hobbiesQuery.data]);

  const selected = useMemo(() => {
    const hobbyNames = new Set(
      hobbies.flatMap((hobby) =>
        [hobby.game?.name, hobby.game?.displayName, hobby.game?.otherName].filter(
          (value): value is string => Boolean(value),
        ),
      ),
    );
    const next: Record<string, boolean> = {};
    games.forEach((game) => {
      next[game.id] = overrides[game.id] ?? hobbyNames.has(game.name);
    });
    return next;
  }, [games, hobbies, overrides]);

  const selectedIds = useMemo(
    () => games.filter((game) => selected[game.id]).map((game) => game.id),
    [games, selected],
  );

  const submit = async () => {
    if (submitting) return;
    if (selectedIds.length === 0) {
      toast.show('Vui lòng chọn ít nhất 1 sở thích', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (hobbies.length > 0) {
        await hobbyService.remove(
          hobbies.map((hobby) => ({ hobbyId: hobby.id })),
        );
      }
      await hobbyService.create(
        selectedIds.map((gameId) => ({ gameId })),
      );
      await queryClient.invalidateQueries({
        queryKey: queryKeys.hobbies(userId),
      });
      toast.show('Cập nhật thành công', 'success');
    } catch {
      toast.show('Cập nhật thất bại', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const loading = gamesQuery.isLoading || hobbiesQuery.isLoading;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Cài đặt sở thích" />
      {loading ? (
        <LoadingView />
      ) : gamesQuery.isError || hobbiesQuery.isError ? (
        <ErrorView
          onRetry={() => {
            void gamesQuery.refetch();
            void hobbiesQuery.refetch();
          }}
        />
      ) : (
        <>
          <FlatList
            style={contentStyle}
            data={games}
            keyExtractor={(item) => item.id}
            numColumns={columns(240, spacing.sm)}
            contentContainerStyle={[
              styles.list,
              { paddingHorizontal: gutter, gap: spacing.sm },
            ]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Text style={[styles.heading, type.title3]}>
                Bạn thích tựa games nào?
              </Text>
            }
            renderItem={({ item }) => {
              const active = Boolean(selected[item.id]);
              const label = item.displayName || item.name;
              return (
                <View style={styles.cell}>
                  <View
                    style={[styles.tile, active && styles.tileActive]}
                  >
                    <Checkbox
                      checked={active}
                      onPress={() =>
                        setOverrides((current) => ({
                          ...current,
                          [item.id]: !selected[item.id],
                        }))
                      }
                      label={label}
                    />
                  </View>
                </View>
              );
            }}
          />
          <View
            style={[
              styles.footer,
              { paddingBottom: insets.bottom + spacing.sm },
            ]}
          >
            <View style={styles.footerInner}>
              <Button
                label="Cập nhật"
                size="lg"
                loading={submitting}
                onPress={() => void submit()}
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
  list: { paddingVertical: spacing.md, paddingBottom: spacing.lg },
  heading: {
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cell: { flex: 1, minWidth: 0 },
  tile: {
    minHeight: control.buttonSm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  tileActive: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryFaint,
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
