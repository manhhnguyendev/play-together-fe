import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { OrderModel } from '@/api/types';
import {
  isClosedOrder,
  orderHirerFinalPrice,
  orderStatusColor,
  orderStatusLabel,
} from '@/features/orders/status';
import {
  formatDate,
  formatTimeAmPm,
  formatVnd,
  isEmptyDate,
} from '@/lib/format';
import { colors, fonts, spacing } from '@/theme';

interface OrderHistoryCardProps {
  order: OrderModel;
  currentUserId: string;
  onPress: () => void;
  onReorder?: () => void;
}

export function OrderHistoryCard({
  order,
  currentUserId,
  onPress,
  onReorder,
}: OrderHistoryCardProps) {
  const isHirer = order.userId === currentUserId;
  const otherParty = isHirer ? order.toUser : order.user;
  const timeSource = isEmptyDate(order.timeStart)
    ? order.processExpired
    : order.timeStart;
  const canReorder =
    order.toUserId !== currentUserId &&
    !['Processing', 'Starting', 'Finish'].includes(order.status);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}
    >
      <View style={styles.topRow}>
        <View style={styles.nameBlock}>
          <Text style={styles.name} numberOfLines={1}>
            {otherParty?.name ?? 'Người chơi'}
          </Text>
          <Text style={styles.date}>
            {formatDate(timeSource)}, {formatTimeAmPm(timeSource)}
          </Text>
        </View>
        {!isClosedOrder(order.status) ? (
          <Text style={styles.amount}>
            {isHirer ? '− ' : '+ '}
            {formatVnd(
              isHirer ? orderHirerFinalPrice(order) : order.finalPrices,
            )}
          </Text>
        ) : null}
      </View>

      <View style={styles.bottomRow}>
        {canReorder && onReorder ? (
          <Pressable
            hitSlop={8}
            onPress={onReorder}
            style={({ pressed }) => [
              styles.reorder,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.reorderText}>Đặt lại </Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </Pressable>
        ) : (
          <View />
        )}
        <Text style={[styles.status, { color: orderStatusColor(order.status) }]}>
          {orderStatusLabel(order.status)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  nameBlock: { flex: 1, gap: 4 },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.text,
  },
  date: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  amount: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reorder: { flexDirection: 'row', alignItems: 'center' },
  reorderText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primary,
  },
  status: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
});
