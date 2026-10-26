export const formatVnd = (value: number | null | undefined): string => {
  const amount = Math.round(Number(value ?? 0));
  const sign = amount < 0 ? '-' : '';
  const digits = Math.abs(amount).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}${grouped} đ`;
};

export const formatNumber = (value: number | null | undefined): string => {
  const amount = Number(value ?? 0);
  const digits = Math.round(amount).toString();
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const parseAmount = (value: string): number => {
  const digits = value.replace(/[^0-9]/g, '');
  return digits ? Number(digits) : 0;
};

const pad = (value: number) => value.toString().padStart(2, '0');

export const formatDate = (value?: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

export const formatDateTime = (value?: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const formatTime = (value?: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const formatTimeAmPm = (value?: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const hours = date.getHours();
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const suffix = hours < 12 ? 'AM' : 'PM';
  return `${pad(displayHour)}:${pad(date.getMinutes())} ${suffix}`;
};

export const formatDateTimeAmPm = (value?: string | null): string => {
  if (!value) return '';
  return `${formatDate(value)}, ${formatTimeAmPm(value)}`;
};

export const isEmptyDate = (value?: string | null): boolean =>
  !value || value.startsWith('0001-01-01');

export const addHours = (value: string, hours: number): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  date.setHours(date.getHours() + hours);
  return date.toISOString();
};

export const formatHour = (hour: number): string => `${pad(hour)}:00`;

export const formatDayOfWeek = (day: number): string => {
  const days = [
    'Chủ nhật',
    'Thứ hai',
    'Thứ ba',
    'Thứ tư',
    'Thứ năm',
    'Thứ sáu',
    'Thứ bảy',
  ];
  return days[day] ?? '';
};

export const secondsBetween = (from: string, to: string): number => {
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.floor((end - start) / 1000);
};

export const formatCountdown = (totalSeconds: number): string => {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

export const formatCountdownShort = (totalSeconds: number): string => {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

export const initialsOf = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const displayNameOfGame = (game?: {
  displayName?: string;
  name?: string;
  otherName?: string;
}): string => game?.displayName || game?.name || game?.otherName || '';
