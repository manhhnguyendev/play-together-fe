import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppRouter } from '@/hooks/useAppRouter';
import { colors, fonts, radius, spacing } from '@/theme';
import { usePressAnimation } from '@/hooks/usePressAnimation';
import { useResponsive } from '@/hooks/useResponsive';

export function HomeAppBar() {
  const router = useAppRouter();
  const { gutter, contentStyle } = useResponsive();
  const press = usePressAnimation(0.99);

  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal: gutter, maxWidth: contentStyle.maxWidth },
      ]}
    >
      <Image
        source={require('../../../assets/images/logo_v2_mark.png')}
        style={styles.logo}
        contentFit="contain"
        accessibilityLabel="Play Together"
      />
      <Animated.View style={[styles.row, press.style]}>
        <Pressable
          accessibilityRole="search"
          accessibilityLabel="Tìm game và người chơi"
          onPress={() => router.push('/search-history')}
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
          style={({ pressed }) => [styles.searchBox, pressed && styles.pressed]}
        >
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <Text style={styles.searchText} numberOfLines={1}>
            Tìm game, người chơi…
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  row: { flex: 1, minWidth: 0 },
  logo: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.plaque,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 5,
  },
  searchBox: {
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  pressed: { backgroundColor: colors.primaryFaint, borderColor: colors.primaryBorder },
  searchText: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
});
