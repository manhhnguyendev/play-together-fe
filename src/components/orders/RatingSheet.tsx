import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ratingService } from '@/api/services/content';
import {
  Avatar,
  Button,
  EmptyState,
  RatingStars,
  useToast,
} from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { MAX_MESSAGE_LENGTH } from '@/lib/validators';
import { colors, hitSlop, radius, spacing, touchTarget } from '@/theme';

interface RatingSheetProps {
  orderId: string;
  playerName?: string | null;
  playerAvatar?: string | null;
  /** The server's own rule, forwarded so a stale poll cannot keep the form open. */
  canRate: boolean;
  visible: boolean;
  onDismiss: () => void;
  onRated: () => void;
}

/**
 * The rating form as a sheet over `end-order`, which already shows the same order.
 *
 * It used to be a screen of its own, reached with `router.replace`, so the hirer lost
 * the order view they had just read and the header still said "Kết thúc thuê" while the
 * body was a rating form.
 */
export function RatingSheet({
  orderId,
  playerName,
  playerAvatar,
  canRate,
  visible,
  onDismiss,
  onRated,
}: RatingSheetProps) {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { isSmall, type } = useResponsive();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const rateMutation = useMutation({
    mutationFn: () =>
      ratingService.create(orderId, { rate: rating, comment: comment.trim() }),
    onSuccess: () => {
      setRating(0);
      setComment('');
      toast.show('Đánh giá thành công!', 'success');
      onDismiss();
      onRated();
    },
    onError: (error) =>
      toast.show(
        error instanceof Error ? error.message : 'Không thể gửi đánh giá.',
        'error',
      ),
  });

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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng đánh giá"
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
        />
        <View
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}
          accessibilityViewIsModal
        >
          <View style={styles.header}>
            <Text style={[styles.title, type.title3]} accessibilityRole="header">
              Đánh giá người chơi
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng đánh giá"
              hitSlop={hitSlop.sm}
              onPress={onDismiss}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {canRate ? (
            <>
              <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.identity}>
                  <Avatar
                    uri={playerAvatar}
                    name={playerName ?? undefined}
                    size={isSmall ? 96 : 120}
                  />
                  <Text style={[styles.name, type.title2]} numberOfLines={1}>
                    {playerName ?? 'Người chơi'}
                  </Text>
                </View>

                <RatingStars
                  value={rating}
                  size={isSmall ? 36 : 42}
                  editable
                  onChange={setRating}
                />

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
              </ScrollView>

              <Button
                label="Gửi"
                size="lg"
                onPress={submit}
                loading={rateMutation.isPending}
              />
            </>
          ) : (
            <View style={styles.closed}>
              <EmptyState
                icon="star-outline"
                title="Không đánh giá được lượt thuê này"
                description="Lượt thuê chưa diễn ra, đã được đánh giá, hoặc đã hết thời gian cho phép."
              />
              <Button label="Đóng" size="md" variant="secondary" onPress={onDismiss} />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { color: colors.text, flexShrink: 1 },
  closeButton: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6, backgroundColor: colors.surfaceMuted },
  body: { flexGrow: 0 },
  bodyContent: { gap: spacing.md, paddingVertical: spacing.xs },
  identity: { alignItems: 'center', gap: spacing.xs },
  name: { color: colors.text, textAlign: 'center', flexShrink: 1 },
  commentInput: {
    minHeight: 160,
    color: colors.text,
    lineHeight: 22,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
  },
  closed: { gap: spacing.md },
});
