import { StyleSheet, View } from 'react-native';
import { TextField } from '@/components/ui';
import { spacing } from '@/theme';

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

type Range = 'from' | 'to';

/**
 * One box per end of the range instead of four: two digits for the hour before
 * the colon would leave no room for a label, and the parents still own the
 * separate hour/minute strings.
 *
 * The colon only appears once the minute has a digit — otherwise "09" would
 * render as "09:" and backspacing the separator would just restore it.
 */
const display = (hour: string, minute: string) =>
  minute ? `${hour}:${minute}` : hour;

export function TimeRangeFields({
  fromHour,
  fromMinute,
  toHour,
  toMinute,
  onChange,
}: TimeRangeFieldsProps) {
  const emit = (range: Range, value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    const hour = digits.slice(0, 2);
    const minute = digits.length > 2 ? digits.slice(2, 4) : '';
    if (hour.length === 2 && Number(hour) > 23) return;
    if (minute.length === 2 && Number(minute) > 59) return;
    onChange(`${range}Hour`, hour);
    onChange(`${range}Minute`, minute);
  };

  return (
    <View style={styles.container}>
      <TextField
        variant="floating"
        label="Từ"
        placeholder="00:00"
        keyboardType="number-pad"
        maxLength={5}
        value={display(fromHour, fromMinute)}
        onChangeText={(value) => emit('from', value)}
      />
      <TextField
        variant="floating"
        label="Đến"
        placeholder="00:00"
        keyboardType="number-pad"
        maxLength={5}
        value={display(toHour, toMinute)}
        onChangeText={(value) => emit('to', value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
});
