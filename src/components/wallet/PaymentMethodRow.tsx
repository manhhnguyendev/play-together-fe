import { Image, type ImageSource } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '@/theme';

interface PaymentMethodRowProps {
  image: ImageSource | number;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}

export function PaymentMethodRow({
  image,
  title,
  subtitle,
  onPress,
}: PaymentMethodRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.logoBox}>
        <Image source={image} style={styles.logo} contentFit="contain" />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  logoBox: {
    width: 72,
    height: 52,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 6,
    backgroundColor: colors.surface,
  },
  logo: { width: '100%', height: '100%' },
  body: { flex: 1, gap: 3 },
  title: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
});
