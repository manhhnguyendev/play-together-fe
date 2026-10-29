import { apiGet, apiPost, buildQuery } from '../client';
import { API_URL } from '../endpoints';
import type {
  AcceptOrderModel,
  CancelOrderModel,
  CreateOrderModel,
  FinishSoonOrderModel,
  OrderDetailModel,
  RejectOrderModel,
} from '../types';
import {
  legacyList,
  legacyResponse,
  toLegacyOrder,
  toLegacyOrderRating,
  toLegacyReportOrder,
  toWireOrderStatus,
} from '../v2/mappers';
import type {
  OrderHistoryItem,
  OrderView,
  Paginated,
  RatingView,
  ReportView,
} from '../v2/types';

const fetchOrder = (orderId: string) =>
  apiGet<OrderView>(`${API_URL.orders}/${orderId}`);

const fetchOrders = async (path: string) =>
  legacyList(
    await apiGet<Paginated<OrderView>>(path),
    toLegacyOrder,
  );

const statusQuery = (status: string) =>
  buildQuery({ status: toWireOrderStatus(status), pageSize: 3 });

export const orderService = {
  getById: async (orderId: string) =>
    legacyResponse(toLegacyOrder(await fetchOrder(orderId))),

  getDetailById: async (orderId: string) => {
    const order = await fetchOrder(orderId);
    const [ratings, reports] = await Promise.all([
      order.hasRated
        ? apiGet<RatingView[]>(`${API_URL.orders}/${orderId}/ratings`)
        : Promise.resolve<RatingView[]>([]),
      apiGet<Paginated<ReportView>>(
        `${API_URL.reports}/mine${buildQuery({
          scope: 'submitted',
          orderId,
          pageSize: 100,
        })}`,
      ),
    ]);

    const detail: OrderDetailModel = {
      ...toLegacyOrder(order),
      ratings: ratings.map(toLegacyOrderRating),
      reports: reports.items.map(toLegacyReportOrder),
    };

    return legacyResponse(detail);
  },

  getHistory: async (orderId: string) =>
    apiGet<OrderHistoryItem[]>(`${API_URL.orders}/${orderId}/history`),

  getRequestsOfPlayer: (status: string) =>
    fetchOrders(`${API_URL.orders}/requests${statusQuery(status)}`),

  getOrdersOfUser: (status: string) =>
    fetchOrders(`${API_URL.orders}${statusQuery(status)}`),

  getAllCreated: (pageSize: number) =>
    fetchOrders(`${API_URL.orders}${buildQuery({ pageSize })}`),

  getAllReceived: (pageSize: number) =>
    fetchOrders(`${API_URL.orders}/requests${buildQuery({ pageSize })}`),

  create: async (toUserId: string, body: CreateOrderModel) =>
    legacyResponse(
      toLegacyOrder(
        await apiPost<OrderView>(API_URL.orders, {
          playerId: toUserId,
          hours: body.totalTimes,
          message: body.message,
          gameIds: body.games.map((game) => game.gameId),
        }),
      ),
    ),

  cancel: async (orderId: string, body: CancelOrderModel) => {
    void body;
    await apiPost<OrderView>(`${API_URL.orders}/${orderId}/cancel`);
  },

  accept: async (orderId: string, body: AcceptOrderModel) => {
    void body;
    await apiPost<OrderView>(`${API_URL.orders}/${orderId}/accept`);
  },

  reject: async (orderId: string, body: RejectOrderModel) => {
    await apiPost<OrderView>(`${API_URL.orders}/${orderId}/reject`, {
      reason: body.reason,
    });
  },

  finish: async (orderId: string) => {
    await apiPost<OrderView>(`${API_URL.orders}/${orderId}/complete`);
  },

  finishSoon: async (orderId: string, body: FinishSoonOrderModel) => {
    await apiPost<OrderView>(`${API_URL.orders}/${orderId}/end-early`, {
      reason: body.reason,
    });
  },
};
