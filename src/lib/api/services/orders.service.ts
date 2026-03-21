import { apiClient } from "../client";
import type { Order, PaginatedResponse } from "@/types";

export interface CreateOrderPayload {
  items: Array<{ productId: string; quantity: number }>;
  deliveryAddress?: string;
  voucherCode?: string;
}
export interface InitiatePaymentResponse {
  orderId: string; reference: string; authorizationUrl: string; accessCode: string;
}

export const ordersService = {
  create: async (payload: CreateOrderPayload): Promise<Order> => {
    const { data } = await apiClient.post<Order>("/orders", payload);
    return data;
  },
  initiatePayment: async (orderId: string): Promise<InitiatePaymentResponse> => {
    const { data } = await apiClient.post<InitiatePaymentResponse>(`/orders/${orderId}/initiate-payment`);
    return data;
  },
  verifyPayment: async (reference: string): Promise<Order> => {
    const { data } = await apiClient.post<Order>(`/orders/verify-payment`, { reference });
    return data;
  },
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Order>> => {
    const { data } = await apiClient.get<PaginatedResponse<Order>>("/orders", { params: { page, limit } });
    return data;
  },
  getById: async (id: string): Promise<Order> => {
    const { data } = await apiClient.get<Order>(`/orders/${id}`);
    return data;
  },
};
