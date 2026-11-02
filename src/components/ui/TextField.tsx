import { Ionicons } from '@expo/vector-icons';
import {
  useEffect,
  useState,
  type ComponentRef,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, control, fonts, hitSlop, radius, spacing } from '@/theme';
import {
  FLOAT_BOX_HEIGHT,
  FLOAT_BAND_STYLE,
  FLOAT_ICON_SLOT,
  FLOAT_ICON_STYLE,
  FLOAT_LABEL_TOP,
  FLOAT_TEXT_LINE,
  FLOAT_TEXT_TOP,
} from './floatingMetrics';

/** Imperative handle of the inner TextInput, for moving focus between fields. */
export type TextFieldHandle = ComponentRef<typeof TextInput>;

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string | null;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  secure?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  hint?: string;
  /**
   * 'outline' keeps the label on its own line above a bordered box.
   * 'floating' tints the box and parks the label inside it, lifting it to the
   * top edge on focus or once there is text — so a short field name does the
   * work a long placeholder used to do, and nothing can be truncated.
   */
  variant?: 'outline' | 'floating';
  /** Lets a screen drive focus, e.g. jumping to the OTP box once the code is sent. */
  inputRef?: Ref<TextFieldHandle>;
  /**
   * A compact action parked inside the box (send/resend OTP). Keeping it inside
   * instead of beside the field lets every box on a screen share one width.
   */
  trailing?: ReactNode;
}

const useNativeDriver = Platform.OS !== 'web';

const ICON_WIDTH = FLOAT_ICON_SLOT;
const EYE_WIDTH = 20;

/**
 * react-native-web leaves the browser's own focus ring on inputs. The type only
 * allows solid/dotted/dashed, so 'none' needs the cast; width 0 is not enough
 * because `outline-style: auto` ignores it.
 */
const NO_FOCUS_RING: TextStyle = { outlineStyle: 'none' as never };

export function TextField({
  label,
  error,
  leftIcon,
  secure = false,
  containerStyle,
  hint,
  multiline,
  variant = 'outline',
  inputRef,
  trailing,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secure);
  const editable = inputProps.editable !== false;
  const floating = variant === 'floating' && !!label;

  const progress = useState(() => new Animated.Value(0))[0];
  const hasText = String(inputProps.value ?? inputProps.defaultValue ?? '') !== '';
  const lifted = focused || hasText;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: lifted ? 1 : 0,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver,
    }).start();
  }, [lifted, progress]);

  const restingLeft = spacing.sm + (leftIcon ? ICON_WIDTH + spacing.xs : 0);
  const borderColor = error
    ? colors.danger
    : focused
      ? colors.primaryAction
      : colors.border;
  const iconColor = error
    ? colors.danger
    : focused
      ? colors.primaryAction
      : floating
        ? colors.textMuted
        : colors.textFaint;

  const input = (extraStyle: StyleProp<TextInputProps['style']>, rest?: Partial<TextInputProps>) => (
    <TextInput
      {...inputProps}
      {...rest}
      ref={inputRef}
      multiline={multiline}
      editable={editable}
      secureTextEntry={hidden}
      accessibilityLabel={label ?? inputProps.placeholder}
      accessibilityState={{ disabled: !editable }}
      onFocus={(event) => {
        setFocused(true);
        inputProps.onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        inputProps.onBlur?.(event);
      }}
      placeholderTextColor={colors.textFaint}
      style={[extraStyle, Platform.OS === 'web' && NO_FOCUS_RING]}
    />
  );

  const messages = error ? (
    <View style={styles.messageRow}>
      <Ionicons name="alert-circle" size={13} color={colors.danger} />
      <Text style={styles.error}>{error}</Text>
    </View>
  ) : hint ? (
    <Text style={styles.hint}>{hint}</Text>
  ) : null;

  const eyeToggle = secure ? (
    <Pressable
      hitSlop={hitSlop.md}
      accessibilityRole="button"
      accessibilityLabel={hidden ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'}
      onPress={() => setHidden((value) => !value)}
    >
      <Ionicons
        name={hidden ? 'eye-off-outline' : 'eye-outline'}
        size={EYE_WIDTH}
        color={colors.textMuted}
        style={floating ? styles.floatingIcon : undefined}
      />
    </Pressable>
  ) : null;

  const boxState = error
    ? styles.floatingBoxError
    : focused
      ? styles.floatingBoxFocused
      : styles.floatingBoxIdle;
  const liftedLabelColor = error
    ? colors.danger
    : focused
      ? colors.primaryAction
      : colors.textSecondary;

  if (floating) {
    if (multiline) {
      return (
        <View style={containerStyle}>
          <View
            style={[styles.floatingAreaBox, boxState, !editable && styles.fieldDisabled]}
          >
            <Text
              pointerEvents="none"
              numberOfLines={1}
              style={[styles.liftedLabel, { left: restingLeft, color: liftedLabelColor }]}
            >
              {label}
            </Text>
            {input(styles.floatingMultilineInput)}
          </View>
          {messages}
        </View>
      );
    }

    return (
      <View style={containerStyle}>
        <View
          style={[styles.floatingBox, boxState, !editable && styles.fieldDisabled]}
        >
          {/*
            Both labels are absolutely positioned, so they stretch across the
            whole box including the trailing action, and they are laid out first
            so the field, the eye and the action all end up above them. They
            carry pointerEvents="none", but that is the only thing standing
            between the resting label and a tap meant for 'Gửi mã' — and the
            platforms do not agree about how a Text honours it. Nothing in the
            box is allowed to rely on that answer.
          */}
          <Animated.Text
            pointerEvents="none"
            numberOfLines={1}
            style={[
              styles.restingLabel,
              {
                left: restingLeft,
                opacity: progress.interpolate({
                  inputRange: [0, 0.55, 1],
                  outputRange: [1, 0, 0],
                }),
              },
            ]}
          >
            {label}
          </Animated.Text>
          <Animated.Text
            pointerEvents="none"
            numberOfLines={1}
            style={[
              styles.liftedLabel,
              {
                // Line the lifted label up with the typed text, not the box
                // edge, or it lands on top of the leading icon and reads lopsided.
                left: restingLeft,
                color: liftedLabelColor,
                opacity: progress.interpolate({ inputRange: [0.45, 1], outputRange: [0, 1] }),
                transform: [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [4, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {label}
          </Animated.Text>

          {leftIcon ? (
            <Ionicons
              name={leftIcon}
              size={ICON_WIDTH}
              color={iconColor}
              style={styles.floatingLeadingIcon}
            />
          ) : null}
          {input(styles.floatingInput, {
            // The label does the placeholder's job while the box is idle; once
            // it lifts there is room for a format hint (e.g. "00:00").
            placeholder: lifted ? inputProps.placeholder : undefined,
          })}
          {eyeToggle}
          {trailing ? <View style={styles.floatingTrailing}>{trailing}</View> : null}
        </View>
        {messages}
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {label ? (
        <Text style={styles.label} accessibilityRole="text">
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          { borderColor, borderWidth: focused || error ? 1.5 : 1 },
          focused && !error && styles.fieldFocused,
          !editable && styles.fieldDisabled,
          multiline && styles.multilineField,
        ]}
      >
        {leftIcon ? (
          <Ionicons name={leftIcon} size={ICON_WIDTH} color={iconColor} />
        ) : null}
        {input([styles.input, multiline && styles.multilineInput])}
        {eyeToggle}
      </View>
      {messages}
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
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  fieldFocused: { backgroundColor: colors.primaryFaint },
  fieldDisabled: { backgroundColor: colors.surfaceMuted, opacity: 0.7 },
  multilineField: {
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    minHeight: 118,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    paddingVertical: 12,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 92,
  },
  floatingBox: {
    height: FLOAT_BOX_HEIGHT,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  floatingBoxIdle: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  floatingBoxFocused: {
    backgroundColor: colors.primaryFaint,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
  },
  floatingBoxError: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  floatingInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    // Zero rather than unset: the native field's own default inset is another
    // number the platforms disagree about, and this edge has to land exactly on
    // `restingLeft`, where both labels sit.
    paddingLeft: 0,
    paddingTop: FLOAT_TEXT_TOP,
    paddingBottom: FLOAT_BOX_HEIGHT - FLOAT_TEXT_TOP - FLOAT_TEXT_LINE,
  },
  restingLabel: {
    position: 'absolute',
    top: FLOAT_TEXT_TOP,
    right: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  },
  /**
   * The leading icon and the eye toggle sit on the value band, which is also the
   * middle of the box (see FLOAT_BAND_STYLE).
   */
  floatingIcon: FLOAT_BAND_STYLE,
  /**
   * The leading icon reserves exactly FLOAT_ICON_SLOT so the value text after it
   * starts on `restingLeft` on every platform; see FLOAT_ICON_STYLE.
   */
  floatingLeadingIcon: FLOAT_ICON_STYLE,
  // The box aligns its children to the value band, so the action inside it has
  // to pull itself back to the vertical middle.
  floatingTrailing: { alignSelf: 'center' },
  floatingAreaBox: {
    flex: 1,
    borderRadius: radius.md,
    minHeight: 118,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  floatingMultilineInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    paddingTop: 28,
    minHeight: 76,
    textAlignVertical: 'top',
  },
  liftedLabel: {
    position: 'absolute',
    top: FLOAT_LABEL_TOP,
    left: spacing.sm,
    right: spacing.md,
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.3,
    color: colors.textSecondary,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xxs,
  },
  error: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: colors.danger,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textFaint,
    marginTop: spacing.xxs,
  },
});
