import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { GetAllUserModel } from '@/api/types';
import { playerStatusColor } from '@/features/discovery/status';
import { formatNumber, initialsOf } from '@/lib/format';
import { colors, fonts, radius, spacing } from '@/theme';

interface PlayerCardProps {
  player: GetAllUserModel;
  width?: number;
}

export function PlayerCard({ player, width = 150 }: PlayerCardProps) {
  const router = useRouter();
  const hasStatus = ['Online', 'Offline', 'Hiring', 'Processing'].includes(
    player.status,
  );

  return (
    <Pressable
      onPress={() => router.push(`/player/${player.id}`)}
      style={({ pressed }) => [{ width }, pressed && styles.pressed]}
    >
      <View style={[styles.imageWrap, { width, height: width }]}>
        {player.avatar ? (
          <Image
            source={{ uri: player.avatar }}
            style={styles.image}
            contentFit="cover"
            transition={120}
          />
        ) : (
          <View style={styles.fallback}>
            <Text style={styles.fallbackText}>{initialsOf(player.name)}</Text>
          </View>
        )}
      </View>

      <View style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={1}>
          {player.name}
        </Text>
        {hasStatus ? (
          <View
            style={[
              styles.dot,
              { backgroundColor: playerStatusColor(player.status) },
            ]}
          />
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.price} numberOfLines={1}>
          {formatNumber(player.pricePerHour)}đ/h
        </Text>
        <Text style={styles.separator}>·</Text>
        <Ionicons name="star" size={12} color={colors.gold} />
        <Text style={styles.rating}>{player.rate.toFixed(1)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  imageWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
  },
  image: { width: '100%', height: '100%' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fallbackText: {
    fontFamily: fonts.bold,
    fontSize: 30,
    color: colors.primaryDark,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.xs,
  },
  name: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  price: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  separator: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textFaint,
  },
  rating: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
});
