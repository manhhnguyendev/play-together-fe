import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/theme';
import { initialsOf } from '@/lib/format';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  borderWidth?: number;
  borderColor?: string;
  /** Square-ish tile instead of a circle, for player cards. */
  squared?: boolean;
}

export function Avatar({
  uri,
  name,
  size = 48,
  borderWidth = 0,
  borderColor = colors.surface,
  squared = false,
}: AvatarProps) {
  return (
    <View
      accessibilityLabel={name ? `Ảnh đại diện của ${name}` : 'Ảnh đại diện'}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: squared ? size * 0.28 : size / 2,
          borderWidth,
          borderColor,
        },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.image} contentFit="cover" />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.34 }]}>
          {initialsOf(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  initials: {
    fontFamily: fonts.bold,
    color: colors.primaryInk,
  },
});
