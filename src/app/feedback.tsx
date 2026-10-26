import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
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
import { formatDateTimeAmPm } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, spacing } from '@/theme';

const statusOf = (value: number) => {
  if (value === 1) return { label: 'Đã duyệt', color: colors.success };
  if (value === 0) return { label: 'Bị từ chối', color: colors.danger };
  return { label: 'Chờ xét duyệt', color: colors.warning };
};

export default function FeedbackListScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

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
            hitSlop={10}
            onPress={() => router.push('/feedback-create')}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Ionicons name="add" size={26} color={colors.text} />
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
          contentContainerStyle={styles.list}
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
  const status = statusOf(feedback.isApprove);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowTop}>
        <Text style={styles.title} numberOfLines={2}>
          {feedback.title}
        </Text>
        <Text style={[styles.status, { color: status.color }]}>
          {status.label}
        </Text>
      </View>
      <Text style={styles.date}>{formatDateTimeAmPm(feedback.createdDate)}</Text>
      <View style={styles.divider} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  pressed: { opacity: 0.65 },
  list: { paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  row: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
  },
  status: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  date: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
  },
});
