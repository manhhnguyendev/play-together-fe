import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, radius, spacing } from '@/theme';

export default function ReportScreen() {
  const router = useRouter();
  const toast = useToast();
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
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Avatar
            uri={otherParty?.avatar}
            name={otherParty?.name}
            size={150}
          />
          <Text style={styles.name}>{otherParty?.name ?? 'Người chơi'}</Text>
        </View>

        <View style={styles.inputWrap}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Nhập vào lý do tố cáo"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
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
          loading={reportMutation.isPending}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingBottom: spacing.xxl },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    color: colors.text,
  },
  inputWrap: {
    marginHorizontal: spacing.md,
    minHeight: 260,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  input: {
    minHeight: 240,
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
