import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '@/theme';

export function HomeAppBar() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/images/play_together_logo_no_text.png')}
        style={styles.logo}
        contentFit="contain"
      />
      <Pressable
        onPress={() => router.push('/search-history')}
        style={({ pressed }) => [styles.searchBox, pressed && styles.pressed]}
      >
        <Ionicons name="search" size={19} color={colors.textMuted} />
        <Text style={styles.searchText}>Tìm kiếm</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.white,
  },
  searchBox: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  pressed: { opacity: 0.7 },
  searchText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
});
