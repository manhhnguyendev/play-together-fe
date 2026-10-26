export const OTP_LENGTH = 6;

export const generateOtp = (length = OTP_LENGTH): string =>
  Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');

// v2 has no OTP delivery endpoint; the code is verified on-device and surfaced
// to the user by the calling screen.
export async function deliverOtp(
  email: string,
  code: string,
): Promise<boolean> {
  if (__DEV__) {
    console.warn(`[OTP] ${email} -> ${code}`);
  }
  return false;
}
