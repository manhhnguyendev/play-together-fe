import { ApiError, apiPost } from '../client';
import { API_URL } from '../endpoints';
import type {
  ChangePasswordModel,
  EmailModel,
  LoginGoogleModel,
  LoginModel,
  RegisterModel,
  ResetPasswordModel,
  TokenModel,
} from '../types';
import type {
  AuthResponse,
  ForgotPasswordResponse,
  TokenPair,
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

  requestPasswordReset: (email: string) =>
    apiPost<ForgotPasswordResponse>(`${API_URL.auth}/password/forgot`, {
      email,
    }),

  resetPasswordToken: async (body: EmailModel) => {
    const result = await apiPost<ForgotPasswordResponse>(
      `${API_URL.auth}/password/forgot`,
      { email: body.email },
    );
    if (!result.resetToken) {
      throw new ApiError(
        'Mã đặt lại mật khẩu đã được gửi tới email của bạn.',
        202,
      );
    }
    return {
      message: result.resetToken,
      success: true,
      expireDate: '',
    } satisfies TokenModel;
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
