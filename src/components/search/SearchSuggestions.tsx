import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { gameService } from '@/api/services/catalog';
import { searchHistoryService } from '@/api/services/content';
import { Button, ErrorView, Skeleton, useToast } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { queryKeys } from '@/lib/queryKeys';
import { colors, control, fonts, hitSlop, radius, spacing } from '@/theme';

/**
 * The empty state of the search screen: what the user looked for before, what
 * everyone else looks for, and which games are running now. Mounted only while
 * no keyword is active, so its three requests never run behind a result list.
 */
export function SearchSuggestions({
  onPick,
}: {
  onPick: (value: string) => void;
}) {
  const { gutter, itemWidth } = useResponsive();

  const recentQuery = useQuery({
    queryKey: queryKeys.searchHistory,
    queryFn: async () => (await searchHistoryService.getAll()).content,
  });

  const queryClient = useQueryClient();
  const toast = useToast();
  const invalidateHistory = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.searchHistory });

  const removeOne = useMutation({
    mutationFn: (id: string) => searchHistoryService.remove(id),
    onSuccess: invalidateHistory,
    onError: () => toast.show('Không thể xoá tìm kiếm', 'error'),
  });

  const clearAll = useMutation({
    mutationFn: () => searchHistoryService.clear(),
    onSuccess: async () => {
      await invalidateHistory();
      toast.show('Đã xoá lịch sử tìm kiếm', 'success');
    },
    onError: () => toast.show('Không thể xoá lịch sử tìm kiếm', 'error'),
  });

  const hotQuery = useQuery({
    queryKey: queryKeys.hotSearch,
    queryFn: async () => (await searchHistoryService.getHot()).content,
  });

  const gamesQuery = useQuery({
    queryKey: queryKeys.mostFavoritedGames,
    queryFn: async () => (await gameService.getMostFavorite()).content,
  });

  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <SearchSection
        title="Tìm kiếm gần đây"
        loading={recentQuery.isLoading}
        error={recentQuery.isError}
        onRetry={() => recentQuery.refetch()}
        items={(recentQuery.data ?? []).map((item) => ({
          id: item.id,
          value: item.searchString,
        }))}
        onPick={onPick}
        onRemove={clearAll.isPending ? undefined : (id) => removeOne.mutate(id)}
        onClear={clearAll.isPending ? undefined : () => clearAll.mutate()}
        emptyLabel="Chưa có tìm kiếm nào"
      />

      <SearchSection
        title="Top tìm kiếm"
        loading={hotQuery.isLoading}
        error={hotQuery.isError}
        onRetry={() => hotQuery.refetch()}
        items={(hotQuery.data ?? []).map((item) => ({
          id: item.id,
          value: item.searchString,
        }))}
        onPick={onPick}
        emptyLabel="Chưa có dữ liệu"
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Các tựa game hot</Text>
        {gamesQuery.isLoading ? (
          <View style={styles.grid}>
            {[0, 1, 2, 3].map((key) => (
              <Skeleton
                key={key}
                width={itemWidth(140, spacing.sm)}
                height={46}
                radius={radius.md}
              />
            ))}
          </View>
        ) : gamesQuery.isError && (gamesQuery.data ?? []).length === 0 ? (
          <View style={styles.gamesError}>
            <Text style={styles.empty}>
              Không tải được danh sách game hot.
            </Text>
            <Button
              label="Thử lại"
              variant="outline"
              size="sm"
              fullWidth={false}
              onPress={() => void gamesQuery.refetch()}
            />
          </View>
        ) : (gamesQuery.data ?? []).length === 0 ? (
          <Text style={styles.empty}>Chưa có dữ liệu</Text>
        ) : (
          <View style={styles.grid}>
            {(gamesQuery.data ?? []).map((game) => {
              const label =
                game.displayName || game.name || game.otherName || '';
              if (!label) return null;
              return (
                <Pressable
                  key={game.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Tìm kiếm ${label}`}
                  onPress={() => onPick(label)}
                  style={({ pressed }) => [
                    styles.gameChip,
                    { width: itemWidth(140, spacing.sm) },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.gameChipText} numberOfLines={1}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function SearchSection({
  title,
  items,
  loading,
  error,
  onRetry,
  onPick,
  onRemove,
  onClear,
  emptyLabel,
}: {
  title: string;
  items: { id: string; value: string }[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onPick: (value: string) => void;
  onRemove?: (id: string) => void;
  onClear?: () => void;
  emptyLabel: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onClear && items.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xoá tất cả lịch sử tìm kiếm"
            hitSlop={hitSlop.sm}
            onPress={onClear}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <Text style={styles.clearText}>Xoá tất cả</Text>
          </Pressable>
        ) : null}
      </View>
      {loading ? (
        <View style={styles.loadingRows}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="45%" height={16} />
        </View>
      ) : error ? (
        <ErrorView onRetry={onRetry} />
      ) : items.length === 0 ? (
        <Text style={styles.empty}>{emptyLabel}</Text>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Tìm kiếm ${item.value}`}
              onPress={() => onPick(item.value)}
              style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}
            >
              <Ionicons
                name="time-outline"
                size={16}
                color={colors.textFaint}
              />
              <Text style={styles.rowText} numberOfLines={1}>
                {item.value}
              </Text>
            </Pressable>
            {onRemove ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Xoá ${item.value}`}
                hitSlop={hitSlop.sm}
                onPress={() => onRemove(item.id)}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <Ionicons name="close" size={16} color={colors.textFaint} />
              </Pressable>
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  pressed: { opacity: 0.7 },
  section: { gap: spacing.xs },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 28,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
    letterSpacing: -0.2,
  },
  clearText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.danger,
    paddingVertical: spacing.xxs,
  },
  loadingRows: { gap: spacing.sm, paddingVertical: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: control.buttonSm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: control.buttonSm,
    paddingVertical: spacing.xs,
  },
  rowText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    paddingVertical: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  gamesError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  gameChip: {
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  gameChipText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primaryInk,
  },
});
