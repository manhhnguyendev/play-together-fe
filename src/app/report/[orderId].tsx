import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { reportService } from '@/api/services/content';
import { orderService } from '@/api/services/orders';
import {
  AppBar,
  Avatar,
  Button,
  ErrorView,
  LoadingView,
  useToast,
} from '@/components/ui';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, radius, spacing } from '@/theme';

export default function ReportScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle, isSmall, type } = useResponsive();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';
  const currentUser = useAuthStore((state) => state.user);
  const [message, setMessage] = useState('');

  const orderQuery = useQuery({
    queryKey: queryKeys.order(orderId),
    enabled: Boolean(orderId),
    queryFn: async () => (await orderService.getById(orderId)).content,
  });

  const reportMutation = useMutation({
    mutationFn: () =>
      reportService.create(order!.id, { reportMessage: message.trim() }),
    onSuccess: () => {
      toast.show('Tố cáo thành công!', 'success');
      router.replace('/(tabs)/history');
    },
    onError: (error) =>
      toast.show(
        error instanceof Error ? error.message : 'Không thể gửi tố cáo.',
        'error',
      ),
  });

  if (!orderId || orderQuery.isError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Tố cáo" />
        <ErrorView onRetry={() => orderQuery.refetch()} />
      </SafeAreaView>
    );
  }

  if (orderQuery.isLoading || !orderQuery.data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Tố cáo" />
        <LoadingView />
      </SafeAreaView>
    );
  }

  const order = orderQuery.data;
  const otherParty =
    order.user?.id === currentUser?.id ? order.toUser : order.user;

  const submit = () => {
    if (!message.trim()) {
      toast.show('Vui lòng nhập lý do tố cáo!', 'error');
      return;
    }
    reportMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Tố cáo" />
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
                  uri={otherParty?.avatar}
                  name={otherParty?.name}
                  size={isSmall ? 120 : 150}
                />
                <Text style={[styles.name, type.title2]} numberOfLines={1}>
                  {otherParty?.name ?? 'Người chơi'}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Nhập vào lý do tố cáo"
                placeholderTextColor={colors.textFaint}
                accessibilityLabel="Lý do tố cáo"
                style={[styles.input, type.body]}
                multiline
                maxLength={1000}
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
              loading={reportMutation.isPending}
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
    gap: spacing.sm,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    textAlign: 'center',
    flexShrink: 1,
  },
  input: {
    minHeight: 240,
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
