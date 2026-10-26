import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, TextField } from '@/components/ui';
import { colors, fonts, radius, spacing } from '@/theme';

interface CancelOrderDialogProps {
  visible: boolean;
  title: string;
  placeholder?: string;
  loading?: boolean;
  onDismiss: () => void;
  onConfirm: (reason: string) => void;
}

export function CancelOrderDialog({
  visible,
  title,
  placeholder = 'Nhập lý do',
  loading = false,
  onDismiss,
  onConfirm,
}: CancelOrderDialogProps) {
  const [reason, setReason] = useState('');

  const close = () => {
    setReason('');
    onDismiss();
  };

  const confirm = () => {
    const value = reason.trim();
    setReason('');
    onConfirm(value);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <TextField
            value={reason}
            onChangeText={setReason}
            placeholder={placeholder}
            containerStyle={styles.field}
            maxLength={500}
            multiline
          />
          <View style={styles.actions}>
            <Button
              label="Không"
              variant="secondary"
              onPress={close}
              style={styles.action}
              fullWidth={false}
            />
            <Button
              label="Có"
              onPress={confirm}
              loading={loading}
              style={styles.action}
              fullWidth={false}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.text,
  },
  field: { marginTop: spacing.xxs },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  action: { minWidth: 100 },
});
