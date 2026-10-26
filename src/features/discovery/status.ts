import { colors } from '@/theme';

const STATUS_LABELS: Record<string, string> = {
  Online: 'Đang online',
  Offline: 'Đang offline',
  Hiring: 'Đang được thuê',
  Processing: 'Đang thương lượng',
  Maintain: 'Đang bảo trì',
};

const STATUS_COLORS: Record<string, string> = {
  Online: colors.success,
  Offline: colors.grey,
  Hiring: colors.danger,
  Processing: colors.warning,
  Maintain: colors.textMuted,
};

export const playerStatusLabel = (status?: string | null) =>
  (status && STATUS_LABELS[status]) || status || '';

export const playerStatusColor = (status?: string | null) =>
  (status && STATUS_COLORS[status]) || colors.text;

export const isPlayerBusy = (status?: string | null) =>
  status === 'Hiring' || status === 'Processing';
