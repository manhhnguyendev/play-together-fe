import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { feedbackService } from '@/api/services/content';
import {
  AppBar,
  Button,
  SelectField,
  TextField,
  useToast,
} from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { queryKeys } from '@/lib/queryKeys';
import { colors, radius, spacing } from '@/theme';

const TYPE_OPTIONS = [
  { label: 'Báo cáo lỗi của hệ thống', value: 'SystemError' },
  {
    label: 'Đề xuất tính năng hoặc thêm mới danh mục game',
    value: 'Suggest',
  },
  { label: 'Phản hồi về dịch vụ', value: 'Service' },
];

export default function CreateFeedbackScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle } = useResponsive();
  const [type, setType] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (submitting) return;
    if (!type || !title.trim() || !message.trim()) {
      toast.show('Vui lòng nhập toàn bộ thông tin phản hồi', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await feedbackService.create({
        title: title.trim(),
        message: message.trim(),
        typeOfFeedback: type,
      });
      toast.show('Gửi phản hồi thành công', 'success');
      await queryClient.invalidateQueries({ queryKey: queryKeys.feedbacks });
      router.back();
    } catch {
      toast.show('Gửi phản hồi thất bại', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Tạo phản hồi về hệ thống" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={contentStyle}
          contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.column}>
            <View style={styles.card}>
              <SelectField
                label="Thể loại"
                placeholder="Chọn thể loại phản hồi"
                variant="floating"
                value={type}
                options={TYPE_OPTIONS}
                onChange={setType}
              />

              <TextField
                label="Tiêu đề"
                value={title}
                onChangeText={setTitle}
                maxLength={200}
                variant="floating"
              />

              <TextField
                label="Nội dung phản hồi"
                value={message}
                onChangeText={setMessage}
                placeholder="Mô tả vấn đề bạn gặp phải"
                maxLength={1000}
                multiline
                variant="floating"
                containerStyle={styles.message}
              />
            </View>
          </View>
        </ScrollView>

        <View
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}
        >
          <View style={styles.footerInner}>
            <Button
              label="Tạo phản hồi"
              size="lg"
              loading={submitting}
              onPress={() => void submit()}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { paddingVertical: spacing.sm, paddingBottom: spacing.lg },
  column: { gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  message: { minHeight: 240 },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerInner: {
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
});
