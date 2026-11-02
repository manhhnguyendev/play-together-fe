import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, control, fonts, hitSlop, radius, shadow, spacing } from '@/theme';
import {
  FLOAT_BOX_HEIGHT,
  FLOAT_ICON_SLOT,
  FLOAT_BAND_STYLE,
  FLOAT_LABEL_TOP,
  FLOAT_TEXT_LINE,
  FLOAT_TEXT_TOP,
} from './floatingMetrics';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps {
  label?: string;
  placeholder: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string | null;
  /** 'floating' matches TextField's floating variant: filled box, label inside. */
  variant?: 'outline' | 'floating';
}

export function SelectField({
  label,
  placeholder,
  value,
  options,
  onChange,
  error,
  variant = 'outline',
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const floating = variant === 'floating';

  const selectedLabel = useMemo(
    () => options.find((option) => option.value === value)?.label,
    [options, value],
  );

  return (
    <View>
      {label && !floating ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        accessibilityHint="Mở danh sách lựa chọn"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          floating ? styles.floatingBox : styles.field,
          floating && error ? styles.floatingBoxError : undefined,
          {
            borderColor: error
              ? colors.danger
              : pressed && !floating
                ? colors.primaryAction
                : colors.border,
          },
          pressed && styles.pressed,
        ]}
      >
        {floating ? (
          <>
            <Text
              style={[styles.floatingValue, !selectedLabel && styles.floatingValueHint]}
              numberOfLines={1}
            >
              {selectedLabel ?? placeholder}
            </Text>
            <Ionicons
              name="chevron-down"
              size={FLOAT_ICON_SLOT}
              color={selectedLabel ? colors.primaryAction : colors.textFaint}
              style={styles.floatingChevron}
            />
            {selectedLabel ? (
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
            <Text
              style={[styles.value, !selectedLabel && styles.placeholder]}
              numberOfLines={1}
            >
              {selectedLabel ?? placeholder}
            </Text>
            <Ionicons
              name="chevron-down"
              size={18}
              color={selectedLabel ? colors.primaryAction : colors.textMuted}
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
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label ?? placeholder}</Text>
              <Pressable
                hitSlop={hitSlop.md}
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                onPress={() => setOpen(false)}
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              initialNumToRender={20}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <Pressable
                    accessibilityRole="menuitem"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      active && styles.optionActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[styles.optionLabel, active && styles.optionLabelActive]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    {active ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={colors.primaryAction}
                      />
                    ) : null}
                  </Pressable>
                );
              }}
            />
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
  },
  field: {
    minHeight: control.inputHeight,
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pressed: { opacity: 0.75 },
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
  floatingBoxError: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1.5,
  },
  floatingChevron: FLOAT_BAND_STYLE,
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
    maxHeight: '76%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadow.sheet,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.bold,
    fontSize: 17,
    lineHeight: 23,
    color: colors.text,
    letterSpacing: -0.2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { paddingBottom: spacing.lg },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
    paddingVertical: spacing.sm,
  },
  optionActive: { backgroundColor: colors.primaryFaint },
  optionLabel: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  optionLabelActive: {
    fontFamily: fonts.semibold,
    color: colors.primaryInk,
  },
});
