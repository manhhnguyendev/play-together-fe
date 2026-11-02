import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { userService } from '@/api/services/users';
import type { GetAllUserModel } from '@/api/types';
import { playerStatusColor } from '@/features/discovery/status';
import { useAppRouter } from '@/hooks/useAppRouter';
import { formatNumber, initialsOf } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, radius, spacing } from '@/theme';

interface PlayerRowCardProps {
  player: GetAllUserModel;
}

export function PlayerRowCard({ player }: PlayerRowCardProps) {
  const router = useAppRouter();

  const gamesQuery = useQuery({
    queryKey: queryKeys.gamesOfUser(player.id),
    queryFn: async () => (await userService.getGameOfUser(player.id)).content,
    staleTime: 5 * 60_000,
  });

  const gamesText = (gamesQuery.data ?? [])
    .map((item) => item.game?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={() => router.push(`/player/${player.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${player.name}, ${formatNumber(player.pricePerHour)}đ mỗi giờ`}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.avatarWrap}>
        {player.avatar ? (
          <Image
            source={{ uri: player.avatar }}
            style={styles.avatar}
            contentFit="cover"
            transition={120}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>
              {initialsOf(player.name)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {player.name}
        </Text>
        <Text style={styles.games} numberOfLines={1}>
          {gamesText || 'Chưa cập nhật kỹ năng'}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.price}>
            {formatNumber(player.pricePerHour)}đ/h
          </Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={13} color={colors.gold} />
            <Text style={styles.ratingValue}>{player.rate.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({player.numOfRate})</Text>
          </View>
        </View>

        <Text
          style={[
            styles.status,
            { color: playerStatusColor(player.status) },
          ]}
          numberOfLines={1}
        >
          {player.status === 'Online'
            ? 'Đang online'
            : player.status === 'Offline'
              ? 'Đang offline'
              : player.status === 'Processing'
                ? 'Đang thương lượng'
                : player.status === 'Hiring'
                  ? 'Đang được thuê'
                  : player.status}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  avatarWrap: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.primaryAction,
  },
  info: { flex: 1, minWidth: 0, justifyContent: 'space-between' },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  games: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginTop: 4,
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.primaryInk,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingValue: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text,
  },
  ratingCount: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textFaint,
  },
  status: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 2,
  },
});
