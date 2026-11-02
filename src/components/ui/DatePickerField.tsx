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
import { colors, control, fonts, hitSlop, radius, spacing } from '@/theme';
import {
  FLOAT_BOX_HEIGHT,
  FLOAT_ICON_SLOT,
  FLOAT_BAND_STYLE,
  FLOAT_LABEL_TOP,
  FLOAT_TEXT_LINE,
  FLOAT_TEXT_TOP,
} from './floatingMetrics';

interface DatePickerFieldProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  error?: string | null;
  minimumYear?: number;
  maximumYear?: number;
  /** 'floating' matches TextField's floating variant: filled box, label inside. */
  variant?: 'outline' | 'floating';
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
  variant = 'outline',
}: DatePickerFieldProps) {
  const today = useMemo(() => new Date(), []);
  const floating = variant === 'floating';
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
      {label && !floating ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: chọn ngày` : 'Chọn ngày'}
        onPress={openPicker}
        style={({ pressed }) => [
          floating ? styles.floatingBox : styles.field,
          error && !floating && styles.fieldError,
          error && floating && styles.floatingBoxError,
          pressed && styles.pressed,
        ]}
      >
        {floating ? (
          <>
            <Text
              style={[styles.floatingValue, !display && styles.floatingValueHint]}
              numberOfLines={1}
            >
              {display ?? placeholder}
            </Text>
            <Ionicons
              name="calendar-outline"
              size={FLOAT_ICON_SLOT}
              color={display ? colors.primaryAction : colors.textFaint}
              style={styles.floatingIcon}
            />
            {display ? (
              <Text
                pointerEvents="none"
                style={[styles.floatingLabel, error && styles.floatingLabelError]}
                numberOfLines={1}
              >
                {label}
              </Text>
            ) : null}
          </>
        ) : (
          <>
            <Text style={[styles.value, !display && styles.placeholder]}>
              {display ?? placeholder}
            </Text>
            <Ionicons
              name="calendar-outline"
              size={FLOAT_ICON_SLOT}
              color={colors.textMuted}
            />
          </>
        )}
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng"
            style={styles.backdrop}
            onPress={() => setOpen(false)}
          />
          <SafeAreaView style={styles.sheet} edges={['bottom']}>
            <View style={styles.sheetHeader}>
              <Pressable
                hitSlop={hitSlop.md}
                accessibilityRole="button"
                accessibilityLabel="Huỷ chọn ngày"
                onPress={() => setOpen(false)}
              >
                <Text style={styles.cancel}>Huỷ</Text>
              </Pressable>
              <Text style={styles.sheetTitle}>{label ?? 'Chọn ngày'}</Text>
              <Pressable
                hitSlop={hitSlop.md}
                accessibilityRole="button"
                accessibilityLabel="Xác nhận ngày đã chọn"
                onPress={confirm}
              >
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
                    accessibilityRole="button"
                    accessibilityLabel={`Ngày ${item}`}
                    accessibilityState={{ selected: item === day }}
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
                    accessibilityRole="button"
                    accessibilityLabel={`Tháng ${item}`}
                    accessibilityState={{ selected: item === month }}
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
                    accessibilityRole="button"
                    accessibilityLabel={`Năm ${item}`}
                    accessibilityState={{ selected: item === year }}
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
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginBottom: spacing.xxs + 2,
    letterSpacing: 0.2,
  },
  field: {
    minHeight: control.inputHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  fieldError: { borderColor: colors.danger },
  floatingBox: {
    height: FLOAT_BOX_HEIGHT,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  floatingBoxError: {
    borderColor: colors.danger,
    borderWidth: 1.5,
    backgroundColor: colors.dangerSoft,
  },
  floatingLabel: {
    position: 'absolute',
    top: FLOAT_LABEL_TOP,
    left: spacing.sm,
    right: spacing.md,
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.3,
    color: colors.primaryAction,
  },
  floatingLabelError: { color: colors.danger },
  floatingValue: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    paddingTop: FLOAT_TEXT_TOP,
    paddingBottom: FLOAT_BOX_HEIGHT - FLOAT_TEXT_TOP - FLOAT_TEXT_LINE,
  },
  floatingValueHint: { color: colors.textMuted },
  floatingIcon: FLOAT_BAND_STYLE,
  pressed: { opacity: 0.75 },
  value: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  placeholder: { color: colors.textFaint },
  error: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: colors.danger,
    marginTop: spacing.xxs,
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
    color: colors.primaryAction,
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
    color: colors.primaryInk,
  },
});
