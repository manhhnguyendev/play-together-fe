import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
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
          renderItem={({ item }) => (
            <FeedbackRow
              feedback={item}
              onPress={() => router.push(`/feedback/${item.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function FeedbackRow({
  feedback,
  onPress,
}: {
  feedback: SystemFeedbackModel;
  onPress: () => void;
}) {
  const { type } = useResponsive();
  const status = statusOf(feedback.isApprove);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${feedback.title}, ${status.label}`}
      accessibilityHint="Mở chi tiết phản hồi"
      hitSlop={hitSlop.sm}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.rowTop}>
        <Text style={[styles.title, type.title3]} numberOfLines={2}>
          {feedback.title}
        </Text>
        <View
          style={[styles.statusPill, { backgroundColor: status.background }]}
        >
          <Text
            style={[styles.status, type.caption, { color: status.color }]}
            numberOfLines={1}
          >
            {status.label}
          </Text>
        </View>
      </View>
      <Text style={[styles.date, type.caption]}>
        {formatDateTime(feedback.createdDate)}
      </Text>
    </Pressable>
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
});
