import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { userService } from '@/api/services/users';
import type { GetAllUserModel } from '@/api/types';
import { playerStatusColor } from '@/features/discovery/status';
import { formatNumber, initialsOf } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, radius, spacing } from '@/theme';

interface PlayerRowCardProps {
  player: GetAllUserModel;
}

export function PlayerRowCard({ player }: PlayerRowCardProps) {
  const router = useRouter();

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
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: { opacity: 0.8 },
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.primaryDark,
  },
  info: { flex: 1, justifyContent: 'space-between' },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 17,
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
    marginTop: 4,
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.primaryDark,
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
    fontSize: 13,
    marginTop: 2,
  },
});
