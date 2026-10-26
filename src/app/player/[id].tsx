import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { datingService } from '@/api/services/catalog';
import { userService } from '@/api/services/users';
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
import { formatNumber, initialsOf } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, radius, spacing } from '@/theme';

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
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ id?: string }>();
  const playerId = typeof params.id === 'string' ? params.id : '';
  const currentUser = useAuthStore((state) => state.user);
  const [activeImage, setActiveImage] = useState<string | null>(null);

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

  const datingsByDay = (day: number): OnlineHourModel[] =>
    datings.filter((item) => item.dayInWeek === day);

  const handleHire = () => {
    if (!currentUser) return;
    if (player.id === currentUser.id) {
      toast.show('Bạn không thể thuê chính mình!', 'error');
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
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            {player.avatar ? (
              <Image
                source={{ uri: player.avatar }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {initialsOf(player.name)}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{player.name}</Text>
          <StatusText status={player.status} size={15} />
          <View style={styles.headerMeta}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={styles.headerMetaText}>{player.city || '—'}</Text>
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
                  onPress={() => setActiveImage(image.imageLink)}
                >
                  <Image
                    source={{ uri: image.imageLink }}
                    style={styles.galleryImage}
                    contentFit="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </Section>

        <Pressable
          onPress={() => router.push(`/ratings/${player.id}`)}
          style={({ pressed }) => [
            styles.ratingRow,
            pressed && { opacity: 0.7 },
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
                  <Text style={styles.skillGame}>• {item.game?.name}</Text>
                  {item.rankId !== 'None' && item.rank ? (
                    <Text style={styles.skillRank}>: {item.rank.name}</Text>
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
                    <Text style={styles.hoursDay}>{label}:</Text>
                    {items.length === 0 ? (
                      <Text style={styles.emptyText}>Không có dữ liệu</Text>
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
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.price}>
            {formatNumber(player.pricePerHour)}đ
            <Text style={styles.priceUnit}>/h</Text>
          </Text>
          <Text style={styles.footerHint}>Giá thuê mỗi giờ</Text>
        </View>
        <View style={styles.hireButton}>
          <Button
            label="Thuê"
            onPress={handleHire}
            disabled={!player.isPlayer}
          />
        </View>
      </View>

      <Modal
        visible={Boolean(activeImage)}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveImage(null)}
      >
        <Pressable
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
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <SectionHeader title={title} icon={icon} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingBottom: spacing.xxl },
  header: { alignItems: 'center', paddingVertical: spacing.lg, gap: 4 },
  avatarWrap: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.sm,
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: {
    fontFamily: fonts.bold,
    fontSize: 46,
    color: colors.primaryDark,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 22,
    color: colors.text,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  headerMetaText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  section: {
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  sectionHeader: { paddingHorizontal: spacing.md },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
  },
  imageRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  galleryImage: {
    width: 150,
    height: 100,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  ratingLeft: { gap: 4 },
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
  detailText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  description: {
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  skillList: { paddingHorizontal: spacing.md, gap: 4 },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap' },
  skillGame: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  skillRank: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.primaryDark,
  },
  hoursList: { gap: spacing.xs },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.md,
  },
  hoursDay: {
    width: 66,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text,
  },
  hoursChips: { gap: 6, paddingRight: spacing.md },
  hourChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryFaint,
  },
  hourChipText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.primaryDark,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.primaryDark,
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
  },
  hireButton: { width: 140 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalImage: { width: '100%', height: '80%' },
});
