import * as ImagePicker from 'expo-image-picker';

export interface PickedImage {
  uri: string;
  imageLink: string;
}

// Flutter uploaded to Firebase Storage; without that dependency we inline the
// picked file as a data URI so the API still receives a usable image link.
const toImageLink = (asset: ImagePicker.ImagePickerAsset) =>
  asset.base64
    ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`
    : asset.uri;

const toPickedImage = (asset: ImagePicker.ImagePickerAsset): PickedImage => ({
  uri: asset.uri,
  imageLink: toImageLink(asset),
});

export async function pickAvatar(): Promise<PickedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.4,
    base64: true,
  });
  if (result.canceled || !result.assets[0]) return null;
  return toPickedImage(result.assets[0]);
}

export async function pickGalleryImages(): Promise<PickedImage[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.4,
    base64: true,
  });
  if (result.canceled) return [];
  return result.assets.map(toPickedImage);
}
