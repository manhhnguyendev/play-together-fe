import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
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
import { imageService } from '@/api/services/content';
import { userService } from '@/api/services/users';
import type { ImageModel } from '@/api/types';
import {
  AppBar,
  Avatar,
  Button,
  DatePickerField,
  SelectField,
  TextField,
  useToast,
} from '@/components/ui';
import { pickAvatar, pickGalleryImages } from '@/features/profile/pickImages';
import { PROVINCES } from '@/lib/provinces';
import { queryKeys } from '@/lib/queryKeys';
import { messages } from '@/lib/validators';
import { useAuthStore } from '@/store/auth';
import { colors, fonts, radius, spacing } from '@/theme';

const CITY_OPTIONS = PROVINCES.map((province) => ({
  label: province,
  value: province,
}));

const parseBirthday = (value?: string) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : new Date(2000, 0, 1);
};

export default function UserProfileScreen() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <AppBar title="Thông tin tài khoản" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarWrap}>
          <Avatar uri={avatar || null} name={name} size={130} />
          <Pressable
            onPress={() => void chooseAvatar()}
            style={({ pressed }) => [
              styles.cameraButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="camera" size={18} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.imagesHeader}>
          <Text style={styles.sectionTitle}>Hình ảnh</Text>
          <Pressable
            hitSlop={8}
            disabled={addingImages}
            onPress={() => void addGalleryImages()}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={addingImages ? colors.textFaint : colors.text}
            />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imageRow}
        >
          {images.length === 0 ? (
            <Text style={styles.imageEmpty}>Chưa có hình ảnh nào</Text>
          ) : (
            images.map((image) => (
              <Pressable
                key={image.id}
                onPress={() => setPreview(image)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Image
                  source={{ uri: image.imageLink }}
                  style={styles.userImage}
                  contentFit="cover"
                />
              </Pressable>
            ))
          )}
        </ScrollView>

        <View style={styles.form}>
          <TextField
            label="Tên"
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (value.trim()) setNameError(null);
            }}
            placeholder="Nhập vào tên"
            maxLength={30}
            error={nameError}
          />

          <SelectField
            label="Thành phố của bạn"
            placeholder="Chọn nơi sinh sống"
            value={city}
            options={CITY_OPTIONS}
            onChange={setCity}
          />

          <DatePickerField
            label="Sinh nhật của bạn"
            value={dateOfBirth}
            onChange={setDateOfBirth}
            minimumYear={currentYear - 100}
            maximumYear={currentYear + 1}
          />

          <View>
            <Text style={styles.fieldLabel}>Giới tính:</Text>
            <View style={styles.genderRow}>
              <GenderOption
                label="Nam"
                selected={gender}
                onPress={() => setGender(true)}
              />
              <GenderOption
                label="Nữ"
                selected={!gender}
                onPress={() => setGender(false)}
              />
            </View>
          </View>

          <TextField
            label="Giới thiệu sơ lược"
            value={description}
            onChangeText={setDescription}
            placeholder="Giới thiệu bản thân bạn ..."
            maxLength={1000}
            multiline
            containerStyle={styles.description}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="CẬP NHẬT"
          size="lg"
          loading={saving}
          onPress={() => void save()}
        />
      </View>

      <Modal
        visible={preview !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreview(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setPreview(null)}
          />
          {preview ? (
            <View style={styles.modalCard}>
              <Image
                source={{ uri: preview.imageLink }}
                style={styles.modalImage}
                contentFit="contain"
              />
              <View style={styles.modalActions}>
                <Button
                  label="Xoá ảnh"
                  variant="danger"
                  onPress={() => void removeImage(preview)}
                  style={styles.modalButton}
                />
                <Button
                  label="Đóng"
                  variant="secondary"
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

function GenderOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.genderOption, pressed && styles.pressed]}
    >
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={20}
        color={selected ? '#320444' : colors.textMuted}
      />
      <Text style={styles.genderLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.md, paddingBottom: spacing.lg },
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
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imagesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  imageRow: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 92,
    alignItems: 'center',
  },
  imageEmpty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  userImage: {
    width: 120,
    height: 88,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  form: { gap: spacing.md, marginTop: spacing.sm },
  fieldLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  genderRow: { flexDirection: 'row', gap: spacing.xl },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  genderLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  description: { minHeight: 180 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
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
    backgroundColor: colors.overlay,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  modalImage: {
    width: '100%',
    height: 320,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
  modalButton: { flex: 1 },
});
