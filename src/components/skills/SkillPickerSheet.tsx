import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gameOfUserService, gameService } from '@/api/services/catalog';
import type { GameOfUserModel } from '@/api/types';
import {
  Button,
  Checkbox,
  ErrorView,
  LoadingView,
  useToast,
} from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { displayNameOfGame } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, hitSlop, radius, spacing, touchTarget } from '@/theme';

const MAX_SKILLS = 5;

/**
 * Picking the games to add used to be its own screen pushed from
 * /update-skills and back out of it again; it is a short list, so it lives in
 * a sheet over the list it modifies. Mount it only while it is open.
 */
export function SkillPickerSheet({
  userId,
  existing,
  onClose,
}: {
  userId: string;
  existing: GameOfUserModel[];
  onClose: () => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle, type } = useResponsive();
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const gamesQuery = useQuery({
    queryKey: queryKeys.allGames,
    queryFn: async () => (await gameService.getAll()).content,
  });

  const existingNames = useMemo(
    () => new Set(existing.map((item) => item.game?.name)),
    [existing],
  );

  const availableGames = useMemo(
    () =>
      (gamesQuery.data ?? []).filter((game) => !existingNames.has(game.name)),
    [existingNames, gamesQuery.data],
  );

  const close = () => {
    if (submitting) return;
    setSelected([]);
    onClose();
  };

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
    if (existing.length + selected.length > MAX_SKILLS) {
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
      setSelected([]);
      onClose();
    } catch {
      toast.show('Thêm thất bại', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng mục chọn kỹ năng"
          style={StyleSheet.absoluteFill}
          onPress={close}
        />
        <View
          style={[
            styles.sheet,
            contentStyle,
            {
              maxHeight: '80%',
              paddingHorizontal: gutter,
              paddingBottom: insets.bottom + spacing.sm,
            },
          ]}
          accessibilityViewIsModal
        >
          <View style={styles.header}>
            <Text style={[styles.title, type.title3]}>Thêm kỹ năng</Text>
            <Pressable
              hitSlop={hitSlop.md}
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              onPress={close}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          {gamesQuery.isLoading ? (
            <LoadingView />
          ) : gamesQuery.isError ? (
            <ErrorView onRetry={() => void gamesQuery.refetch()} />
          ) : availableGames.length === 0 ? (
            <Text style={[styles.empty, type.body]}>
              Bạn đã thêm tất cả tựa game hiện có.
            </Text>
          ) : (
            <ScrollView
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
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
            </ScrollView>
          )}

          <View style={styles.footer}>
            <Text style={[styles.counter, type.caption]}>
              Đã chọn {selected.length}/{MAX_SKILLS}
            </Text>
            <Button
              label="Thêm"
              size="md"
              onPress={() => void submit()}
              loading={submitting}
              fullWidth={false}
              style={styles.submit}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    flexGrow: 0,
    minHeight: 320,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { color: colors.text, flex: 1, minWidth: 0 },
  closeButton: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6, backgroundColor: colors.surfaceMuted },
  list: { flexGrow: 0 },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  counter: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
    flex: 1,
    minWidth: 0,
  },
  submit: { minWidth: 120 },
});
