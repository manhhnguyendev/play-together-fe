export const EMAIL_REGEX = /^[a-zA-Z0-9.]+@[a-zA-Z0-9]+\.[a-zA-Z]+/;
export const PASSWORD_REGEX =
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$&*~]).{8,30}$/;

export const messages = {
  emailNull: 'Vui lòng nhập email !',
  invalidEmail: 'Email nhập không đúng định dạng !',
  passNull: 'Vui lòng nhập mật khẩu !',
  invalidPass: 'Mật khẩu 8-30 kí tự có số, chữ hoa & kí tự đặc biệt',
  matchPass: 'Mật khẩu xác nhận không trùng khớp !',
  confirmNull: 'Mật khẩu xác nhận lại chưa được nhập !',
  otpNull: 'Mã OTP chưa đủ 6 kí tự số !',
  nameNull: 'Vui lòng nhập tên',
  birthdayNull: 'Vui lòng nhập ngày sinh',
  cityNull: 'Vui lòng chọn nơi sinh sống',
  required: 'Vui lòng nhập thông tin',
} as const;

export const validateEmail = (value: string): string | null => {
  if (!value.trim()) return messages.emailNull;
  if (!EMAIL_REGEX.test(value.trim())) return messages.invalidEmail;
  return null;
};

export const validatePassword = (value: string): string | null => {
  if (!value) return messages.passNull;
  return null;
};

export const validateStrongPassword = (value: string): string | null => {
  if (!value) return messages.passNull;
  if (!PASSWORD_REGEX.test(value)) return messages.invalidPass;
  return null;
};

export const validateConfirmPassword = (
  password: string,
  confirm: string,
): string | null => {
  if (!confirm) return messages.confirmNull;
  if (password !== confirm) return messages.matchPass;
  return null;
};

export const isSixDigitOtp = (value: string) => /^\d{6}$/.test(value);
