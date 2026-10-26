import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '@/theme';

interface AppBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  showBack?: boolean;
  transparent?: boolean;
}

export function AppBar({
  title,
  subtitle,
  onBack,
  right,
  showBack = true,
  transparent = false,
}: AppBarProps) {
  const router = useRouter();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: transparent ? 'transparent' : colors.surface },
      ]}
    >
      {showBack ? (
        <Pressable
          hitSlop={10}
          onPress={onBack ?? (() => router.back())}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
      ) : (
        <View style={styles.back} />
      )}

      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.55 },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  right: { width: 44, alignItems: 'flex-end', justifyContent: 'center' },
});
