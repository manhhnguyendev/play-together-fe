import { Ionicons } from '@expo/vector-icons';
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
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ratingService } from '@/api/services/content';
import { orderService } from '@/api/services/orders';
import {
  AppBar,
  Avatar,
  Button,
  EmptyState,
  ErrorView,
  LoadingView,
  RatingStars,
  useToast,
} from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { queryKeys } from '@/lib/queryKeys';
import { MAX_MESSAGE_LENGTH } from '@/lib/validators';
import { colors, hitSlop, radius, spacing, touchTarget } from '@/theme';

export default function RatingScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle, isSmall, type } = useResponsive();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const orderQuery = useQuery({
    queryKey: queryKeys.order(orderId),
    enabled: Boolean(orderId),
    queryFn: async () => (await orderService.getById(orderId)).content,
  });

  const rateMutation = useMutation({
    mutationFn: () =>
      ratingService.create(order!.id, { rate: rating, comment: comment.trim() }),
    onSuccess: () => {
      toast.show('Đánh giá thành công!', 'success');
      router.replace('/(tabs)/history');
    },
    onError: (error) =>
      toast.show(
        error instanceof Error ? error.message : 'Không thể gửi đánh giá.',
        'error',
      ),
  });

  if (!orderId || orderQuery.isError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Kết thúc thuê" />
        <ErrorView onRetry={() => orderQuery.refetch()} />
      </SafeAreaView>
    );
  }

  if (orderQuery.isLoading || !orderQuery.data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Kết thúc thuê" />
        <LoadingView />
      </SafeAreaView>
    );
  }

  const order = orderQuery.data;

  // A cancelled booking, an already-rated session or a closed window all leave
  // nothing to rate; the server refuses the POST, so the form must not offer it.
  if (!order.canRate) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Kết thúc thuê" />
        <EmptyState
          icon="star-outline"
          title="Không đánh giá được lượt thuê này"
          description="Lượt thuê chưa diễn ra, đã được đánh giá, hoặc đã hết thời gian cho phép."
        />
        <View style={styles.closedAction}>
          <Button
            label="Về lịch sử"
            size="md"
            onPress={() => router.replace('/(tabs)/history')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const submit = () => {
    if (rating <= 0) {
      toast.show('Vui lòng đánh giá!', 'error');
      return;
    }
    if (!comment.trim()) {
      toast.show('Vui lòng nhập đánh giá!', 'error');
      return;
    }
    rateMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar
        title="Kết thúc thuê"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tố cáo đơn này"
            hitSlop={hitSlop.sm}
            onPress={() =>
              router.push({
                pathname: '/report/[target]',
                params: { target: order.id, kind: 'order' },
              })
            }
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="warning-outline" size={22} color={colors.danger} />
          </Pressable>
        }
      />
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
              <View style={styles.header}>
                <Avatar
                  uri={order.toUser?.avatar}
                  name={order.toUser?.name}
                  size={isSmall ? 120 : 150}
                />
                <Text style={[styles.name, type.title2]} numberOfLines={1}>
                  {order.toUser?.name ?? 'Người chơi'}
                </Text>
              </View>
            </View>

            <View style={[styles.card, styles.starCard]}>
              <RatingStars
                value={rating}
                size={isSmall ? 36 : 42}
                editable
                onChange={setRating}
              />
            </View>

            <View style={styles.card}>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Nhập vào đánh giá người chơi của bạn"
                placeholderTextColor={colors.textFaint}
                accessibilityLabel="Nội dung đánh giá"
                style={[styles.commentInput, type.body]}
                multiline
                maxLength={MAX_MESSAGE_LENGTH}
                textAlignVertical="top"
              />
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
              loading={rateMutation.isPending}
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
  closedAction: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    maxWidth: 520,
    alignSelf: 'center',
    width: '100%',
  },
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
  },
  iconButton: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6, backgroundColor: colors.surfaceMuted },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  name: {
    color: colors.text,
    textAlign: 'center',
    flexShrink: 1,
  },
  starCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  commentInput: {
    minHeight: 220,
    color: colors.text,
    lineHeight: 22,
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
