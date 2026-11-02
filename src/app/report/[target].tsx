import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ratingService, reportService } from '@/api/services/content';
import { orderService } from '@/api/services/orders';
import {
  AppBar,
  Avatar,
  Button,
  ErrorView,
  LoadingView,
  TextField,
  useToast,
} from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { queryKeys } from '@/lib/queryKeys';
import { MAX_MESSAGE_LENGTH } from '@/lib/validators';
import { useAuthStore } from '@/store/auth';
import { colors, hitSlop, radius, spacing, touchTarget } from '@/theme';

const OTHER_REASON = 'other';

/**
 * What a moderator can actually act on. Free text used to be the only option,
 * so every report had to be read before it could be triaged.
 */
const ORDER_REASONS = [
  'Không vào phiên đã hẹn',
  'Bỏ giữa phiên',
  'Lời lẽ xúc phạm, thái độ không phù hợp',
  'Yêu cầu thanh toán ngoài ứng dụng',
  'Nội dung chơi không đúng như đã thoả thuận',
];

const RATING_REASONS = [
  'Ngôn ngữ đả kích phản cảm',
  'Đánh giá không chính xác',
  'Quảng cáo trái phép',
  'Chứa thông tin cá nhân',
];

export default function ReportScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle, isSmall, type } = useResponsive();
  const params = useLocalSearchParams<{
    target?: string;
    kind?: string;
    name?: string;
    avatar?: string;
  }>();
  const targetId = typeof params.target === 'string' ? params.target : '';
  const kind = params.kind === 'rating' ? 'rating' : 'order';
  const authorName = typeof params.name === 'string' ? params.name : '';
  const authorAvatar = typeof params.avatar === 'string' ? params.avatar : undefined;
  const currentUser = useAuthStore((state) => state.user);
  const [selected, setSelected] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');

  const reasons = kind === 'order' ? ORDER_REASONS : RATING_REASONS;

  const orderQuery = useQuery({
    queryKey: queryKeys.order(targetId),
    enabled: kind === 'order' && Boolean(targetId),
    queryFn: async () => (await orderService.getById(targetId)).content,
  });

  const reportMutation = useMutation({
    mutationFn: (reason: string) =>
      kind === 'order'
        ? reportService.create(targetId, { reportMessage: reason })
        : ratingService.reportComment(targetId, { reason }),
    onSuccess: () => {
      toast.show(
        kind === 'order' ? 'Tố cáo thành công!' : 'Báo cáo thành công',
        'success',
      );
      // The order flow is finished here, so it must not stay on the back stack;
      // reporting a comment is a detour out of the ratings list.
      if (kind === 'order') router.replace('/(tabs)/history');
      else router.back();
    },
    onError: (error) =>
      toast.show(
        error instanceof Error && error.message
          ? error.message
          : 'Không thể gửi báo cáo.',
        'error',
      ),
  });

  if (!targetId || (kind === 'order' && orderQuery.isError)) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Tố cáo" />
        <ErrorView onRetry={() => orderQuery.refetch()} />
      </SafeAreaView>
    );
  }

  if (kind === 'order' && (orderQuery.isLoading || !orderQuery.data)) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Tố cáo" />
        <LoadingView />
      </SafeAreaView>
    );
  }

  const order = orderQuery.data;
  const otherParty =
    order?.user?.id === currentUser?.id ? order?.toUser : order?.user;

  const submit = () => {
    const reason =
      selected === OTHER_REASON ? customReason.trim() : (selected ?? '');
    if (!reason) {
      toast.show('Vui lòng chọn lý do!', 'error');
      return;
    }
    reportMutation.mutate(reason);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title={kind === 'order' ? 'Tố cáo' : 'Báo cáo đánh giá'} />
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
            {kind === 'order' ? (
              <View style={styles.card}>
                <View style={styles.header}>
                  <Avatar
                    uri={otherParty?.avatar}
                    name={otherParty?.name}
                    size={isSmall ? 120 : 150}
                  />
                  <Text style={[styles.name, type.title2]} numberOfLines={1}>
                    {otherParty?.name ?? 'Người chơi'}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.authorCard}>
                <Avatar uri={authorAvatar} name={authorName} size={44} />
                <Text style={[styles.authorName, type.body]} numberOfLines={1}>
                  {authorName || 'Người đánh giá'}
                </Text>
              </View>
            )}

            <View style={styles.card} accessibilityRole="radiogroup">
              {reasons.map((reason) => (
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
                <TextField
                  variant="floating"
                  label="Lý do"
                  value={customReason}
                  onChangeText={setCustomReason}
                  containerStyle={styles.customReasonField}
                  multiline
                  maxLength={MAX_MESSAGE_LENGTH}
                />
              ) : null}
            </View>
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
              label="Gửi"
              size="lg"
              onPress={submit}
              loading={reportMutation.isPending}
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
  column: { gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  authorName: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    textAlign: 'center',
    flexShrink: 1,
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
  /**
   * No horizontal margin: the box then spans exactly the width of a reason row,
   * so its edges sit on the same two lines as the tinted "Lý do khác" band.
   */
  customReasonField: {
    marginTop: spacing.xxs,
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
