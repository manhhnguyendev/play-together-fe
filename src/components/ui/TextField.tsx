import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors, fonts, radius, spacing } from '@/theme';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string | null;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  secure?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  hint?: string;
}

export function TextField({
  label,
  error,
  leftIcon,
  secure = false,
  containerStyle,
  hint,
  multiline,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secure);

  const borderColor = error
    ? colors.danger
    : focused
      ? colors.primary
      : colors.border;

  return (
    <View style={containerStyle}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          { borderColor },
          multiline && styles.multilineField,
        ]}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={18}
            color={focused ? colors.primary : colors.textFaint}
          />
        ) : null}
        <TextInput
          {...inputProps}
          multiline={multiline}
          secureTextEntry={hidden}
          onFocus={(event) => {
            setFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            inputProps.onBlur?.(event);
          }}
          placeholderTextColor={colors.textFaint}
          style={[styles.input, multiline && styles.multilineInput]}
        />
        {secure ? (
          <Pressable hitSlop={8} onPress={() => setHidden((value) => !value)}>
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
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
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  multilineField: {
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    minHeight: 118,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 10,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 92,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.danger,
    marginTop: 4,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textFaint,
    marginTop: 4,
  },
});
