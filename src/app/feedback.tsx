import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { feedbackService } from '@/api/services/content';
import type { SystemFeedbackModel } from '@/api/types';
import {
  AppBar,
  EmptyState,
  ErrorView,
  LoadingView,
} from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { formatDateTime } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { colors, hitSlop, radius, spacing, touchTarget } from '@/theme';

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

const TYPE_LABELS: Record<string, string> = {
  Suggest: 'Đề xuất tính năng hoặc thêm mới danh mục game',
  SystemError: 'Báo cáo lỗi của hệ thống',
  Service: 'Phản hồi về dịch vụ',
};

export default function FeedbackListScreen() {
  const router = useAppRouter();
  const queryClient = useQueryClient();
  const { gutter, contentStyle } = useResponsive();

  const feedbackQuery = useQuery({
    queryKey: queryKeys.feedbacks,
    queryFn: async () => feedbackService.getAll(),
  });

  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.feedbacks });
    }, [queryClient]),
  );

  const feedbacks = feedbackQuery.data?.content ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar
        title="Trung tâm phản hồi"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tạo phản hồi"
            hitSlop={hitSlop.sm}
            onPress={() => router.push('/feedback-create')}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="add" size={24} color={colors.text} />
          </Pressable>
        }
      />

      {feedbackQuery.isLoading ? (
        <LoadingView />
      ) : feedbackQuery.isError ? (
        <ErrorView onRetry={() => feedbackQuery.refetch()} />
      ) : feedbacks.length === 0 ? (
        <EmptyState
          icon="chatbox-ellipses-outline"
          title="Không có dữ liệu"
          description="Bạn chưa gửi phản hồi nào."
        />
      ) : (
        <FlatList
          data={feedbacks}
          keyExtractor={(item) => item.id}
          style={contentStyle}
          contentContainerStyle={[styles.list, { paddingHorizontal: gutter }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <FeedbackRow feedback={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function FeedbackRow({ feedback }: { feedback: SystemFeedbackModel }) {
  const { type } = useResponsive();
  const [expanded, setExpanded] = useState(false);
  const status = statusOf(feedback.isApprove);

  // The body only exists on the detail endpoint, so it is fetched the first
  // time the row is opened and kept in the shared cache after that.
  const detailQuery = useQuery({
    queryKey: queryKeys.feedbackDetail(feedback.id),
    enabled: expanded,
    queryFn: async () => (await feedbackService.getDetail(feedback.id)).content,
  });

  const detail = detailQuery.data;

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${feedback.title}, ${status.label}`}
        accessibilityHint={expanded ? 'Ẩn nội dung' : 'Xem nội dung'}
        accessibilityState={{ expanded }}
        hitSlop={hitSlop.sm}
        onPress={() => setExpanded((value) => !value)}
        style={({ pressed }) => [styles.rowTop, pressed && styles.pressed]}
      >
        <Text style={[styles.title, type.title3]} numberOfLines={2}>
          {feedback.title}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: status.background }]}>
          <Text
            style={[styles.status, type.caption, { color: status.color }]}
            numberOfLines={1}
          >
            {status.label}
          </Text>
        </View>
      </Pressable>
      <Text style={[styles.date, type.caption]}>
        {formatDateTime(feedback.createdDate)}
      </Text>

      {expanded ? (
        detailQuery.isLoading ? (
          <Text style={[styles.detailHint, type.bodySmall]}>Đang tải nội dung…</Text>
        ) : detailQuery.isError || !detail ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thử tải lại nội dung"
            hitSlop={hitSlop.sm}
            onPress={() => void detailQuery.refetch()}
            style={({ pressed }) => [styles.detailHint, pressed && styles.pressed]}
          >
            <Text style={[type.bodySmall, styles.detailError]}>
              Không tải được nội dung. Nhấn để thử lại.
            </Text>
          </Pressable>
        ) : (
          <View style={styles.detail}>
            <Text style={[styles.detailLabel, type.bodySmall]}>Thể loại</Text>
            <Text style={[styles.detailValue, type.body]}>
              {TYPE_LABELS[detail.typeOfFeedback] ?? 'Lỗi gửi'}
            </Text>
            <Text style={[styles.detailLabel, type.bodySmall]}>Nội dung</Text>
            <Text style={[styles.detailValue, type.body]}>{detail.message}</Text>
          </View>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  pressed: { opacity: 0.75 },
  iconButton: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
  },
  statusPill: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: radius.pill,
    maxWidth: 130,
  },
  status: { textAlign: 'center' },
  date: { color: colors.textMuted },
  detail: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  detailLabel: { color: colors.textSecondary },
  detailValue: { color: colors.text },
  detailHint: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    color: colors.textMuted,
  },
  detailError: { color: colors.danger },
});
