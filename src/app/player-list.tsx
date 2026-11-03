import { useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlayerRowCard } from '@/components/players/PlayerRowCard';
import { AppBar, EmptyState, ErrorView, LoadingView } from '@/components/ui';
import {
  PLAYER_LIST_SOURCES,
  resolvePlayerListSource,
  usePlayerListSource,
} from '@/features/discovery/playerListSources';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuthStore } from '@/store/auth';
import { colors, spacing } from '@/theme';

/**
 * Reached as `/player-list?source=<rail>`, so the URL alone says what to show.
 * The list is re-read from the same cache entry the home rail filled — a return
 * from the background, a reload or a shared link all land on real data instead
 * of whatever a previous screen left in memory.
 */
export default function PlayerListScreen() {
  const { source: sourceParam } = useLocalSearchParams<{
    source?: string | string[];
  }>();
  const source = resolvePlayerListSource(sourceParam);
  const { gutter, contentStyle, columns } = useResponsive();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? '';

  // Recommendations are seeded from the top-rated rail, exactly as the home
  // screen seeds them, so both screens ask for the same cache entry. That rail's
  // own key ignores the context, which is why the empty ids below are harmless.
  const seeds = usePlayerListSource(
    'top-rating',
    { userId, topPlayerIds: [] },
    { enabled: source === 'recommend' },
  );
  const topPlayerIds = (seeds.data ?? []).map((player) => player.id);
  const canRecommend = Boolean(userId) && topPlayerIds.length === 5;

  const listQuery = usePlayerListSource(
    source,
    { userId, topPlayerIds },
    { enabled: source !== 'recommend' || canRecommend },
  );

  const seeding = source === 'recommend' && !canRecommend && !seeds.isError;
  const players = listQuery.data ?? [];
  const failed = source === 'recommend' && seeds.isError ? seeds : listQuery;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar
        title={source ? PLAYER_LIST_SOURCES[source].title : 'Danh sách người chơi'}
      />

      {!source ? (
        <EmptyState
          icon="people-outline"
          title="Không có dữ liệu"
          description="Danh sách chỉ hiện khi mở từ một mục trên trang Chủ."
        />
      ) : failed.isError ? (
        <ErrorView onRetry={() => failed.refetch()} />
      ) : seeding || (!listQuery.data && listQuery.isPending) ? (
        <LoadingView />
      ) : players.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="Không có dữ liệu"
          description="Hiện chưa có người chơi nào trong danh mục này."
        />
      ) : (
        <FlatList
          data={players}
          keyExtractor={(item) => item.id}
          numColumns={columns(320, spacing.sm)}
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <PlayerRowCard player={item} />
            </View>
          )}
          style={contentStyle}
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: gutter, gap: spacing.sm },
          ]}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingVertical: spacing.sm, paddingBottom: spacing.xl },
  cell: { flex: 1 },
});
