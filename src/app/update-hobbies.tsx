import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gameService, hobbyService } from '@/api/services/catalog';
import {
  AppBar,
  Button,
  Checkbox,
  ErrorView,
  LoadingView,
  useToast,
} from '@/components/ui';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, spacing } from '@/theme';

export default function UpdateHobbiesScreen() {
  const toast = useToast();
  const queryClient = useQueryClient();
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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
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
            data={games}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <Text style={styles.heading}>Bạn thích tựa games nào?</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Checkbox
                  checked={Boolean(selected[item.id])}
                  onPress={() =>
                    setOverrides((current) => ({
                      ...current,
                      [item.id]: !selected[item.id],
                    }))
                  }
                  label={item.displayName || item.name}
                />
              </View>
            )}
          />
          <View style={styles.footer}>
            <Button
              label="Cập nhật"
              size="lg"
              loading={submitting}
              onPress={() => void submit()}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  list: { padding: spacing.md, paddingBottom: spacing.lg },
  heading: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  row: { paddingVertical: 6 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
