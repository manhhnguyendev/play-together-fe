import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/ui';
import { colors, fonts, spacing } from '@/theme';

interface Party {
  name?: string | null;
  avatar?: string | null;
}

interface OrderPartiesProps {
  left?: Party | null;
  right?: Party | null;
  size?: number;
}

export function OrderParties({ left, right, size = 92 }: OrderPartiesProps) {
  return (
    <View style={styles.row}>
      <PartyColumn party={left} size={size} />
      <Image
        source={require('../../../assets/images/play_together_logo_no_text.png')}
        style={styles.logo}
        contentFit="contain"
      />
      <PartyColumn party={right} size={size} />
    </View>
  );
}

function PartyColumn({ party, size }: { party?: Party | null; size: number }) {
  return (
    <View style={styles.column}>
      <Avatar uri={party?.avatar} name={party?.name ?? ''} size={size} />
      <Text style={styles.name} numberOfLines={1}>
        {party?.name ?? '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  column: { flex: 1, alignItems: 'center', gap: 6 },
  name: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
  },
  logo: {
    width: 54,
    height: 54,
    marginTop: spacing.lg,
    borderRadius: 27,
    backgroundColor: colors.white,
  },
});
