import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlayerRowCard } from '@/components/players/PlayerRowCard';
import { AppBar, EmptyState } from '@/components/ui';
import { playerListDraft } from '@/features/discovery/playerListDraft';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, spacing } from '@/theme';

export default function PlayerListScreen() {
  const [payload] = useState(() => playerListDraft.take());
  const { gutter, contentStyle, columns } = useResponsive();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title={payload?.title ?? 'Danh sách người chơi'} />
      <FlatList
        data={payload?.players ?? []}
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
        ListEmptyComponent={
          <View style={styles.empty}>
            <EmptyState
              icon="people-outline"
              title="Không có dữ liệu"
              description={
                payload
                  ? 'Hiện chưa có người chơi nào trong danh mục này.'
                  : 'Danh sách chỉ hiện khi mở từ một mục trên trang Chủ.'
              }
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingVertical: spacing.sm, paddingBottom: spacing.xl },
  cell: { flex: 1 },
  empty: { paddingTop: spacing.xxl, flex: 1 },
});
