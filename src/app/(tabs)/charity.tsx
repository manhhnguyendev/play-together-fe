import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
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
import { charityService } from '@/api/services/content';
import type { CharityModel } from '@/api/types';
import { EmptyState, ErrorView, LoadingView } from '@/components/ui';
import { useOngoingOrderGuard } from '@/features/orders/useOngoingOrderGuard';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, radius, spacing } from '@/theme';

export default function CharityScreen() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);

  useOngoingOrderGuard();

  const charitiesQuery = useQuery({
    queryKey: queryKeys.charities(searchTerm, pageSize),
    queryFn: async () => {
      if (searchTerm) {
        return charityService.search(searchTerm);
      }
      return charityService.getAll(pageSize);
    },
  });

  const charities = charitiesQuery.data?.content ?? [];
  const hasNext = searchTerm ? false : (charitiesQuery.data?.hasNext ?? false);

  const submitSearch = () => {
    setPageSize(10);
    setSearchTerm(searchInput.trim());
  };

  const loadMore = () => {
    if (!hasNext || charitiesQuery.isFetching) return;
    setPageSize((value) => value + 10);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.appBar}>
        <Image
          source={require('../../../assets/images/play_together_logo_no_text.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={submitSearch}
            returnKeyType="search"
            placeholder="Tìm kiếm"
            placeholderTextColor={colors.textFaint}
            style={styles.searchInput}
          />
          {searchInput.length > 0 ? (
            <Pressable
              hitSlop={8}
              onPress={() => {
                setSearchInput('');
                setSearchTerm('');
                setPageSize(10);
              }}
            >
              <Ionicons name="close-circle" size={17} color={colors.textFaint} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {charitiesQuery.isLoading ? (
        <LoadingView />
      ) : charitiesQuery.isError ? (
        <ErrorView onRetry={() => charitiesQuery.refetch()} />
      ) : charities.length === 0 ? (
        <EmptyState
          icon="gift-outline"
          title="Không có dữ liệu"
          description="Chưa có tổ chức từ thiện nào phù hợp."
        />
      ) : (
        <FlatList
          data={charities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <CharityCard
              charity={item}
              onPress={() => router.push(`/charity/${item.id}`)}
            />
          )}
          ListFooterComponent={
            hasNext && charitiesQuery.isFetching ? (
              <Text style={styles.loadingMore}>Đang tải...</Text>
            ) : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}

function CharityCard({
  charity,
  onPress,
}: {
  charity: CharityModel;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Image
        source={{ uri: charity.avatar }}
        style={styles.cardImage}
        contentFit="cover"
      />
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>
          {charity.organizationName}
        </Text>
        <Text style={styles.cardText} numberOfLines={2}>
          {charity.address}
        </Text>
        <Text style={styles.cardText} numberOfLines={1}>
          {charity.phone}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  logo: { width: 46, height: 46, borderRadius: 23 },
  searchBox: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },
  list: { padding: spacing.md, gap: spacing.md },
  card: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pressed: { opacity: 0.7 },
  cardImage: {
    width: 96,
    height: 96,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
  },
  cardBody: { flex: 1, gap: 4, justifyContent: 'center' },
  cardName: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  cardText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  loadingMore: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
