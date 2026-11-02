import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { feedbackService } from '@/api/services/content';
import { AppBar, ErrorView, LoadingView } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { queryKeys } from '@/lib/queryKeys';
import { colors, radius, spacing, touchTarget } from '@/theme';

const TYPE_LABELS: Record<string, string> = {
  Suggest: 'Đề xuất tính năng hoặc thêm mới danh mục game',
  SystemError: 'Báo cáo lỗi của hệ thống',
  Service: 'Phản hồi về dịch vụ',
};

const statusOf = (value: number) => {
  if (value === 1)
    return { label: 'Đã duyệt', color: colors.success, background: colors.successSoft };
  if (value === 0)
    return { label: 'Bị từ chối', color: colors.danger, background: colors.dangerSoft };
  return {
    label: 'Chờ xét duyệt',
    color: colors.warning,
    background: colors.warningSoft,
  };
};

export default function FeedbackDetailScreen() {
  const params = useLocalSearchParams<{ feedbackId?: string }>();
  const { gutter, contentStyle, type } = useResponsive();
  const feedbackId =
    typeof params.feedbackId === 'string' ? params.feedbackId : '';

  const detailQuery = useQuery({
    queryKey: queryKeys.feedbackDetail(feedbackId),
    enabled: Boolean(feedbackId),
    queryFn: async () => (await feedbackService.getDetail(feedbackId)).content,
  });

  const detail = detailQuery.data;
  const status = statusOf(detail?.isApprove ?? 2);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Chi tiết phản hồi" />
      {detailQuery.isLoading ? (
        <LoadingView />
      ) : detailQuery.isError || !detail ? (
        <ErrorView onRetry={() => detailQuery.refetch()} />
      ) : (
        <ScrollView
          style={contentStyle}
          contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.column}>
            <View style={styles.statusWrap}>
              <View
                style={[styles.statusPill, { backgroundColor: status.background }]}
                accessibilityRole="text"
                accessibilityLabel={`Trạng thái: ${status.label}`}
              >
                <Text style={[styles.status, type.bodyMedium, { color: status.color }]}>
                  {status.label}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={[styles.label, type.bodySmall]} accessibilityRole="text">
                Thể loại:{' '}
              </Text>
              <View style={styles.boxSmall}>
                <Text style={[styles.value, type.body]}>
                  {TYPE_LABELS[detail.typeOfFeedback] ?? 'Lỗi gửi'}
                </Text>
              </View>

              <Text style={[styles.label, type.bodySmall]} accessibilityRole="text">
                Tiêu đề:{' '}
              </Text>
              <View style={styles.boxSmall}>
                <Text style={[styles.value, type.body]}>{detail.title}</Text>
              </View>
            </View>

            <View style={[styles.card, styles.messageCard]}>
              <Text style={[styles.message, type.body]}>{detail.message}</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingVertical: spacing.sm, paddingBottom: spacing.xxl },
  column: { gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  statusWrap: { alignItems: 'center' },
  statusPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    minHeight: 36,
    justifyContent: 'center',
  },
  status: { textAlign: 'center' },
  label: { color: colors.textSecondary },
  boxSmall: {
    minHeight: touchTarget,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  value: { color: colors.text },
  messageCard: { minHeight: 250, justifyContent: 'flex-start' },
  message: { color: colors.text },
});
