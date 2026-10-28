import { create, isAxiosError } from 'axios';
import type { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { API_ROOT } from './endpoints';
import type { ProblemDetails, TokenPair } from './v2/types';

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

let session: SessionTokens | null = null;
let onUnauthorized: (() => void) | null = null;
let onTokensRefreshed: ((tokens: SessionTokens) => void) | null = null;
let refreshPromise: Promise<SessionTokens | null> | null = null;

export const setSessionTokens = (tokens: SessionTokens | null) => {
  session = tokens;
};

export const getSessionTokens = () => session;

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

export const setTokenRefreshHandler = (
  handler: ((tokens: SessionTokens) => void) | null,
) => {
  onTokensRefreshed = handler;
};

export class ApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const http = create({
  baseURL: API_ROOT,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json; charset=UTF-8',
  },
});

const refreshClient = create({
  baseURL: API_ROOT,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json; charset=UTF-8',
  },
});

http.interceptors.request.use((config) => {
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

const refreshSession = (): Promise<SessionTokens | null> => {
  const refreshToken = session?.refreshToken;
  if (!refreshToken) return Promise.resolve(null);

  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<TokenPair>('/auth/refresh', { refreshToken })
      .then(({ data }) => {
        const next: SessionTokens = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
        session = next;
        onTokensRefreshed?.(next);
        return next;
      })
      .catch(() => {
        session = null;
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const config = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const isAuthRequest = Boolean(config?.url?.startsWith('/auth/'));

    if (status === 401 && config && !config._retry && !isAuthRequest) {
      config._retry = true;
      const tokens = await refreshSession();
      if (tokens) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return http.request(config);
      }
    }

    if (status === 401 && !isAuthRequest) {
      onUnauthorized?.();
    }

    return Promise.reject(error);
  },
);

const toApiError = (error: unknown): ApiError => {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as ProblemDetails | string | undefined;

    if (typeof data === 'string' && data.length > 0 && data.length < 300) {
      return new ApiError(data, status);
    }

    if (data && typeof data === 'object') {
      const validationMessage =
        data.details?.errors?.[0] ??
        (data.errors ? Object.values(data.errors).flat()[0] : undefined);
      const message =
        validationMessage ??
        data.detail ??
        data.message ??
        data.title ??
        error.message;
      return new ApiError(message, data.status ?? status, data.code);
    }

    if (!error.response) {
      return new ApiError(
        'Không thể kết nối máy chủ. Kiểm tra EXPO_PUBLIC_API_URL và kết nối mạng.',
      );
    }

    return new ApiError(error.message, status);
  }

  if (error instanceof Error) return new ApiError(error.message);
  return new ApiError('Đã có lỗi xảy ra, vui lòng thử lại.');
};

const unwrap = async <T>(
  request: Promise<{ data: T; status: number }>,
): Promise<T> => {
  try {
    const response = await request;
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const apiGet = <T>(url: string, config?: AxiosRequestConfig) =>
  unwrap<T>(http.get<T>(url, config));

export const apiPost = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
) => unwrap<T>(http.post<T>(url, data, config));

export const apiPatch = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
) => unwrap<T>(http.patch<T>(url, data, config));

export const apiDelete = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
) => unwrap<T>(http.delete<T>(url, { ...config, data }));

export const buildQuery = (
  params: Record<string, string | number | boolean | undefined | null>,
) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};
