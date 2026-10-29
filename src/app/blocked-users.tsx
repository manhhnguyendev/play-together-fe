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
import { colors, fonts, radius, spacing } from '@/theme';

export default function BlockedUsersScreen() {
  const toast = useToast();
  const queryClient = useQueryClient();

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
          contentContainerStyle={styles.list}
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
  return (
    <View style={styles.row}>
      <Avatar uri={entry.user.avatarUrl ?? ''} name={entry.user.name} size={44} />
      <View style={styles.rowBody}>
        <Text style={styles.name} numberOfLines={1}>
          {entry.user.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {entry.expiresAt
            ? `Hết hạn ${formatDateTime(entry.expiresAt)}`
            : 'Chặn vĩnh viễn'}
        </Text>
      </View>
      <Pressable
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
  safe: { flex: 1, backgroundColor: colors.surface },
  list: { padding: spacing.md, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  rowBody: { flex: 1, gap: 2 },
  name: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  unblock: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  unblockText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.primary,
  },
  pressed: { opacity: 0.65 },
  disabled: { opacity: 0.5 },
});
