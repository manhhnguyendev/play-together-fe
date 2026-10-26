import { authService } from '@/api/services/auth';

export const OTP_LENGTH = 6;

export const generateOtp = (length = OTP_LENGTH): string =>
  Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  await authService.sendEmail({
    toEmail: email,
    subject: 'Mã xác thực Play Together',
    body: `Xin chào,\n\nMã OTP của bạn là: ${code}\n\nVui lòng không chia sẻ mã này với bất kỳ ai.`,
  });
}

export async function deliverOtp(
  email: string,
  code: string,
): Promise<boolean> {
  try {
    await sendOtpEmail(email, code);
    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn(`[OTP] Khong gui duoc email, ma OTP DEV: ${code}`);
      return false;
    }
    throw error;
  }
}
