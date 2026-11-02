import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { chatService } from '@/api/services/content';
import { orderService } from '@/api/services/orders';
import type { ChatModel } from '@/api/types';
import {
  EmptyState,
  ErrorView,
  LoadingView,
  useToast,
} from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { initialsOf } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, control, fonts, hitSlop, radius, spacing, touchTarget } from '@/theme';

export default function ChatScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { gutter, type } = useResponsive();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';
  const currentUser = useAuthStore((state) => state.user);

  const [message, setMessage] = useState('');

  const orderQuery = useQuery({
    queryKey: queryKeys.order(orderId),
    enabled: Boolean(orderId),
    queryFn: async () => (await orderService.getById(orderId)).content,
  });

  const order = orderQuery.data;
  const otherUser =
    order && currentUser
      ? order.user?.id === currentUser.id
        ? order.toUser
        : order.user
      : null;

  const chatsQuery = useQuery({
    queryKey: queryKeys.chat(otherUser?.id ?? ''),
    enabled: Boolean(otherUser?.id),
    queryFn: async () => (await chatService.getAll(otherUser!.id)).content,
    refetchInterval: 8000,
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) =>
      chatService.send(otherUser!.id, { message: text }),
    onSuccess: async () => {
      setMessage('');
      if (otherUser) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.chat(otherUser.id),
        });
      }
    },
    onError: () => toast.show('Không thể gửi tin nhắn. Vui lòng thử lại.', 'error'),
  });

  const send = () => {
    const text = message.trim();
    if (!text || !otherUser || sendMutation.isPending) return;
    sendMutation.mutate(text);
  };

  if (orderQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <LoadingView />
      </SafeAreaView>
    );
  }

  if (orderQuery.isError || !order || !otherUser) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <ErrorView onRetry={() => orderQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const chats = chatsQuery.data ?? [];
  const canSend = Boolean(message.trim()) && !sendMutation.isPending;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.appBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          hitSlop={hitSlop.sm}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </View>
        </Pressable>
        <View style={styles.avatarWrap}>
          {otherUser.avatar ? (
            <Image
              source={{ uri: otherUser.avatar }}
              style={styles.avatar}
              contentFit="cover"
              transition={140}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>
                {initialsOf(otherUser.name)}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.name, type.title3]} numberOfLines={1}>
          {otherUser.name}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {chatsQuery.isLoading ? (
          <LoadingView />
        ) : chatsQuery.isError ? (
          <ErrorView onRetry={() => chatsQuery.refetch()} />
        ) : chats.length === 0 ? (
          <EmptyState
            icon="chatbubbles-outline"
            title="Bắt đầu trò chuyện"
            description="Hãy gửi lời chào để trao đổi với người chơi."
          />
        ) : (
          <FlatList
            data={[...chats].reverse()}
            inverted
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={[styles.listContent, { paddingHorizontal: gutter }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ChatBubble
                chat={item}
                isMine={item.user?.id === currentUser?.id}
                avatar={otherUser.avatar}
                name={otherUser.name}
              />
            )}
          />
        )}

        <View
          style={[styles.inputBar, { paddingBottom: insets.bottom + spacing.sm }]}
        >
          <TextInput
            value={message}
            onChangeText={setMessage}
            accessibilityLabel="Nhập tin nhắn"
            placeholder="Nhập tin nhắn"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            multiline
            maxLength={500}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Gửi tin nhắn"
            accessibilityState={{ disabled: !canSend }}
            onPress={send}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.sendButton,
              !canSend && styles.sendButtonDisabled,
              pressed && canSend && styles.pressed,
            ]}
          >
            <Ionicons
              name="send"
              size={20}
              color={canSend ? colors.textOnPrimary : colors.textFaint}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChatBubble({
  chat,
  isMine,
  avatar,
  name,
}: {
  chat: ChatModel;
  isMine: boolean;
  avatar: string;
  name: string;
}) {
  const { type, width } = useResponsive();
  const bubbleMaxWidth = Math.round(width * 0.78);

  if (isMine) {
    return (
      <View style={[styles.bubbleRow, styles.bubbleRowMine]}>
        <View style={[styles.bubble, styles.bubbleMine, { maxWidth: bubbleMaxWidth }]}>
          <Text style={[styles.bubbleTextMine, type.bodySmall]}>{chat.message}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.bubbleRow}>
      <View style={styles.bubbleAvatar}>
        {avatar ? (
          <Image
            source={{ uri: avatar }}
            style={styles.avatar}
            contentFit="cover"
            transition={140}
          />
        ) : (
          <Text style={styles.bubbleAvatarText}>{initialsOf(name)}</Text>
        )}
      </View>
      <View style={[styles.bubble, styles.bubbleOther, { maxWidth: bubbleMaxWidth }]}>
        <Text style={[styles.bubbleTextOther, type.bodySmall]}>{chat.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: control.appBarHeight,
    backgroundColor: colors.surface,
    paddingLeft: spacing.xs,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  back: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  pressed: { opacity: 0.6 },
  avatarWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryInk,
  },
  name: {
    flex: 1,
    color: colors.text,
  },
  list: { flex: 1 },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleAvatarText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.primaryInk,
  },
  bubble: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.lg,
  },
  bubbleMine: {
    backgroundColor: colors.primaryFill,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.surfaceMuted,
    borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  bubbleTextMine: { color: colors.textOnPrimary },
  bubbleTextOther: { color: colors.text },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: control.inputHeight,
    maxHeight: 116,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryFill,
  },
  sendButtonDisabled: { backgroundColor: colors.primarySoft },
});
