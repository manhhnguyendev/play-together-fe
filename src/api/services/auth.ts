import { apiGet, apiPost, apiPut, buildQuery } from '../client';
import { API_URL } from '../endpoints';
import type {
  ChangePasswordModel,
  EmailModel,
  LoginGoogleModel,
  LoginModel,
  RegisterModel,
  ResetPasswordModel,
  SendEmailModel,
  TokenModel,
} from '../types';

export const authService = {
  login: (body: LoginModel) =>
    apiPost<TokenModel>(`${API_URL.accounts}/login-user`, body),

  loginGoogle: (body: LoginGoogleModel) =>
    apiPost<TokenModel>(`${API_URL.accounts}/login-google`, body),

  register: async (body: RegisterModel) => {
    await apiPost(`${API_URL.accounts}/register-user`, body);
  },

  logout: async () => {
    await apiPut(`${API_URL.accounts}/logout`);
  },

  checkEmail: (email: string) =>
    apiGet<string>(
      `${API_URL.accounts}/check-exist-email${buildQuery({ email })}`,
    ),

  sendEmail: async (body: SendEmailModel) => {
    await apiPost(`${API_URL.email}/send`, body);
  },

  resetPassword: async (body: ResetPasswordModel) => {
    await apiPut(`${API_URL.accounts}/reset-password`, body);
  },

  resetPasswordToken: (body: EmailModel) =>
    apiPut<TokenModel>(`${API_URL.accounts}/reset-password-token`, body),

  changePassword: async (body: ChangePasswordModel) => {
    await apiPut(`${API_URL.accounts}/change-password`, body);
  },
};
