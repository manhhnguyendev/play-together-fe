import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
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
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { queryKeys } from '@/lib/queryKeys';
import {
  colors,
  control,
  fonts,
  hitSlop,
  radius,
  shadow,
  spacing,
} from '@/theme';

const LOGO = require('../../../assets/images/logo_v2_mark.png');

export default function CharityScreen() {
  const router = useAppRouter();
  const { gutter, contentStyle } = useResponsive();
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);


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
      <View style={[styles.appBar, { paddingHorizontal: gutter }]} accessibilityRole="header">
        <View style={contentStyle}>
          <View style={styles.appBarRow}>
            <View style={styles.logoWrap}>
              <Image
                source={LOGO}
                style={styles.logo}
                contentFit="contain"
                accessibilityLabel="Play Together"
              />
            </View>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                onSubmitEditing={submitSearch}
                returnKeyType="search"
                placeholder="Tìm tổ chức từ thiện"
                placeholderTextColor={colors.textFaint}
                accessibilityLabel="Tìm tổ chức từ thiện"
                style={styles.searchInput}
              />
              {searchInput.length > 0 ? (
                <Pressable
                  hitSlop={hitSlop.md}
                  accessibilityRole="button"
                  accessibilityLabel="Xoá từ khoá"
                  onPress={() => {
                    setSearchInput('');
                    setSearchTerm('');
                    setPageSize(10);
                  }}
                >
                  <Ionicons name="close-circle" size={18} color={colors.textFaint} />
                </Pressable>
              ) : null}
            </View>
          </View>
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
          style={contentStyle}
          contentContainerStyle={[styles.list, { paddingHorizontal: gutter }]}
          keyboardShouldPersistTaps="handled"
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
  safe: { flex: 1, backgroundColor: colors.background },
  appBar: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  appBarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.plaque,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  logo: { width: '100%', height: '100%' },
  searchBox: {
    flex: 1,
    height: control.inputHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
  list: { padding: spacing.md, gap: spacing.md, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    ...shadow.card,
  },
  pressed: { opacity: 0.75 },
  cardImage: {
    width: 88,
    height: 88,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
  },
  cardBody: { flex: 1, minWidth: 0, gap: 4, justifyContent: 'center' },
  cardName: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  cardText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },
  loadingMore: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
