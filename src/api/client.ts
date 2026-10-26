import { create, isAxiosError } from 'axios';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import { API_URL } from './endpoints';

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const http = create({
  baseURL: API_URL.accounts.replace('/accounts', ''),
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json; charset=UTF-8',
  },
});

http.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `bearer ${accessToken}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

const toApiError = (error: unknown): ApiError => {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; title?: string; errors?: Record<string, string[]> }
      | string
      | undefined;

    if (typeof data === 'string' && data.length > 0 && data.length < 300) {
      return new ApiError(data, error.response?.status);
    }
    if (data && typeof data === 'object') {
      const firstValidationError = data.errors
        ? Object.values(data.errors).flat()[0]
        : undefined;
      const message =
        firstValidationError ?? data.message ?? data.title ?? error.message;
      return new ApiError(message, error.response?.status);
    }
    return new ApiError(error.message, error.response?.status);
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

export const apiPut = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
) => unwrap<T>(http.put<T>(url, data, config));

export const apiDelete = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
) => unwrap<T>(http.delete<T>(url, { ...config, data }));

export const isSuccessStatus = (status: number, accepted: number[]) =>
  accepted.includes(status);

export const buildQuery = (
  params: Record<string, string | number | boolean | undefined | null>,
) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    search.append(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};
