import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { GetAllUserModel } from '@/api/types';
import { PlayerCard } from '@/components/players/PlayerCard';
import { SectionHeader } from '@/components/ui';
import { colors, fonts, spacing } from '@/theme';

interface PlayerRailProps {
  title: string;
  players?: GetAllUserModel[];
  loading?: boolean;
  onSeeAll?: () => void;
}

export function PlayerRail({ title, players, loading, onSeeAll }: PlayerRailProps) {
  const items = players ?? [];

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <SectionHeader
          title={title}
          actionLabel={items.length > 0 && onSeeAll ? 'Xem tất cả' : undefined}
          onAction={onSeeAll}
        />
      </View>

      {loading ? (
        <View style={styles.skeletonRow}>
          {[0, 1, 2].map((key) => (
            <View key={key} style={styles.skeletonCard}>
              <View style={styles.skeletonImage} />
              <View style={styles.skeletonLine} />
              <View style={styles.skeletonLineShort} />
            </View>
          ))}
        </View>
      ) : items.length === 0 ? (
        <Text style={styles.empty}>Chưa có dữ liệu</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {items.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs },
  header: { paddingHorizontal: spacing.md },
  row: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skeletonCard: { width: 150, gap: 6 },
  skeletonImage: {
    width: 150,
    height: 150,
    borderRadius: 14,
    backgroundColor: '#E4E4EE',
  },
  skeletonLine: {
    height: 12,
    width: '70%',
    borderRadius: 4,
    backgroundColor: '#E4E4EE',
  },
  skeletonLineShort: {
    height: 10,
    width: '45%',
    borderRadius: 4,
    backgroundColor: '#E4E4EE',
  },
});
