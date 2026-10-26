import { StyleSheet, Text, View } from 'react-native';
import { TextField } from '@/components/ui';
import { colors, fonts, spacing } from '@/theme';

interface TimeRangeFieldsProps {
  fromHour: string;
  fromMinute: string;
  toHour: string;
  toMinute: string;
  onChange: (
    part: 'fromHour' | 'fromMinute' | 'toHour' | 'toMinute',
    value: string,
  ) => void;
}

const sanitize = (value: string, max: number): string => {
  const digits = value.replace(/[^0-9]/g, '').slice(0, 2);
  if (!digits) return '';
  return Number(digits) > max ? '' : digits;
};

export function TimeRangeFields({
  fromHour,
  fromMinute,
  toHour,
  toMinute,
  onChange,
}: TimeRangeFieldsProps) {
  return (
    <View style={styles.container}>
      <TimeRow
        label="Từ:"
        hour={fromHour}
        minute={fromMinute}
        onHourChange={(value) => onChange('fromHour', sanitize(value, 23))}
        onMinuteChange={(value) => onChange('fromMinute', sanitize(value, 59))}
      />
      <TimeRow
        label="Đến:"
        hour={toHour}
        minute={toMinute}
        onHourChange={(value) => onChange('toHour', sanitize(value, 23))}
        onMinuteChange={(value) => onChange('toMinute', sanitize(value, 59))}
      />
    </View>
  );
}

function TimeRow({
  label,
  hour,
  minute,
  onHourChange,
  onMinuteChange,
}: {
  label: string;
  hour: string;
  minute: string;
  onHourChange: (value: string) => void;
  onMinuteChange: (value: string) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextField
        value={hour}
        onChangeText={onHourChange}
        keyboardType="number-pad"
        maxLength={2}
        placeholder="00"
        containerStyle={styles.input}
      />
      <Text style={styles.colon}>:</Text>
      <TextField
        value={minute}
        onChangeText={onMinuteChange}
        keyboardType="number-pad"
        maxLength={2}
        placeholder="00"
        containerStyle={styles.input}
      />
      <Text style={styles.unit}>giờ</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
    width: 46,
  },
  input: { flex: 1 },
  colon: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
  },
  unit: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
});
