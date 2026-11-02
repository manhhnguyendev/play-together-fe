import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/ui';
import { colors, fonts, radius, spacing } from '@/theme';

interface Party {
  name?: string | null;
  avatar?: string | null;
}

interface OrderPartiesProps {
  left?: Party | null;
  right?: Party | null;
  size?: number;
}

export function OrderParties({ left, right, size = 76 }: OrderPartiesProps) {
  return (
    <View style={styles.card}>
      <PartyColumn party={left} size={size} />
      <View style={styles.badge}>
        <Image
          source={require('../../../assets/images/logo_v2_mark.png')}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="Play Together"
        />
      </View>
      <PartyColumn party={right} size={size} />
    </View>
  );
}

function PartyColumn({ party, size }: { party?: Party | null; size: number }) {
  return (
    <View style={styles.column}>
      <Avatar uri={party?.avatar} name={party?.name ?? ''} size={size} />
      <Text style={styles.name} numberOfLines={2}>
        {party?.name ?? '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  column: { flex: 1, alignItems: 'center', gap: 6, minWidth: 0 },
  name: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
    textAlign: 'center',
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.plaque,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  logo: { width: 26, height: 26 },
});
