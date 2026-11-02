import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchService } from '@/api/services/content';
import { PlayerRowCard } from '@/components/players/PlayerRowCard';
import { Button, EmptyState, ErrorView, LoadingView } from '@/components/ui';
import {
  STATUS_BY_ORDER,
  useDiscoveryFilter,
} from '@/features/discovery/filterStore';
import type { DiscoveryFilters } from '@/features/discovery/filterStore';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { queryKeys } from '@/lib/queryKeys';
import { colors, control, fonts, hitSlop, radius, spacing } from '@/theme';

const INITIAL_PAGE_SIZE = 20;

export default function SearchScreen() {
  const router = useAppRouter();
  const { gutter, contentStyle, columns } = useResponsive();
  const params = useLocalSearchParams<{ q?: string }>();
  const initialKeyword = typeof params.q === 'string' ? params.q : '';

  const [form, setForm] = useState({
    sourceQ: initialKeyword,
    input: initialKeyword,
    keyword: initialKeyword,
  });
  const formState =
    form.sourceQ === initialKeyword
      ? form
      : { sourceQ: initialKeyword, input: initialKeyword, keyword: initialKeyword };
  const input = formState.input;
  const keyword = formState.keyword;
  const [pagination, setPagination] = useState<{
    filters: DiscoveryFilters | null;
    q: string | null;
    pageSize: number;
  }>({
    filters: null,
    q: null,
    pageSize: INITIAL_PAGE_SIZE,
  });

  const filters = useDiscoveryFilter((state) => state.filters);
  const resetFilters = useDiscoveryFilter((state) => state.reset);

  const pageSize =
    pagination.filters === filters && pagination.q === initialKeyword
      ? pagination.pageSize
      : INITIAL_PAGE_SIZE;

  const setPageSize = (next: number | ((value: number) => number)) =>
    setPagination({
      filters,
      q: initialKeyword,
      pageSize: typeof next === 'function' ? next(pageSize) : next,
    });

  const setInput = (value: string) => setForm({ ...formState, input: value });
  const setKeyword = (value: string) =>
    setForm({ ...formState, keyword: value });

  const searchQuery = useQuery({
    queryKey: queryKeys.search(keyword, filters, pageSize),
    enabled: keyword.trim().length > 0,
    queryFn: async () => {
      if (filters.applied) {
        return searchService.searchUserByFilter(
          keyword.trim(),
          {
            isMale: filters.isMale,
            isFemale: filters.isFemale,
            gameId: filters.gameIds.join(' '),
            initial: filters.initial,
            status: STATUS_BY_ORDER[filters.statusOrder] ?? '',
            sortByAlphabet: filters.sortOrder === 4,
            sortByRating: filters.sortOrder === 2,
            sortByHobby: filters.sortOrder === 1,
            sortByPrice: filters.sortOrder === 3,
            startPrice: filters.startPrice,
            endPrice: filters.endPrice,
          },
          pageSize,
        );
      }
      return searchService.searchUser(keyword.trim(), pageSize);
    },
  });

  const queryClient = useQueryClient();
  const { mutate: recordSearch } = useMutation({
    mutationFn: searchService.recordSearch,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.searchHistory }),
  });
  const lastRecorded = useRef('');

  const record = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed || lastRecorded.current === trimmed) return;
      lastRecorded.current = trimmed;
      recordSearch(trimmed);
    },
    [recordSearch],
  );

  useEffect(() => {
    if (initialKeyword) record(initialKeyword);
  }, [initialKeyword, record]);

  const submit = () => {
    const next = input.trim();
    setKeyword(next);
    setPageSize(INITIAL_PAGE_SIZE);
    record(next);
  };

  const results = searchQuery.data?.content ?? [];
  const hasNext = searchQuery.data?.hasNext ?? false;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={[styles.appBar, { paddingHorizontal: gutter }]}>
        <Pressable
          hitSlop={hitSlop.md}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={submit}
            placeholder="Tìm người chơi, tựa game"
            placeholderTextColor={colors.textFaint}
            accessibilityLabel="Từ khoá tìm kiếm"
            returnKeyType="search"
            style={styles.input}
          />
          {input ? (
            <Pressable
              hitSlop={hitSlop.md}
              accessibilityRole="button"
              accessibilityLabel="Xoá từ khoá"
              onPress={() => setForm({ ...formState, input: '', keyword: '' })}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textFaint}
              />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          hitSlop={hitSlop.md}
          accessibilityRole="button"
          accessibilityLabel="Bộ lọc tìm kiếm"
          accessibilityState={{ selected: filters.applied }}
          onPress={() => router.push('/filter')}
          style={({ pressed }) => [
            styles.filterButton,
            filters.applied && styles.filterButtonActive,
            pressed && styles.backPressed,
          ]}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={filters.applied ? colors.primaryAction : colors.text}
          />
        </Pressable>
      </View>

      {filters.applied ? (
        <View style={[styles.filterBar, { paddingHorizontal: gutter }]}>
          <View style={contentStyle}>
            <View style={styles.filterBarRow}>
              <Text style={styles.filterText} numberOfLines={1}>
                Đang áp dụng bộ lọc
              </Text>
              <Pressable
                hitSlop={hitSlop.sm}
                accessibilityRole="button"
                onPress={resetFilters}
              >
                <Text style={styles.clearFilter}>Xóa lọc</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {keyword.trim().length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="Tìm người chơi"
          description="Nhập tên người chơi hoặc tựa game bạn muốn tìm."
        />
      ) : searchQuery.isLoading ? (
        <LoadingView />
      ) : searchQuery.isError ? (
        <ErrorView onRetry={() => searchQuery.refetch()} />
      ) : results.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="Không có dữ liệu"
          description="Thử từ khóa khác hoặc thay đổi bộ lọc."
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={columns(320, spacing.sm)}
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <PlayerRowCard player={item} />
            </View>
          )}
          keyboardShouldPersistTaps="handled"
          style={contentStyle}
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: gutter, gap: spacing.sm },
          ]}
          ListFooterComponent={
            hasNext ? (
              <View style={styles.footer}>
                <Button
                  label="Tải thêm"
                  variant="secondary"
                  loading={searchQuery.isFetching}
                  onPress={() => setPageSize((value) => value + 10)}
                />
              </View>
            ) : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: control.appBarHeight,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
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
  searchBox: {
    flex: 1,
    minWidth: 0,
    height: control.inputHeight,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  filterButtonActive: {
    backgroundColor: colors.primaryFaint,
    borderColor: colors.primaryBorder,
    borderWidth: 1,
  },
  filterBar: {
    backgroundColor: colors.primarySoft,
    paddingVertical: spacing.sm,
  },
  filterBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  filterText: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primaryInk,
  },
  clearFilter: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryAction,
  },
  listContent: { paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  cell: { flex: 1 },
  footer: { padding: spacing.md },
});
