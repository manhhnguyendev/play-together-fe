import { apiGet, apiPost, apiPut, buildQuery } from '../client';
import { API_URL } from '../endpoints';
import type {
  AcceptOrderModel,
  ApiListResponse,
  ApiResponse,
  CancelOrderModel,
  CreateOrderModel,
  FinishSoonOrderModel,
  OrderDetailModel,
  OrderModel,
  RejectOrderModel,
} from '../types';

export const orderService = {
  getById: (orderId: string) =>
    apiGet<ApiResponse<OrderModel>>(`${API_URL.orders}/${orderId}`),

  getDetailById: (orderId: string) =>
    apiGet<ApiResponse<OrderDetailModel>>(
      `${API_URL.orders}/detail/${orderId}`,
    ),

  getRequestsOfPlayer: (status: string) =>
    apiGet<ApiListResponse<OrderModel>>(
      `${API_URL.users}/orders/requests${buildQuery({
        IsNew: true,
        PageSize: 3,
        Status: status,
      })}`,
    ),

  getOrdersOfUser: (status: string) =>
    apiGet<ApiListResponse<OrderModel>>(
      `${API_URL.users}/orders/${buildQuery({
        IsNew: true,
        PageSize: 3,
        Status: status,
      })}`,
    ),

  getAllCreated: (pageSize: number) =>
    apiGet<ApiListResponse<OrderModel>>(
      `${API_URL.users}/orders${buildQuery({ IsNew: true, PageSize: pageSize })}`,
    ),

  getAllReceived: (pageSize: number) =>
    apiGet<ApiListResponse<OrderModel>>(
      `${API_URL.users}/orders/requests${buildQuery({
        IsNew: true,
        PageSize: pageSize,
      })}`,
    ),

  create: (toUserId: string, body: CreateOrderModel) =>
    apiPost<ApiResponse<OrderModel>>(
      `${API_URL.users}/orders/${toUserId}`,
      body,
    ),

  cancel: async (orderId: string, body: CancelOrderModel) => {
    await apiPut(`${API_URL.users}/orders/cancel/${orderId}`, body);
  },

  accept: async (orderId: string, body: AcceptOrderModel) => {
    await apiPut(`${API_URL.users}/orders/${orderId}/process`, body);
  },

  reject: async (orderId: string, body: RejectOrderModel) => {
    await apiPut(`${API_URL.users}/orders/${orderId}/process`, body);
  },

  finish: async (orderId: string) => {
    await apiPut(`${API_URL.orders}/finish/${orderId}`);
  },

  finishSoon: async (orderId: string, body: FinishSoonOrderModel) => {
    await apiPut(`${API_URL.orders}/finish-soon/${orderId}`, body);
  },
};
