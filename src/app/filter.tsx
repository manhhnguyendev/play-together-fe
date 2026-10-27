import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
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
import { gameService } from '@/api/services/catalog';
import { AppBar, Button, Checkbox, LoadingView } from '@/components/ui';
import {
  DEFAULT_FILTERS,
  useDiscoveryFilter,
  type DiscoveryFilters,
} from '@/features/discovery/filterStore';
import { formatNumber, parseAmount } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { colors, fonts, radius, spacing } from '@/theme';

const SORT_OPTIONS = [
  { value: 1, label: 'Sở thích', icon: 'heart' },
  { value: 2, label: 'Đánh giá', icon: 'star' },
  { value: 3, label: 'Giá tiền', icon: 'cash' },
  { value: 4, label: 'Từ A-Z', icon: 'text' },
] as const;

const STATUS_OPTIONS = [
  { value: 0, label: 'Tất cả' },
  { value: 1, label: 'Đang online' },
  { value: 2, label: 'Đang thương lượng' },
  { value: 3, label: 'Đang được thuê' },
  { value: 4, label: 'Đang offline' },
] as const;

const PRICE_PRESETS = [
  { label: '10k - 100k', start: 10000, end: 100000 },
  { label: '100k - 300k', start: 100000, end: 300000 },
  { label: '300k - 1tr', start: 300000, end: 1000000 },
  { label: '1tr - 5tr', start: 1000000, end: 5000000 },
];

const MAX_PRICE = 5000000;

const INITIALS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function FilterScreen() {
  const router = useRouter();
  const applyFilters = useDiscoveryFilter((state) => state.apply);
  const storedFilters = useDiscoveryFilter((state) => state.filters);

  const [draft, setDraft] = useState<DiscoveryFilters>(storedFilters);
  const [startPriceText, setStartPriceText] = useState(
    String(storedFilters.startPrice),
  );
  const [endPriceText, setEndPriceText] = useState(
    String(storedFilters.endPrice),
  );

  const gamesQuery = useQuery({
    queryKey: queryKeys.allGames,
    queryFn: async () => (await gameService.getAll()).content,
    staleTime: 10 * 60_000,
  });

  const toggleGame = (gameId: string) => {
    setDraft((current) => ({
      ...current,
      gameIds: current.gameIds.includes(gameId)
        ? current.gameIds.filter((id) => id !== gameId)
        : [...current.gameIds, gameId],
    }));
  };

  const applyPreset = (start: number, end: number) => {
    setStartPriceText(String(start));
    setEndPriceText(String(end));
  };

  const reset = () => {
    setDraft(DEFAULT_FILTERS);
    setStartPriceText(String(DEFAULT_FILTERS.startPrice));
    setEndPriceText(String(DEFAULT_FILTERS.endPrice));
  };

  const apply = () => {
    let start = Math.min(parseAmount(startPriceText), MAX_PRICE);
    let end = Math.min(parseAmount(endPriceText), MAX_PRICE);
    if (start > end) [start, end] = [end, start];
    applyFilters({
      ...draft,
      startPrice: start,
      endPrice: end,
      applied: true,
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Bộ lọc" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel>Lọc theo</SectionLabel>
        <View style={styles.group}>
          {SORT_OPTIONS.map((option) => (
            <RadioRow
              key={option.value}
              label={option.label}
              icon={option.icon}
              selected={draft.sortOrder === option.value}
              onPress={() =>
                setDraft((current) => ({
                  ...current,
                  sortOrder:
                    current.sortOrder === option.value ? 0 : option.value,
                }))
              }
            />
          ))}
        </View>

        <Divider />

        <SectionLabel>Tùy chọn giới tính</SectionLabel>
        <View style={styles.checkboxRow}>
          <View style={styles.checkboxItem}>
            <Checkbox
              checked={draft.isMale}
              label="Nam"
              onPress={() =>
                setDraft((current) => ({
                  ...current,
                  isMale: !current.isMale,
                }))
              }
            />
          </View>
          <View style={styles.checkboxItem}>
            <Checkbox
              checked={draft.isFemale}
              label="Nữ"
              onPress={() =>
                setDraft((current) => ({
                  ...current,
                  isFemale: !current.isFemale,
                }))
              }
            />
          </View>
        </View>

        <Divider />

        <SectionLabel>Chữ cái đầu của tên</SectionLabel>
        <View style={styles.letterGrid}>
          {INITIALS.map((letter) => {
            const selected = draft.initial === letter;
            return (
              <Pressable
                key={letter}
                onPress={() =>
                  setDraft((current) => ({
                    ...current,
                    initial: current.initial === letter ? '' : letter,
                  }))
                }
                style={({ pressed }) => [
                  styles.letterChip,
                  selected && styles.letterChipActive,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[
                    styles.letterText,
                    selected && styles.letterTextActive,
                  ]}
                >
                  {letter}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Divider />

        <SectionLabel>Tùy chọn giá thuê mỗi giờ</SectionLabel>
        <View style={styles.priceRow}>
          <View style={styles.priceField}>
            <Text style={styles.priceLabel}>Từ</Text>
            <TextInput
              value={startPriceText}
              onChangeText={setStartPriceText}
              keyboardType="number-pad"
              placeholder="10000"
              placeholderTextColor={colors.textFaint}
              style={styles.priceInput}
            />
            <Text style={styles.priceUnit}>đ</Text>
          </View>
          <Text style={styles.priceDash}>—</Text>
          <View style={styles.priceField}>
            <Text style={styles.priceLabel}>Đến</Text>
            <TextInput
              value={endPriceText}
              onChangeText={setEndPriceText}
              keyboardType="number-pad"
              placeholder="5000000"
              placeholderTextColor={colors.textFaint}
              style={styles.priceInput}
            />
            <Text style={styles.priceUnit}>đ</Text>
          </View>
        </View>
        <Text style={styles.priceHint}>
          {formatNumber(parseAmount(startPriceText))}đ -{' '}
          {formatNumber(parseAmount(endPriceText))}đ
        </Text>
        <View style={styles.presets}>
          {PRICE_PRESETS.map((preset) => (
            <Pressable
              key={preset.label}
              onPress={() => applyPreset(preset.start, preset.end)}
              style={({ pressed }) => [
                styles.preset,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.presetText}>{preset.label}</Text>
            </Pressable>
          ))}
        </View>

        <Divider />

        <SectionLabel>Tùy chọn trạng thái của người chơi</SectionLabel>
        <View style={styles.group}>
          {STATUS_OPTIONS.map((option) => (
            <RadioRow
              key={option.value}
              label={option.label}
              selected={draft.statusOrder === option.value}
              onPress={() =>
                setDraft((current) => ({
                  ...current,
                  statusOrder: option.value,
                }))
              }
            />
          ))}
        </View>

        <Divider />

        <SectionLabel>Chọn các tựa game bạn muốn tìm</SectionLabel>
        {gamesQuery.isLoading ? (
          <LoadingView label="Đang tải danh sách game..." />
        ) : (
          <View style={styles.gamesGrid}>
            {(gamesQuery.data ?? []).map((game) => (
              <View key={game.id} style={styles.gameItem}>
                <Checkbox
                  checked={draft.gameIds.includes(game.id)}
                  label={game.displayName || game.name || game.otherName}
                  onPress={() => toggleGame(game.id)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerButton}>
          <Button label="Đặt lại" variant="outline" onPress={reset} />
        </View>
        <View style={styles.footerButton}>
          <Button label="Áp dụng" onPress={apply} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function Divider() {
  return <View style={styles.divider} />;
}

function RadioRow({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon?: (typeof SORT_OPTIONS)[number]['icon'];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.radioRow, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.radioLabelWrap}>
        {icon ? (
          <Ionicons
            name={icon}
            size={16}
            color={selected ? colors.primaryDark : colors.textMuted}
          />
        ) : null}
        <Text style={[styles.radioLabel, selected && styles.radioLabelActive]}>
          {label}
        </Text>
      </View>
      <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
    marginTop: spacing.xs,
  },
  group: { gap: 2 },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
  },
  radioLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  radioLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  radioLabelActive: { fontFamily: fonts.semibold, color: colors.primaryDark },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: { borderColor: colors.primary },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingVertical: spacing.xs,
  },
  checkboxItem: { flex: 1 },
  letterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: spacing.xs,
  },
  letterChip: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryFaint,
  },
  letterText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  letterTextActive: {
    color: colors.primaryDark,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  priceField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    height: 46,
  },
  priceLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  priceInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 6,
  },
  priceUnit: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  priceDash: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textFaint,
  },
  priceHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.primaryDark,
    marginTop: 2,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  preset: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryFaint,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  presetText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.primaryDark,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gameItem: { width: '50%', paddingVertical: 2 },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerButton: { flex: 1 },
});
