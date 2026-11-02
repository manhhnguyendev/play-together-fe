import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { GetAllUserModel } from '@/api/types';
import { PlayerCard } from '@/components/players/PlayerCard';
import { Button, SectionHeader, Skeleton } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, fonts, radius, spacing } from '@/theme';

interface PlayerRailProps {
  title: string;
  players?: GetAllUserModel[];
  loading?: boolean;
  /** Only shown when there is nothing to keep on screen — a failed refresh
   * must not throw away the list already loaded. */
  error?: boolean;
  onRetry?: () => void;
  onSeeAll?: () => void;
}

export function PlayerRail({
  title,
  players,
  loading,
  error,
  onRetry,
  onSeeAll,
}: PlayerRailProps) {
  const items = players ?? [];
  const { gutter, cardWidth } = useResponsive();
  const width = cardWidth(spacing.sm);

  return (
    <View style={styles.section}>
      <View style={{ paddingHorizontal: gutter }}>
        <SectionHeader
          title={title}
          actionLabel={items.length > 0 && onSeeAll ? 'Xem tất cả' : undefined}
          onAction={onSeeAll}
        />
      </View>

      {loading ? (
        <View style={[styles.skeletonRow, { paddingHorizontal: gutter }]}>
          {[0, 1, 2, 3].map((key) => (
            <View key={key} style={{ width, gap: 6 }}>
              <Skeleton width={width} height={width} radius={radius.md} />
              <Skeleton height={12} width="70%" radius={radius.xs} />
              <Skeleton height={10} width="45%" radius={radius.xs} />
            </View>
          ))}
        </View>
      ) : error && items.length === 0 ? (
        <View style={[styles.errorRow, { paddingHorizontal: gutter }]}>
          <Text style={styles.empty}>Không tải được mục này.</Text>
          {onRetry ? (
            <Button
              label="Thử lại"
              variant="outline"
              size="sm"
              fullWidth={false}
              onPress={onRetry}
            />
          ) : null}
        </View>
      ) : items.length === 0 ? (
        <Text style={[styles.empty, { paddingHorizontal: gutter }]}>
          Chưa có dữ liệu
        </Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.row, { paddingHorizontal: gutter }]}
        >
          {items.map((player) => (
            <PlayerCard key={player.id} player={player} width={width} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs },
  row: { gap: spacing.sm, paddingBottom: spacing.xs },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  skeletonRow: { flexDirection: 'row', gap: spacing.sm },
});
