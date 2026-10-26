import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { chatService } from '@/api/services/content';
import { orderService } from '@/api/services/orders';
import type { ChatModel } from '@/api/types';
import {
  EmptyState,
  ErrorView,
  LoadingView,
  useToast,
} from '@/components/ui';
import { initialsOf } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, radius, spacing } from '@/theme';

export default function ChatScreen() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.appBar}>
        <Pressable
          hitSlop={10}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </Pressable>
        <View style={styles.avatarWrap}>
          {otherUser.avatar ? (
            <Image
              source={{ uri: otherUser.avatar }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>
                {initialsOf(otherUser.name)}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.name} numberOfLines={1}>
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
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
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

        <View style={styles.inputBar}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Nhập tin nhắn"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={send}
            disabled={!message.trim() || sendMutation.isPending}
            style={({ pressed }) => [
              styles.sendButton,
              (!message.trim() || sendMutation.isPending) &&
                styles.sendButtonDisabled,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="send" size={18} color={colors.white} />
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
  if (isMine) {
    return (
      <View style={[styles.bubbleRow, styles.bubbleRowMine]}>
        <View style={[styles.bubble, styles.bubbleMine]}>
          <Text style={styles.bubbleTextMine}>{chat.message}</Text>
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
          />
        ) : (
          <Text style={styles.bubbleAvatarText}>{initialsOf(name)}</Text>
        )}
      </View>
      <View style={[styles.bubble, styles.bubbleOther]}>
        <Text style={styles.bubbleTextOther}>{chat.message}</Text>
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
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingRight: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.primaryDark,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.white,
  },
  name: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.white,
  },
  list: {
    padding: spacing.md,
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
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleAvatarText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.primaryDark,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  bubbleTextMine: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
  },
  bubbleTextOther: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  sendButtonDisabled: { backgroundColor: colors.primarySoft },
});
