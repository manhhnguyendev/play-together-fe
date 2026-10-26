import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
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
import { orderService } from '@/api/services/orders';
import {
  AppBar,
  Avatar,
  Button,
  ErrorView,
  LoadingView,
  RatingStars,
  useToast,
} from '@/components/ui';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, radius, spacing } from '@/theme';

export default function RatingScreen() {
  const router = useRouter();
  const toast = useToast();
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
            hitSlop={10}
            onPress={() =>
              router.push({
                pathname: '/report/[orderId]',
                params: { orderId: order.id },
              })
            }
            style={({ pressed }) => [styles.reportButton, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="warning-outline" size={22} color={colors.text} />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Avatar uri={order.toUser?.avatar} name={order.toUser?.name} size={150} />
          <Text style={styles.name}>{order.toUser?.name ?? 'Người chơi'}</Text>
        </View>

        <View style={styles.stars}>
          <RatingStars
            value={rating}
            size={42}
            editable
            onChange={setRating}
          />
        </View>

        <View style={styles.commentWrap}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Nhập vào đánh giá người chơi của bạn"
            placeholderTextColor={colors.textFaint}
            style={styles.commentInput}
            multiline
            maxLength={1000}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Gửi"
          onPress={submit}
          loading={rateMutation.isPending}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingBottom: spacing.xxl },
  reportButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.lg,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    color: colors.text,
  },
  stars: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  commentWrap: {
    marginHorizontal: spacing.md,
    minHeight: 240,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  commentInput: {
    minHeight: 220,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
    padding: 0,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
