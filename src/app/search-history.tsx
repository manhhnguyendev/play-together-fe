import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gameService } from '@/api/services/catalog';
import {
  searchHistoryService,
} from '@/api/services/content';
import { Button, ErrorView, Skeleton, useToast } from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { queryKeys } from '@/lib/queryKeys';
import { colors, control, fonts, hitSlop, radius, spacing } from '@/theme';

export default function SearchHistoryScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { gutter, contentStyle, itemWidth } = useResponsive();
  const [keyword, setKeyword] = useState('');

  const recentQuery = useQuery({
    queryKey: queryKeys.searchHistory,
    queryFn: async () => (await searchHistoryService.getAll()).content,
  });

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

  const openSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push({ pathname: '/search', params: { q: trimmed } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.appBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          hitSlop={hitSlop.sm}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={() => openSearch(keyword)}
            placeholder="Tìm người chơi, tựa game"
            placeholderTextColor={colors.textFaint}
            accessibilityLabel="Từ khoá tìm kiếm"
            returnKeyType="search"
            style={styles.input}
            autoFocus
          />
          {keyword ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xoá từ khoá"
              hitSlop={hitSlop.sm}
              onPress={() => setKeyword('')}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.primaryAction}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={contentStyle}
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
          onPressValue={openSearch}
          onRemove={
            clearAll.isPending ? undefined : (id) => removeOne.mutate(id)
          }
          onClear={
            clearAll.isPending ? undefined : () => clearAll.mutate()
          }
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
          onPressValue={openSearch}
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
                return (
                  <Pressable
                    key={game.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Tìm kiếm ${label}`}
                    onPress={() => openSearch(label)}
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
    </SafeAreaView>
  );
}

function SearchSection({
  title,
  items,
  loading,
  error,
  onRetry,
  onPressValue,
  onRemove,
  onClear,
  emptyLabel,
}: {
  title: string;
  items: { id: string; value: string }[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onPressValue: (value: string) => void;
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
              onPress={() => onPressValue(item.value)}
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
  safe: { flex: 1, backgroundColor: colors.surface },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: control.appBarHeight,
    paddingRight: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  backPressed: { opacity: 0.7 },
  pressed: { opacity: 0.7 },
  searchBox: {
    flex: 1,
    height: control.inputHeight,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 8,
  },
  scroll: {
    paddingVertical: spacing.md,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
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
