import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlayerRowCard } from '@/components/players/PlayerRowCard';
import { AppBar, EmptyState } from '@/components/ui';
import { playerListDraft } from '@/features/discovery/playerListDraft';
import { colors, spacing } from '@/theme';

export default function PlayerListScreen() {
  const payload = playerListDraft.get();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title={payload?.title ?? 'Danh sách người chơi'} />
      <FlatList
        data={payload?.players ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PlayerRowCard player={item} />}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.empty}>
            <EmptyState
              icon="people-outline"
              title="Không có dữ liệu"
              description="Hiện chưa có người chơi nào trong danh mục này."
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { paddingBottom: spacing.xl },
  empty: { paddingTop: spacing.xxl },
});
