import { ApiError, apiPost } from '../client';
import { API_URL } from '../endpoints';
import type {
  ChangePasswordModel,
  LoginGoogleModel,
  LoginModel,
  RegisterModel,
  ResetPasswordModel,
} from '../types';
import type {
  AuthResponse,
  OtpPurpose,
  RequestOtpResponse,
  TokenPair,
  VerifyOtpResponse,
} from '../v2/types';

const toDateOnly = (value: string): string => value.slice(0, 10);

export const authService = {
  login: (body: LoginModel) =>
    apiPost<AuthResponse>(`${API_URL.auth}/login`, body),

  loginGoogle: (body: LoginGoogleModel) =>
    apiPost<AuthResponse>(`${API_URL.auth}/google`, {
      idToken: body.idToken,
    }),

  register: (body: RegisterModel) =>
    apiPost<AuthResponse>(`${API_URL.auth}/register`, {
      email: body.email,
      password: body.password,
      name: body.name,
      city: body.city,
      dateOfBirth: toDateOnly(body.dateOfBirth),
      gender: body.gender ? 'MALE' : 'FEMALE',
    }),

  logout: async (refreshToken: string | null) => {
    if (!refreshToken) return;
    await apiPost<void>(`${API_URL.auth}/logout`, { refreshToken });
  },

  refresh: (refreshToken: string) =>
    apiPost<TokenPair>(`${API_URL.auth}/refresh`, { refreshToken }),

  requestOtp: (email: string, purpose: OtpPurpose) =>
    apiPost<RequestOtpResponse>(`${API_URL.auth}/otp/request`, {
      email,
      purpose,
    }),

  verifyOtp: async (email: string, purpose: OtpPurpose, code: string) => {
    const result = await apiPost<VerifyOtpResponse>(
      `${API_URL.auth}/otp/verify`,
      { email, purpose, code },
    );
    if (purpose === 'PASSWORD_RESET' && !result.resetToken) {
      throw new ApiError('Không nhận được mã đặt lại mật khẩu.', 500);
    }
    return result;
  },

  resetPassword: async (body: ResetPasswordModel) => {
    await apiPost<void>(`${API_URL.auth}/password/reset`, {
      token: body.token,
      newPassword: body.newPassword,
    });
  },

  changePassword: (body: ChangePasswordModel) =>
    apiPost<AuthResponse>(`${API_URL.auth}/password/change`, {
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    }),
};
