import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, hitSlop, spacing } from '@/theme';

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
    <View
      style={styles.row}
      accessibilityLabel={`${value.toFixed(1)} trên 5 sao`}
      accessibilityRole={editable ? 'adjustable' : 'text'}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star;
        const icon = filled ? 'star' : 'star-outline';
        const color = filled ? colors.gold : colors.primaryBorder;
        return editable ? (
          <Pressable
            key={star}
            hitSlop={hitSlop.sm}
            accessibilityRole="button"
            accessibilityLabel={`Đánh giá ${star} sao`}
            accessibilityState={{ selected: filled }}
            onPress={() => onChange?.(star)}
            style={({ pressed }) => [styles.starButton, pressed && styles.pressed]}
          >
            <Ionicons name={icon} size={size} color={color} />
          </Pressable>
        ) : (
          <Ionicons key={star} name={icon} size={size} color={color} />
        );
      })}
      {showValue ? <Text style={styles.value}>{value.toFixed(1)}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  starButton: { alignItems: 'center', justifyContent: 'center', minWidth: 28, minHeight: 28 },
  pressed: { opacity: 0.6, transform: [{ scale: 0.92 }] },
  value: {
    marginLeft: spacing.xs,
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
});
