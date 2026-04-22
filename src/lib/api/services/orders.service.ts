import { apiClient } from "../client";
import type { Order } from "@/types";

export interface CreateOrderPayload {
  items: Array<{ productId: string; quantity: number }>;
  deliveryAddress?: string;
  deliveryMethod?: string;
  notes?: string;
  voucherCode?: string;
}

export interface InitiatePaymentResponse {
  authorizationUrl: string;
  reference: string;
  accessCode: string;
}

export interface VerifyPaymentResponse {
  id: string;
  status: string;
  amount: string;
  reference: string;
  provider: string;
}

export interface CreateDisputePayload {
  orderId: string;
  reason: string;
  description?: string;
  accountDetails?: string;
  proofUrls?: string[];
}

export const ordersService = {
  create: async (payload: CreateOrderPayload): Promise<Order> => {
    const { data } = await apiClient.post<Order>("/orders", payload);
    return data;
  },

  getMyOrders: async (): Promise<Order[]> => {
    const { data } = await apiClient.get<Order[]>("/orders/my-orders");
    return data;
  },

  getById: async (id: string): Promise<Order> => {
    const { data } = await apiClient.get<Order>(`/orders/${id}`);
    return data;
  },

  initiatePayment: async (orderId: string): Promise<InitiatePaymentResponse> => {
    const { data } = await apiClient.post<InitiatePaymentResponse>("/payments/initialize", { orderId });
    return data;
  },

  verifyPayment: async (reference: string): Promise<VerifyPaymentResponse> => {
    const { data } = await apiClient.get<VerifyPaymentResponse>(`/payments/verify/${reference}`);
    return data;
  },

  createDispute: async (payload: CreateDisputePayload): Promise<void> => {
    await apiClient.post("/disputes", payload);
  },
};
