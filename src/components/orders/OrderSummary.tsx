import { StyleSheet, Text, View } from 'react-native';
import { formatVnd } from '@/lib/format';
import { colors, fonts, radius, spacing } from '@/theme';

interface OrderSummaryProps {
  duration: number;
  priceLabel?: string;
  price: number;
  endLabel?: string;
  endValue?: string;
  games?: string[];
  gamesLabel?: string;
  message?: string;
  reason?: string;
  children?: React.ReactNode;
}

export function OrderSummary({
  duration,
  priceLabel = 'Tổng chi phí:',
  price,
  endLabel,
  endValue,
  games = [],
  gamesLabel = 'Tựa game đã chọn:',
  message,
  reason,
  children,
}: OrderSummaryProps) {
  return (
    <View style={styles.container}>
      <View style={styles.rows}>
        <Row label="Thời lượng thuê:" value={`${duration} giờ`} />
        <Row label={priceLabel} value={formatVnd(price)} />
        {endLabel && endValue ? <Row label={endLabel} value={endValue} /> : null}
      </View>

      {games.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.blockLabel}>{gamesLabel}</Text>
          {games.map((name, index) => (
            <Text key={`${name}-${index}`} style={styles.bullet}>
              • {name}
            </Text>
          ))}
        </View>
      ) : null}

      {message !== undefined ? (
        <View style={styles.block}>
          <Text style={styles.blockLabel}>Lời nhắn:</Text>
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{message || '—'}</Text>
          </View>
        </View>
      ) : null}

      {reason ? (
        <View style={styles.block}>
          <Text style={styles.blockLabel}>Lý do kết thúc sớm:</Text>
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{reason}</Text>
          </View>
        </View>
      ) : null}

      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  rows: { gap: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: 7,
  },
  rowLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  rowValue: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
    textAlign: 'right',
  },
  block: {
    paddingVertical: spacing.xs,
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: spacing.xxs,
  },
  blockLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  bullet: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    paddingLeft: spacing.xs,
  },
  messageBox: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
  },
  messageText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
});
