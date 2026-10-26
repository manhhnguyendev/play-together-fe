import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { feedbackService } from '@/api/services/content';
import {
  AppBar,
  ErrorView,
  LoadingView,
} from '@/components/ui';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, spacing } from '@/theme';

const TYPE_LABELS: Record<string, string> = {
  Suggest: 'Đề xuất tính năng hoặc thêm mới danh mục game',
  SystemError: 'Báo cáo lỗi của hệ thống',
  Service: 'Phản hồi về dịch vụ',
};

const statusOf = (value: number) => {
  if (value === 1) return { label: 'Đã duyệt', color: colors.success };
  if (value === 0) return { label: 'Bị từ chối', color: colors.danger };
  return { label: 'Chờ xét duyệt', color: colors.warning };
};

export default function FeedbackDetailScreen() {
  const params = useLocalSearchParams<{ feedbackId?: string }>();
  const feedbackId =
    typeof params.feedbackId === 'string' ? params.feedbackId : '';

  const detailQuery = useQuery({
    queryKey: queryKeys.feedbackDetail(feedbackId),
    enabled: Boolean(feedbackId),
    queryFn: async () => (await feedbackService.getDetail(feedbackId)).content,
  });

  const detail = detailQuery.data;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Chi tiết phản hồi" />
      {detailQuery.isLoading ? (
        <LoadingView />
      ) : detailQuery.isError || !detail ? (
        <ErrorView onRetry={() => detailQuery.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.status, { color: statusOf(detail.isApprove).color }]}>
            {statusOf(detail.isApprove).label}
          </Text>

          <Text style={styles.label}>Thể loại: </Text>
          <View style={styles.boxSmall}>
            <Text style={styles.value}>
              {TYPE_LABELS[detail.typeOfFeedback] ?? 'Lỗi gửi'}
            </Text>
          </View>

          <Text style={styles.label}>Tiêu đề: </Text>
          <View style={styles.boxSmall}>
            <Text style={styles.value}>{detail.title}</Text>
          </View>

          <View style={styles.messageBox}>
            <Text style={styles.message}>{detail.message}</Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.xs,
  },
  status: {
    fontFamily: fonts.medium,
    fontSize: 14,
    textAlign: 'center',
    paddingBottom: spacing.sm,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
    marginTop: spacing.xs,
  },
  boxSmall: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  value: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  messageBox: {
    minHeight: 250,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
  },
});
