import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { blockService } from '@/api/services/users';
import type { BlockedUserView } from '@/api/v2/types';
import {
  AppBar,
  Avatar,
  EmptyState,
  ErrorView,
  LoadingView,
  useToast,
} from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, fonts, hitSlop, radius, spacing } from '@/theme';

export default function BlockedUsersScreen() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { gutter, contentStyle } = useResponsive();

  const blockedQuery = useQuery({
    queryKey: queryKeys.blockedUsers,
    queryFn: () => blockService.getAll(),
  });

  const unblock = useMutation({
    mutationFn: (userId: string) => blockService.unblock(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.blockedUsers });
      toast.show('Đã bỏ chặn người dùng', 'success');
    },
    onError: () => toast.show('Không thể bỏ chặn người dùng', 'error'),
  });

  const blocked = blockedQuery.data ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Người dùng đã chặn" />

      {blockedQuery.isLoading ? (
        <LoadingView />
      ) : blockedQuery.isError ? (
        <ErrorView onRetry={() => blockedQuery.refetch()} />
      ) : blocked.length === 0 ? (
        <EmptyState
          icon="ban-outline"
          title="Danh sách trống"
          description="Bạn chưa chặn người dùng nào."
        />
      ) : (
        <FlatList
          data={blocked}
          keyExtractor={(item) => item.id}
          style={contentStyle}
          contentContainerStyle={[styles.list, { paddingHorizontal: gutter }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <BlockedRow
              entry={item}
              disabled={unblock.isPending}
              onUnblock={() => unblock.mutate(item.user.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function BlockedRow({
  entry,
  disabled,
  onUnblock,
}: {
  entry: BlockedUserView;
  disabled: boolean;
  onUnblock: () => void;
}) {
  const { type } = useResponsive();
  return (
    <View style={styles.row}>
      <Avatar uri={entry.user.avatarUrl ?? ''} name={entry.user.name} size={44} />
      <View style={styles.rowBody}>
        <Text style={[styles.name, type.bodySmallMedium]} numberOfLines={1}>
          {entry.user.name}
        </Text>
        <Text style={[styles.meta, type.bodySmall]} numberOfLines={1}>
          {entry.expiresAt
            ? `Hết hạn ${formatDateTime(entry.expiresAt)}`
            : 'Chặn vĩnh viễn'}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Bỏ chặn ${entry.user.name}`}
        accessibilityState={{ disabled }}
        hitSlop={hitSlop.md}
        disabled={disabled}
        onPress={onUnblock}
        style={({ pressed }) => [
          styles.unblock,
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}
      >
        <Text style={styles.unblockText}>Bỏ chặn</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { paddingVertical: spacing.sm, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  rowBody: { flex: 1, gap: 2, minWidth: 0 },
  name: { color: colors.text },
  meta: { color: colors.textMuted },
  unblock: {
    paddingHorizontal: spacing.md,
    minHeight: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryFaint,
    flexShrink: 0,
  },
  unblockText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryInk,
  },
  pressed: { opacity: 0.65 },
  disabled: { opacity: 0.5 },
});
