import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '@/theme';

interface DatePickerFieldProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  error?: string | null;
  minimumYear?: number;
  maximumYear?: number;
}

const pad = (value: number) => value.toString().padStart(2, '0');

const daysInMonth = (month: number, year: number) =>
  new Date(year, month, 0).getDate();

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Chọn ngày',
  error,
  minimumYear,
  maximumYear,
}: DatePickerFieldProps) {
  const today = useMemo(() => new Date(), []);
  const firstYear = minimumYear ?? today.getFullYear() - 100;
  const lastYear = maximumYear ?? today.getFullYear();

  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(1);
  const [month, setMonth] = useState(1);
  const [year, setYear] = useState(lastYear - 18);

  const years = useMemo(
    () =>
      Array.from({ length: lastYear - firstYear + 1 }, (_, index) => lastYear - index),
    [firstYear, lastYear],
  );
  const days = useMemo(
    () => Array.from({ length: daysInMonth(month, year) }, (_, index) => index + 1),
    [month, year],
  );

  const openPicker = () => {
    const base = value ?? new Date(lastYear - 18, 0, 1);
    const clampedYear = Math.min(
      lastYear,
      Math.max(firstYear, base.getFullYear()),
    );
    setYear(clampedYear);
    setMonth(base.getMonth() + 1);
    setDay(Math.min(base.getDate(), daysInMonth(base.getMonth() + 1, clampedYear)));
    setOpen(true);
  };

  const confirm = () => {
    const safeDay = Math.min(day, daysInMonth(month, year));
    onChange(new Date(year, month - 1, safeDay));
    setOpen(false);
  };

  const display = value
    ? `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()}`
    : null;

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={openPicker}
        style={({ pressed }) => [
          styles.field,
          error && styles.fieldError,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.value, !display && styles.placeholder]}>
          {display ?? placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={19} color={colors.textMuted} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <SafeAreaView style={styles.sheet} edges={['bottom']}>
            <View style={styles.sheetHeader}>
              <Pressable hitSlop={10} onPress={() => setOpen(false)}>
                <Text style={styles.cancel}>Huỷ</Text>
              </Pressable>
              <Text style={styles.sheetTitle}>{label ?? 'Chọn ngày'}</Text>
              <Pressable hitSlop={10} onPress={confirm}>
                <Text style={styles.done}>Xong</Text>
              </Pressable>
            </View>

            <View style={styles.columns}>
              <ScrollView
                style={styles.column}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.columnTitle}>Ngày</Text>
                {days.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setDay(item)}
                    style={[styles.cell, item === day && styles.cellActive]}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        item === day && styles.cellTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <ScrollView
                style={styles.column}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.columnTitle}>Tháng</Text>
                {Array.from({ length: 12 }, (_, index) => index + 1).map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setMonth(item)}
                    style={[styles.cell, item === month && styles.cellActive]}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        item === month && styles.cellTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <ScrollView
                style={styles.column}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.columnTitle}>Năm</Text>
                {years.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setYear(item)}
                    style={[styles.cell, item === year && styles.cellActive]}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        item === year && styles.cellTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  field: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  fieldError: { borderColor: colors.danger },
  pressed: { opacity: 0.75 },
  value: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  placeholder: { color: colors.textFaint },
  error: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.danger,
    marginTop: 4,
  },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  cancel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  done: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primaryDark,
  },
  columns: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  column: {
    flex: 1,
    maxHeight: 252,
  },
  columnTitle: {
    textAlign: 'center',
    paddingVertical: spacing.xs,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cell: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xs,
  },
  cellActive: { backgroundColor: colors.primarySoft },
  cellText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  cellTextActive: {
    fontFamily: fonts.semibold,
    color: colors.primaryDark,
  },
});
