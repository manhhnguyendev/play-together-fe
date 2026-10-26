import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '@/theme';

interface RatingStarsProps {
  value: number;
  size?: number;
  editable?: boolean;
  onChange?: (value: number) => void;
  showValue?: boolean;
}

export function RatingStars({
  value,
  size = 16,
  editable = false,
  onChange,
  showValue = false,
}: RatingStarsProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star;
        const icon = filled ? 'star' : 'star-outline';
        return editable ? (
          <Pressable
            key={star}
            hitSlop={6}
            onPress={() => onChange?.(star)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Ionicons name={icon} size={size} color={colors.gold} />
          </Pressable>
        ) : (
          <Ionicons key={star} name={icon} size={size} color={colors.gold} />
        );
      })}
      {showValue ? (
        <Text style={styles.value}>{value.toFixed(1)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  pressed: { opacity: 0.6 },
  value: {
    marginLeft: spacing.xs,
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textMuted,
  },
});
