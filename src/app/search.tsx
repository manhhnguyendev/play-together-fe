import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, radius, spacing } from '@/theme';

const INITIAL_PAGE_SIZE = 20;

export default function SearchScreen() {
  const router = useRouter();
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
        return searchService.searchUserByFilter(keyword.trim(), {
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
        });
      }
      return searchService.searchUser(keyword.trim(), pageSize);
    },
  });

  const submit = () => {
    const next = input.trim();
    setKeyword(next);
    setPageSize(INITIAL_PAGE_SIZE);
  };

  const results = searchQuery.data?.content ?? [];
  const hasNext = searchQuery.data?.hasNext ?? false;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.appBar}>
        <Pressable
          hitSlop={10}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={submit}
            placeholder="Tìm kiếm"
            placeholderTextColor={colors.textFaint}
            returnKeyType="search"
            style={styles.input}
          />
          {input ? (
            <Pressable
              hitSlop={8}
              onPress={() =>
                setForm({ ...formState, input: '', keyword: '' })
              }
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.primary}
              />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          hitSlop={10}
          onPress={() => router.push('/filter')}
          style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}
        >
          <Ionicons
            name="options-outline"
            size={24}
            color={colors.primary}
          />
          {filters.applied ? <View style={styles.filterDot} /> : null}
        </Pressable>
      </View>

      {filters.applied ? (
        <View style={styles.filterBar}>
          <Text style={styles.filterText} numberOfLines={1}>
            Đang áp dụng bộ lọc
          </Text>
          <Pressable hitSlop={8} onPress={resetFilters}>
            <Text style={styles.clearFilter}>Xóa lọc</Text>
          </Pressable>
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
          renderItem={({ item }) => <PlayerRowCard player={item} />}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
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
  safe: { flex: 1, backgroundColor: colors.surface },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  searchBox: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.background,
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
  filterButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 10,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primaryFaint,
  },
  filterText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.primaryDark,
  },
  clearFilter: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.danger,
  },
  listContent: { paddingBottom: spacing.xl },
  footer: { padding: spacing.md },
});
