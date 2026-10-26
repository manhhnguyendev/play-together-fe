import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { feedbackService } from '@/api/services/content';
import {
  AppBar,
  Button,
  SelectField,
  TextField,
  useToast,
} from '@/components/ui';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, spacing } from '@/theme';

const TYPE_OPTIONS = [
  { label: 'Báo cáo lỗi của hệ thống', value: 'SystemError' },
  {
    label: 'Đề xuất tính năng hoặc thêm mới danh mục game',
    value: 'Suggest',
  },
  { label: 'Phản hồi về dịch vụ', value: 'Service' },
];

export default function CreateFeedbackScreen() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <AppBar title="Tạo phản hồi về hệ thống" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <View>
              <Text style={styles.label}>Chọn thể loại: </Text>
              <SelectField
                placeholder="Thể loại phản hồi"
                value={type}
                options={TYPE_OPTIONS}
                onChange={setType}
              />
            </View>

            <TextField
              label="Nhập tiêu đề phản hồi"
              value={title}
              onChangeText={setTitle}
              placeholder="Nhập vào tiêu đề phản hồi của bạn"
              maxLength={200}
            />

            <TextField
              label="Nhập phản hồi của bạn"
              value={message}
              onChangeText={setMessage}
              placeholder="Nhập vào phản hồi của bạn"
              maxLength={1000}
              multiline
              containerStyle={styles.message}
            />
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button
            label="Tạo phản hồi"
            size="lg"
            loading={submitting}
            onPress={() => void submit()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  scroll: { padding: spacing.md },
  form: { gap: spacing.md },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  message: { minHeight: 240 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
