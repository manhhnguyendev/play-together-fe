import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { datingService } from '@/api/services/catalog';
import { blockService, userService } from '@/api/services/users';
import type { OnlineHourModel } from '@/api/types';
import { StatusText } from '@/components/players/StatusText';
import {
  AppBar,
  Button,
  EmptyState,
  ErrorView,
  LoadingView,
  SectionHeader,
  useToast,
} from '@/components/ui';
import { isPlayerBusy } from '@/features/discovery/status';
import { formatMinuteOfDay } from '@/features/hours/time';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { formatNumber, initialsOf } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, hitSlop, radius, spacing } from '@/theme';

const DAYS: { day: number; label: string }[] = [
  { day: 2, label: 'Thứ 2' },
  { day: 3, label: 'Thứ 3' },
  { day: 4, label: 'Thứ 4' },
  { day: 5, label: 'Thứ 5' },
  { day: 6, label: 'Thứ 6' },
  { day: 7, label: 'Thứ 7' },
  { day: 8, label: 'Chủ nhật' },
];

export default function PlayerProfileScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle, cardWidth, type, isSmall } = useResponsive();
  const params = useLocalSearchParams<{ id?: string }>();
  const playerId = typeof params.id === 'string' ? params.id : '';
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const toggleBlock = useMutation({
    mutationFn: (blocked: boolean) =>
      blocked ? blockService.unblock(playerId) : blockService.block(playerId),
    onSuccess: async (_result, blocked) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.player(playerId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.blockedUsers }),
      ]);
      toast.show(
        blocked ? 'Đã bỏ chặn người dùng' : 'Đã chặn người dùng',
        'success',
      );
    },
    onError: () => toast.show('Không thể cập nhật danh sách chặn', 'error'),
  });

  const playerQuery = useQuery({
    queryKey: queryKeys.player(playerId),
    enabled: Boolean(playerId),
    queryFn: async () => (await userService.getPlayerById(playerId)).content,
  });

  const gamesQuery = useQuery({
    queryKey: queryKeys.gamesOfUser(playerId),
    enabled: Boolean(playerId),
    queryFn: async () => (await userService.getGameOfUser(playerId)).content,
  });

  const datingsQuery = useQuery({
    queryKey: queryKeys.datings(playerId),
    enabled: Boolean(playerId),
    queryFn: async () => (await datingService.getAll(playerId)).content,
  });

  if (playerQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Hồ sơ người chơi" />
        <LoadingView />
      </SafeAreaView>
    );
  }

  if (playerQuery.isError || !playerQuery.data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppBar title="Hồ sơ người chơi" />
        <ErrorView onRetry={() => playerQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const player = playerQuery.data;
  const images = player.images ?? [];
  const games = gamesQuery.data ?? [];
  const datings = datingsQuery.data ?? [];
  const tile = cardWidth(spacing.sm);
  const avatarSize = isSmall ? 96 : 112;

  const datingsByDay = (day: number): OnlineHourModel[] =>
    datings.filter((item) => item.dayInWeek === day);

  const handleHire = () => {
    if (!currentUser) return;
    if (player.id === currentUser.id) {
      toast.show('Bạn không thể thuê chính mình!', 'error');
      return;
    }
    if (player.isBlockedByMe) {
      toast.show('Bạn đã chặn người này, hãy bỏ chặn để thuê', 'error');
      return;
    }
    if (currentUser.isPlayer) {
      toast.show(
        'Bạn không thể thuê! Vui lòng tắt nhận thuê để thực hiện',
        'error',
      );
      return;
    }
    if (isPlayerBusy(player.status)) {
      toast.show(
        'Bạn không thể thuê! Người chơi hiện đang bận, vui lòng thuê lại sau',
        'error',
      );
      return;
    }
    router.push({
      pathname: '/send-hiring-request',
      params: { playerId: player.id },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Hồ sơ người chơi" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.column, contentStyle]}>
          <View style={styles.header}>
            <View style={[styles.avatarWrap, { width: avatarSize, height: avatarSize }]}>
              {player.avatar ? (
                <Image
                  source={{ uri: player.avatar }}
                  style={styles.avatar}
                  contentFit="cover"
                  transition={140}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text
                    style={[
                      styles.avatarFallbackText,
                      { fontSize: Math.round(avatarSize * 0.34) },
                    ]}
                  >
                    {initialsOf(player.name)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.name, type.title2]} numberOfLines={1}>
              {player.name}
            </Text>
            <StatusText status={player.status} size={15} />
            <View style={styles.headerMeta}>
              <View style={styles.metaPill}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={colors.primaryAction}
                />
                <Text style={styles.metaPillText}>{player.city || '—'}</Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons name="star" size={14} color={colors.gold} />
                <Text style={styles.metaPillText}>
                  {player.rate.toFixed(1)} ({player.numOfRate})
                </Text>
              </View>
            </View>
          </View>

          <Section title="Hình ảnh" icon="images-outline">
            {images.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có hình ảnh</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageRow}
              >
                {images.map((image) => (
                  <Pressable
                    key={image.id}
                    accessibilityRole="imagebutton"
                    accessibilityLabel="Xem ảnh lớn"
                    onPress={() => setActiveImage(image.imageLink)}
                    style={({ pressed }) => pressed && styles.pressed}
                  >
                    <Image
                      source={{ uri: image.imageLink }}
                      style={[styles.galleryImage, { width: tile * 1.4 }]}
                      contentFit="cover"
                      transition={140}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </Section>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xem chi tiết đánh giá"
            onPress={() => router.push(`/ratings/${player.id}`)}
            style={({ pressed }) => [
              styles.card,
              styles.ratingRow,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.ratingLeft}>
              <Text style={styles.sectionTitle}>Đánh giá</Text>
              <View style={styles.ratingValueRow}>
                <Ionicons name="star" size={15} color={colors.gold} />
                <Text style={styles.ratingValue}>{player.rate.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>({player.numOfRate})</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>Chi tiết đánh giá</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textMuted}
              />
            </View>
          </Pressable>

          {currentUser && player.id !== currentUser.id ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                player.isBlockedByMe ? 'Bỏ chặn người dùng' : 'Chặn người dùng'
              }
              accessibilityState={{ disabled: toggleBlock.isPending }}
              disabled={toggleBlock.isPending}
              hitSlop={hitSlop.sm}
              onPress={() => toggleBlock.mutate(player.isBlockedByMe)}
              style={({ pressed }) => [
                styles.card,
                styles.blockRow,
                player.isBlockedByMe ? null : styles.blockCardDanger,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.blockLabel}>
                <View
                  style={[
                    styles.blockIcon,
                    player.isBlockedByMe ? null : styles.blockIconDanger,
                  ]}
                >
                  <Ionicons
                    name={
                      player.isBlockedByMe
                        ? 'checkmark-circle-outline'
                        : 'ban-outline'
                    }
                    size={18}
                    color={
                      player.isBlockedByMe ? colors.primaryAction : colors.danger
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.blockText,
                    !player.isBlockedByMe && styles.blockTextDanger,
                  ]}
                >
                  {player.isBlockedByMe ? 'Bỏ chặn người dùng' : 'Chặn người dùng'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.grey} />
            </Pressable>
          ) : null}

          <Section title="Thông tin" icon="person-outline">
            <Text style={styles.description}>
              {player.description || 'Người chơi chưa cập nhật giới thiệu.'}
            </Text>
          </Section>

          <Section title="Kỹ năng" icon="game-controller-outline">
            {gamesQuery.isLoading ? (
              <Text style={styles.emptyText}>Đang tải...</Text>
            ) : games.length === 0 ? (
              <Text style={styles.emptyText}>Chưa cập nhật kỹ năng</Text>
            ) : (
              <View style={styles.skillList}>
                {games.map((item) => (
                  <View key={item.id} style={styles.skillRow}>
                    <View style={styles.skillDot} />
                    <Text style={styles.skillGame}>{item.game?.name}</Text>
                    {item.rankId !== 'None' && item.rank ? (
                      <Text style={styles.skillRank}>{item.rank.name}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </Section>

          <Section title="Giờ online" icon="time-outline">
            {datingsQuery.isLoading ? (
              <Text style={styles.emptyText}>Đang tải...</Text>
            ) : (
              <View style={styles.hoursList}>
                {DAYS.map(({ day, label }) => {
                  const items = datingsByDay(day);
                  return (
                    <View key={day} style={styles.hoursRow}>
                      <Text style={styles.hoursDay}>{label}</Text>
                      {items.length === 0 ? (
                        <Text style={styles.hoursEmpty}>—</Text>
                      ) : (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.hoursChips}
                        >
                          {items.map((item) => (
                            <View key={item.id} style={styles.hourChip}>
                              <Text style={styles.hourChipText}>
                                {formatMinuteOfDay(item.fromHour)} -{' '}
                                {formatMinuteOfDay(item.toHour)}
                              </Text>
                            </View>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </Section>

          {player.isPlayer ? null : (
            <EmptyState
              icon="alert-circle-outline"
              title="Người chơi hiện không nhận thuê"
              description="Bạn vẫn có thể xem hồ sơ và đánh giá của người chơi này."
            />
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: gutter,
            paddingBottom: insets.bottom + spacing.sm,
          },
        ]}
      >
        <View style={[styles.footerRow, contentStyle]}>
          <View style={styles.priceBlock}>
            <Text style={styles.price}>
              {formatNumber(player.pricePerHour)}đ
              <Text style={styles.priceUnit}>/h</Text>
            </Text>
            <Text style={styles.footerHint}>Giá thuê mỗi giờ</Text>
          </View>
          <View style={styles.hireButton}>
            <Button
              label="Thuê"
              size="md"
              onPress={handleHire}
              disabled={!player.isPlayer}
            />
          </View>
        </View>
      </View>

      <Modal
        visible={Boolean(activeImage)}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveImage(null)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng ảnh"
          style={styles.modalBackdrop}
          onPress={() => setActiveImage(null)}
        >
          {activeImage ? (
            <Image
              source={{ uri: activeImage }}
              style={styles.modalImage}
              contentFit="contain"
            />
          ) : null}
          <View style={[styles.modalClose, { top: Math.max(insets.top, spacing.md) }]}>
            <Ionicons name="close" size={22} color={colors.white} />
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <SectionHeader title={title} icon={icon} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingVertical: spacing.sm, gap: spacing.sm },
  column: { gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  header: { alignItems: 'center', paddingVertical: spacing.md, gap: 5 },
  avatarWrap: {
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
    borderWidth: 3,
    borderColor: colors.surface,
    marginBottom: spacing.xs,
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: {
    fontFamily: fonts.bold,
    color: colors.primaryInk,
  },
  name: {
    fontFamily: fonts.bold,
    color: colors.text,
    letterSpacing: -0.4,
    maxWidth: '100%',
  },
  headerMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    minHeight: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaPillText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.text,
    letterSpacing: -0.2,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  imageRow: { gap: spacing.sm },
  galleryImage: {
    aspectRatio: 3 / 2,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  ratingLeft: { gap: 4, flex: 1, minWidth: 0 },
  ratingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  ratingCount: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textFaint,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  blockCardDanger: { borderColor: colors.dangerSoft },
  blockLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  blockIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryFaint,
  },
  blockIconDanger: { backgroundColor: colors.dangerSoft },
  blockText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  blockTextDanger: { color: colors.danger },
  pressed: { opacity: 0.7 },
  detailText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  skillList: { gap: spacing.xs },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  skillDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primaryMuted,
  },
  skillGame: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  skillRank: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.primaryInk,
  },
  hoursList: { gap: 6 },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  hoursDay: {
    width: 64,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text,
  },
  hoursEmpty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textFaint,
  },
  hoursChips: { gap: 6 },
  hourChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryFaint,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  hourChipText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.primaryInk,
  },
  footer: {
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  priceBlock: { minWidth: 0 },
  price: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.primaryInk,
  },
  priceUnit: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  footerHint: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textFaint,
    marginTop: 1,
  },
  hireButton: { width: 140, maxWidth: '46%', flexShrink: 0 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalImage: { width: '100%', height: '78%' },
  modalClose: {
    position: 'absolute',
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});
