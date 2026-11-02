import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { imageService } from '@/api/services/content';
import { userService } from '@/api/services/users';
import type { ImageModel } from '@/api/types';
import {
  AppBar,
  Avatar,
  Button,
  Chip,
  DatePickerField,
  SectionHeader,
  SelectField,
  TextField,
  useToast,
} from '@/components/ui';
import { pickAvatar, pickGalleryImages } from '@/features/profile/pickImages';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useResponsive } from '@/hooks/useResponsive';
import { PROVINCES } from '@/lib/provinces';
import { queryKeys } from '@/lib/queryKeys';
import { messages } from '@/lib/validators';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, hitSlop, radius, spacing, touchTarget } from '@/theme';

const CITY_OPTIONS = PROVINCES.map((province) => ({
  label: province,
  value: province,
}));

const parseBirthday = (value?: string) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : new Date(2000, 0, 1);
};

export default function UserProfileScreen() {
  const router = useAppRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { gutter, contentStyle, cardWidth, type, width } = useResponsive();
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const userId = user?.id ?? '';

  const [name, setName] = useState(user?.name ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [gender, setGender] = useState(user?.gender ?? true);
  const [dateOfBirth, setDateOfBirth] = useState(parseBirthday(user?.dateOfBirth));
  const [description, setDescription] = useState(user?.description ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addingImages, setAddingImages] = useState(false);
  const [preview, setPreview] = useState<ImageModel | null>(null);

  const imagesQuery = useQuery({
    queryKey: queryKeys.userImages(userId),
    enabled: Boolean(userId),
    queryFn: async () => (await userService.getImagesOfUser(userId)).content,
  });

  const images = imagesQuery.data ?? [];

  if (!user) return null;

  const tile = cardWidth(spacing.sm);
  const previewHeight = Math.round(Math.min(width * 0.55, 420));

  const chooseAvatar = async () => {
    try {
      const picked = await pickAvatar();
      if (picked) setAvatar(picked.imageLink);
    } catch {
      toast.show('Không thể chọn ảnh', 'error');
    }
  };

  const addGalleryImages = async () => {
    if (addingImages) return;
    try {
      const picked = await pickGalleryImages();
      if (picked.length === 0) return;
      setAddingImages(true);
      await imageService.addMulti(
        picked.map((image) => ({ userId, imageLink: image.imageLink })),
      );
      await queryClient.invalidateQueries({
        queryKey: queryKeys.userImages(userId),
      });
      toast.show('Thêm thành công!', 'success');
    } catch {
      toast.show('Thêm ảnh thất bại', 'error');
    } finally {
      setAddingImages(false);
    }
  };

  const removeImage = async (image: ImageModel) => {
    try {
      await imageService.remove(image.id);
      setPreview(null);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.userImages(userId),
      });
      toast.show('Xoá thành công!', 'success');
    } catch {
      toast.show('Xoá thất bại!', 'error');
    }
  };

  const save = async () => {
    if (saving) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(messages.nameNull);
      return;
    }
    setNameError(null);

    setSaving(true);
    try {
      await userService.updateProfile({
        name: trimmedName,
        dateOfBirth: dateOfBirth.toISOString(),
        city,
        gender,
        avatar,
        description,
      });
      await refreshUser();
      toast.show('Cập nhật thông tin thành công', 'success');
      router.back();
    } catch {
      toast.show('Cập nhật thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Thông tin tài khoản" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.column, contentStyle]}>
            <View style={styles.avatarWrap}>
              <Avatar uri={avatar || null} name={name} size={124} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Chọn ảnh đại diện"
                hitSlop={hitSlop.sm}
                onPress={() => void chooseAvatar()}
                style={({ pressed }) => [
                  styles.cameraButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="camera" size={18} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.card}>
              <View style={styles.imagesHeader}>
                <Text style={[styles.imagesTitle, type.title3]}>Hình ảnh</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Thêm ảnh"
                  accessibilityState={{ disabled: addingImages }}
                  hitSlop={hitSlop.sm}
                  disabled={addingImages}
                  onPress={() => void addGalleryImages()}
                  style={({ pressed }) => [
                    styles.iconButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={22}
                    color={addingImages ? colors.textFaint : colors.primaryAction}
                  />
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageRow}
              >
                {imagesQuery.isPending ? (
                  <Text style={styles.imageEmpty}>Đang tải ảnh...</Text>
                ) : imagesQuery.isError && images.length === 0 ? (
                  <View style={styles.imagesError}>
                    <Text style={styles.imageEmpty}>
                      Không tải được ảnh của bạn.
                    </Text>
                    <Button
                      label="Thử lại"
                      variant="outline"
                      size="sm"
                      fullWidth={false}
                      onPress={() => void imagesQuery.refetch()}
                    />
                  </View>
                ) : images.length === 0 ? (
                  <Text style={styles.imageEmpty}>Chưa có hình ảnh nào</Text>
                ) : (
                  images.map((image) => (
                    <Pressable
                      key={image.id}
                      accessibilityRole="image"
                      accessibilityLabel="Xem ảnh lớn"
                      onPress={() => setPreview(image)}
                      style={({ pressed }) => pressed && styles.pressed}
                    >
                      <Image
                        source={{ uri: image.imageLink }}
                        style={[styles.userImage, { width: tile, height: Math.round(tile * 0.75) }]}
                        contentFit="cover"
                        transition={140}
                      />
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </View>

            <View style={[styles.card, styles.form]}>
              <SectionHeader title="Hồ sơ" icon="person-outline" />

              <TextField
                variant="floating"
                label="Tên"
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  if (value.trim()) setNameError(null);
                }}
                maxLength={30}
                error={nameError}
              />

              <SelectField
                variant="floating"
                label="Thành phố"
                placeholder="Chọn thành phố"
                value={city}
                options={CITY_OPTIONS}
                onChange={setCity}
              />

              <DatePickerField
                variant="floating"
                label="Ngày sinh"
                placeholder="Chọn ngày"
                value={dateOfBirth}
                onChange={setDateOfBirth}
                minimumYear={currentYear - 100}
                maximumYear={currentYear + 1}
              />

              <View style={styles.genderBlock}>
                <Text style={styles.fieldLabel}>Giới tính</Text>
                <View style={styles.genderRow}>
                  <Chip
                    label="Nam"
                    selected={gender}
                    onPress={() => setGender(true)}
                  />
                  <Chip
                    label="Nữ"
                    selected={!gender}
                    onPress={() => setGender(false)}
                  />
                </View>
              </View>

              <TextField
                label="Giới thiệu"
                value={description}
                onChangeText={setDescription}
                placeholder="Giới thiệu bản thân bạn"
                maxLength={1000}
                multiline
                variant="floating"
                containerStyle={styles.description}
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <View style={styles.footerInner}>
            <Button
              label="CẬP NHẬT"
              size="lg"
              loading={saving}
              onPress={() => void save()}
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={preview !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreview(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng ảnh"
            style={styles.modalBackdrop}
            onPress={() => setPreview(null)}
          />
          {preview ? (
            <View style={[styles.modalCard, contentStyle]}>
              <Image
                source={{ uri: preview.imageLink }}
                style={[styles.modalImage, { height: previewHeight }]}
                contentFit="contain"
              />
              <View style={styles.modalActions}>
                <Button
                  label="Xoá ảnh"
                  variant="danger"
                  size="md"
                  onPress={() => void removeImage(preview)}
                  style={styles.modalButton}
                />
                <Button
                  label="Đóng"
                  variant="secondary"
                  size="md"
                  onPress={() => setPreview(null)}
                  style={styles.modalButton}
                />
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { paddingVertical: spacing.sm },
  column: { gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  form: { gap: spacing.md },
  pressed: { opacity: 0.65 },
  avatarWrap: {
    alignSelf: 'center',
    marginVertical: spacing.sm,
  },
  cameraButton: {
    position: 'absolute',
    right: -6,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imagesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: touchTarget - 8,
  },
  imagesTitle: { color: colors.text, flexShrink: 1 },
  iconButton: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  imageEmpty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  imagesError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userImage: {
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  genderBlock: { gap: spacing.xs },
  // Matches the lifted label inside the floating fields above it.
  fieldLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.3,
    color: colors.textSecondary,
  },
  genderRow: { flexDirection: 'row', gap: spacing.sm },
  description: { minHeight: 180 },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerInner: { maxWidth: 420, width: '100%', alignSelf: 'center' },
  modalRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.scrim,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  modalImage: {
    width: '100%',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
  modalButton: { flex: 1 },
});
