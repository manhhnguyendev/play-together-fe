import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ratingService } from '@/api/services/content';
import { AppBar, Button, useToast } from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, control, fonts, hitSlop, radius, spacing, touchTarget } from '@/theme';

const OTHER_REASON = 'other';

const REASONS = [
  'Ngôn ngữ đả kích phản cảm',
  'Đánh giá không chính xác',
  'Quảng cáo trái phép',
  'Chứa thông tin cá nhân',
];

export default function ReportCommentScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle } = useResponsive();
  const params = useLocalSearchParams<{ rateId?: string; name?: string }>();
  const rateId = typeof params.rateId === 'string' ? params.rateId : '';
  const [selected, setSelected] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');

  const reportMutation = useMutation({
    mutationFn: (reason: string) =>
      ratingService.reportComment(rateId, { reason }),
    onSuccess: () => {
      toast.show('Báo cáo thành công', 'success');
      router.back();
    },
    onError: () => toast.show('Báo cáo thất bại', 'error'),
  });

  const submit = () => {
    const reason =
      selected === OTHER_REASON ? customReason.trim() : (selected ?? '');
    if (!reason) {
      toast.show('Vui lòng nhập lý do!', 'error');
      return;
    }
    reportMutation.mutate(reason);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Báo cáo bình luận này" />
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
          <View style={styles.card} accessibilityRole="radiogroup">
            {REASONS.map((reason) => (
              <ReasonRow
                key={reason}
                label={reason}
                selected={selected === reason}
                onPress={() => setSelected(reason)}
              />
            ))}
            <ReasonRow
              label="Lý do khác"
              selected={selected === OTHER_REASON}
              onPress={() => setSelected(OTHER_REASON)}
            />
            {selected === OTHER_REASON ? (
              <TextInput
                value={customReason}
                onChangeText={setCustomReason}
                placeholder="Nhập lý do của bạn"
                placeholderTextColor={colors.textFaint}
                accessibilityLabel="Nhập lý do của bạn"
                style={styles.input}
                maxLength={500}
              />
            ) : null}
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + spacing.sm },
          ]}
        >
          <View style={styles.footerInner}>
            <Button
              label="Tố cáo"
              size="lg"
              onPress={submit}
              loading={reportMutation.isPending}
              disabled={!rateId}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ReasonRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { type } = useResponsive();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      hitSlop={hitSlop.sm}
      onPress={onPress}
      style={({ pressed }) => [
        styles.reasonRow,
        selected && styles.reasonRowSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <Text style={[styles.reasonLabel, type.body]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    paddingVertical: spacing.sm,
    paddingBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTarget,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  reasonRowSelected: { backgroundColor: colors.primaryFaint },
  pressed: { opacity: 0.8 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primaryAction },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryAction,
  },
  reasonLabel: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
  },
  input: {
    minHeight: control.inputHeight,
    marginTop: spacing.xs,
    marginLeft: 30,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
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
