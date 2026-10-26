import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ratingService } from '@/api/services/content';
import { AppBar, Button, useToast } from '@/components/ui';
import { colors, fonts, radius, spacing } from '@/theme';

const OTHER_REASON = 'other';

const REASONS = [
  'Ngôn ngữ đả kích phản cảm',
  'Đánh giá không chính xác',
  'Quảng cáo trái phép',
  'Chứa thông tin cá nhân',
];

export default function ReportCommentScreen() {
  const router = useRouter();
  const toast = useToast();
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
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.reasons}>
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
              style={styles.input}
              maxLength={500}
            />
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Tố cáo"
          onPress={submit}
          loading={reportMutation.isPending}
          disabled={!rateId}
        />
      </View>
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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.reasonRow, pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <Text style={styles.reasonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.md },
  reasons: { gap: spacing.xxs },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  reasonLabel: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  input: {
    marginTop: spacing.xs,
    marginLeft: 30,
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
